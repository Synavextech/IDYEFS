import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface TicketData {
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    userName: string;
    userEmail: string;
    category: string;
    amountPaid: number;
    bookingId: string;
}

export const generateTicketPDF = (data: TicketData) => {
    const doc = new jsPDF();

    // Dark Background for Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 60, 'F');

    // Website Title / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WYC', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('World Youth Centre', 20, 38);
    // doc.text('& Empowerment Forum', 20, 44);

    // Ticket Header
    doc.setFontSize(30);
    doc.text('OFFICIAL TICKET', 120, 35);

    // Event Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT DETAILS', 20, 80);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 82, 190, 82);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.eventTitle, 20, 95);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Date: ${data.eventDate}`, 20, 105);
    doc.text(`Location: ${data.eventLocation}`, 20, 112);

    // Attendee Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ATTENDEE INFORMATION', 20, 130);
    doc.line(20, 132, 190, 132);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.userName}`, 20, 145);
    doc.text(`Email: ${data.userEmail}`, 20, 152);
    doc.text(`Category: ${data.category}`, 20, 159);
    doc.text(`Amount Paid: $${data.amountPaid.toFixed(2)}`, 20, 166);

    // Booking ID / QR Area (Placeholder)
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Booking ID: ${data.bookingId}`, 20, 185);

    // Footer
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 260, 210, 37, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text('Please present this ticket at the event entrance.', 105, 275, { align: 'center' });
    doc.text('Thank you for being part of the global movement.', 105, 282, { align: 'center' });

    // Save the PDF
    doc.save(`Ticket_${data.eventTitle.replace(/\s+/g, '_')}.pdf`);
};
