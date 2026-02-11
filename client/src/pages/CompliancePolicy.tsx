import React from 'react';

export default function CompliancePolicy() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-slate-900">Compliance Policy</h1>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-700">
                    At World Youth Centre (WYC), we are committed to conducting our operations with integrity and in compliance with all applicable laws, regulations, and ethical standards.
                </p>
            </div>

            <h2 className="text-2xl font-semibold mt-6 mb-4 text-slate-800">Our Commitment</h2>
            <p className="mb-4 text-slate-700">
                WYC is dedicated to maintaining the highest standards of compliance in all our activities. We expect all our employees, volunteers, partners, and stakeholders to adhere to these standards.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4 text-slate-800">Key Areas of Compliance</h2>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
                <li><strong>Data Protection & Privacy:</strong> We strictly adhere to data protection laws to ensure the security and privacy of personal information.</li>
                <li><strong>Financial Integrity:</strong> We are committed to transparency in our financial reporting and operations, ensuring all funds are used for their intended purposes.</li>
                <li><strong>Anti-Discrimination:</strong> We foster an inclusive environment free from discrimination, harassment, and bias.</li>
                <li><strong>Child Safety:</strong> The safety and well-being of youth participating in our programs is our top priority. We have strict policies in place to safeguard children.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4 text-slate-800">Reporting Concerns</h2>
            <p className="mb-4 text-slate-700">
                If you suspect any violation of our compliance policy or legal obligations, we encourage you to report it immediately. All reports will be handled confidentially and investigated thoroughly.
            </p>
            <p className="mb-4 text-slate-700">
                You can report concerns to: <a href="mailto:support@worldyouthcentre.org" className="text-blue-600 hover:underline">support@worldyouthcentre.org</a>
            </p>
        </div>
    );
}