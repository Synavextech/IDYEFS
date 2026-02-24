import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stripe Setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Auth Persistence Endpoints
app.post('/api/auth/set-session', (req, res) => {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'Missing tokens' });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Ensure cookie is available for all routes
        maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
    };

    console.log(`[Server] Setting auth cookies for session (Production: ${process.env.NODE_ENV === 'production'})`);
    res.cookie('sb-access-token', access_token, cookieOptions);
    res.cookie('sb-refresh-token', refresh_token, cookieOptions);

    res.json({ status: 'Session set in cookies' });
});

app.get('/api/auth/get-session', (req, res) => {
    const accessToken = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!accessToken || !refreshToken) {
        console.log('[Server] No auth cookies found');
        return res.status(401).json({ error: 'No session found' });
    }

    console.log('[Server] Auth cookies retrieved successfully');
    res.json({ access_token: accessToken, refresh_token: refreshToken });
});

app.post('/api/auth/clear-session', (req, res) => {
    console.log('[Server] Clearing auth cookies');
    res.clearCookie('sb-access-token', { path: '/' });
    res.clearCookie('sb-refresh-token', { path: '/' });
    res.json({ status: 'Session cleared' });
});

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { eventId, category, amount, userId, bookingId, type = 'event' } = req.body;
    try {
        let productData = {};

        if (type === 'event') {
            // Check if event has already passed
            const { data: eventData, error: eventError } = await supabase
                .from('Event')
                .select('date')
                .eq('id', eventId)
                .single();

            if (eventError || !eventData) {
                console.error('Event fetch error:', eventError);
                return res.status(404).json({ error: "Event not found" });
            }

            const eventDate = new Date(eventData.date);
            const now = new Date();
            if (eventDate < now) {
                return res.status(400).json({ error: "This event has already passed. Registration is closed." });
            }

            productData = {
                name: `Event Booking: ${eventId}`,
                description: `Category: ${category}`,
            };
        } else if (type === 'visa') {
            productData = {
                name: `Visa Invitation Request: ${eventId}`,
                description: 'Official Visa Invitation Letter',
            };
        } else if (type === 'application') {
            productData = {
                name: `Application Donation`,
                description: `Donation for Application`,
            };
        }

        const metadata = {
            bookingId,
            userId,
            eventId: eventId || 'N/A',
            type
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.body.email, // If available
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: productData,
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.VITE_FRONTEND_URL}/upcoming-events?status=success&bookingId=${bookingId}&type=${type}`,
            cancel_url: `${process.env.VITE_FRONTEND_URL}/upcoming-events?status=cancelled&bookingId=${bookingId}&type=${type}&resume=true`,
            metadata
        });
        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook for async confirmation
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { bookingId, type } = session.metadata;

        try {
            if (type === 'event') {
                await supabase.from('Booking').update({ status: 'CONFIRMED' }).eq('id', bookingId);
            } else if (type === 'visa') {
                await supabase.from('VisaInvitation').update({ status: 'PAID', paymentStatus: 'PAID' }).eq('id', bookingId);
            } else if (type === 'application') {
                await supabase.from('Applications').update({ status: 'APPROVED', paymentStatus: 'PAID' }).eq('id', bookingId);
            }
            console.log(`Payment confirmed and DB updated for ${type} ${bookingId}`);
        } catch (dbError) {
            console.error('Database update error in webhook:', dbError);
        }
    }

    res.json({ received: true });
});

// PayPal Webhook for async confirmation
app.post('/api/webhook/paypal', async (req, res) => {
    try {
        const event = req.body;

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
            const resource = event.resource;
            // Depending on PAYPAL setup, the custom_id is usually tracked in purchase_units
            // but webhook payload structure varies a bit depending on order vs capture.
            // Let's check for custom_id commonly placed in resource.custom_id or resource.purchase_units[0].custom_id

            let bookingId = resource.custom_id;

            // If it's an order approved event, custom_id is in purchase_units
            if (!bookingId && resource.purchase_units && resource.purchase_units.length > 0) {
                bookingId = resource.purchase_units[0].custom_id;
            }

            if (bookingId) {
                // We need to attempt updates on all 3 tables since PayPal webhook might not pass the specific type easily in custom_id
                // A better approach is prefixing the custom_id, but assuming standard format here.
                // We will just try all tables safely.
                await supabase.from('Booking').update({ status: 'CONFIRMED' }).eq('id', bookingId);
                await supabase.from('VisaInvitation').update({ status: 'PAID', paymentStatus: 'PAID' }).eq('id', bookingId);
                await supabase.from('Applications').update({ status: 'APPROVED', paymentStatus: 'PAID' }).eq('id', bookingId);

                console.log(`PayPal webhook payment confirmed and DB updated for bookingId: ${bookingId}`);
            } else {
                console.log('PayPal webhook received but no custom_id (bookingId) found in payload', resource);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal Order Verification (Legacy fallback, but secure only if we actually query PayPal API)
// For now, removing DB updates from frontend-driven endpoint to maintain security.
app.post('/api/verify-paypal-order', async (req, res) => {
    try {
        const { orderId, bookingId, type } = req.body;
        // The frontend calls this after the SDK completes.
        // We will rely on the webhook /api/webhook/paypal to actually update the DB.
        // Thus, this endpoint just acknowledges the frontend.
        res.json({ status: 'pending_webhook_confirmation', orderId });
    } catch (error) {
        console.error('PayPal verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
