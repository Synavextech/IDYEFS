import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = 'admin@idyefs.org';
    const password = 'adminPassword123!';
    const name = 'System Admin';

    console.log(`Creating admin user: ${email}`);

    // Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    let userId;

    if (listError) {
        console.error('Error listing users:', listError);
    }

    const existingUser = users?.users.find(u => u.email === email);

    if (existingUser) {
        console.log('User already exists. Promoting to ADMIN...');
        userId = existingUser.id;
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (error) {
            console.error('Error creating user:', error);
            process.exit(1);
        }
        userId = data.user.id;
        console.log('User created successfully.');
    }

    // Upsert into User table with ADMIN role
    const { error: dbError } = await supabase
        .from('User')
        .upsert({
            id: userId,
            email,
            name,
            role: 'ADMIN',
            updatedAt: new Date().toISOString()
        });

    if (dbError) {
        console.error('Error updating User table:', dbError);
        process.exit(1);
    }

    console.log('Admin privileges granted successfully.');
}

createAdmin();
