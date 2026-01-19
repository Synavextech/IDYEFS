import { Link } from "wouter";

export default function Footer() {
    return (
        <footer className="border-t bg-slate-900 text-slate-300 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tighter">IYDEF</h3>
                        <p className="text-sm leading-relaxed">
                            Empowering the next generation of leaders through education, mentorship, and community development.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-white">Home</Link></li>
                            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link href="/events" className="hover:text-white">Events</Link></li>
                            <li><Link href="/membership" className="hover:text-white">Membership</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Contact Info</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Email: contact@iydef.com</li>
                            <li>Phone: +254 (0) 123 456 789</li>
                            <li>Address: Nairobi, Kenya</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
                    <p>© {new Date().getFullYear()} International Youth Development & Empowerment Foundation (IYDEF). All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
