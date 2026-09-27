const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Certificate = require('../models/Certificate');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

function buildCertificatePDF({ userName, eventTitle, certificateNumber, issuedAt }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Maroon-and-gold certificate layout
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FDF8EC');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#7A1F2B');
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(1).stroke('#C9A227');

    doc.fillColor('#7A1F2B').fontSize(30).font('Helvetica-Bold').text('PCTE GROUP OF INSTITUTES', 0, 90, { align: 'center' });
    doc.fillColor('#C9A227').fontSize(16).font('Helvetica').text('Certificate of Participation', 0, 130, { align: 'center' });

    doc.fillColor('#333').fontSize(14).text('This certifies that', 0, 190, { align: 'center' });
    doc.fillColor('#7A1F2B').fontSize(28).font('Helvetica-Bold').text(userName, 0, 220, { align: 'center' });
    doc.fillColor('#333').fontSize(14).font('Helvetica').text(`has participated in`, 0, 270, { align: 'center' });
    doc.fillColor('#333').fontSize(20).font('Helvetica-Bold').text(eventTitle, 0, 295, { align: 'center' });

    doc.fontSize(10).fillColor('#666').text(`Certificate No: ${certificateNumber}`, 60, doc.page.height - 90);
    doc.text(`Issued: ${new Date(issuedAt).toLocaleDateString()}`, 60, doc.page.height - 75);
    doc.text('EventPulse — PCTE Group of Institutes', doc.page.width - 300, doc.page.height - 75, { width: 240, align: 'right' });

    doc.end();
  });
}

async function sendCertificateEmail(toEmail, userName, eventTitle, pdfBuffer) {
  if (!process.env.SMTP_HOST) return false; // no SMTP configured — app degrades gracefully
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'EventPulse <no-reply@eventpulse.local>',
      to: toEmail,
      subject: `Your certificate for ${eventTitle}`,
      text: `Hi ${userName}, congratulations on attending ${eventTitle}! Your certificate is attached.`,
      attachments: [{ filename: 'certificate.pdf', content: pdfBuffer }],
    });
    return true;
  } catch (err) {
    console.error('[certificate] email send failed:', err.message);
    return false;
  }
}

// @route POST /api/events/:eventId/certificates/issue
// Auto-generates PDF certificates for every checked-in attendee and emails them.
exports.issueCertificatesForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Event not found');

  const checkedInTickets = await Ticket.find({ event: event._id, status: 'checked_in' }).populate('user', 'name email');

  const results = [];
  for (const ticket of checkedInTickets) {
    const existing = await Certificate.findOne({ event: event._id, user: ticket.user._id });
    if (existing) { results.push({ user: ticket.user.name, status: 'already_issued' }); continue; }

    const certificateNumber = `EP-${event.slug.slice(0, 6).toUpperCase()}-${ticket.user._id.toString().slice(-6).toUpperCase()}`;
    const pdfBuffer = await buildCertificatePDF({ userName: ticket.user.name, eventTitle: event.title, certificateNumber, issuedAt: new Date() });

    const cert = await Certificate.create({
      organization: req.user.organization,
      event: event._id,
      user: ticket.user._id,
      ticket: ticket._id,
      certificateNumber,
      pdfBase64: pdfBuffer.toString('base64'),
    });

    const emailed = await sendCertificateEmail(ticket.user.email, ticket.user.name, event.title, pdfBuffer);
    cert.emailSent = emailed;
    cert.emailSentAt = emailed ? new Date() : null;
    await cert.save();

    results.push({ user: ticket.user.name, status: 'issued', emailed });
  }

  res.json({ success: true, issued: results.length, results });
});

// @route GET /api/certificates/mine
exports.myCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ user: req.user._id }).populate('event', 'title slug').sort('-issuedAt');
  res.json({ success: true, certificates: certs.map((c) => ({ _id: c._id, event: c.event, certificateNumber: c.certificateNumber, issuedAt: c.issuedAt })) });
});

// @route GET /api/certificates/:id/download
exports.downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ _id: req.params.id, user: req.user._id });
  if (!cert) throw new ApiError(404, 'Certificate not found');
  const buffer = Buffer.from(cert.pdfBase64, 'base64');
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${cert.certificateNumber}.pdf"` });
  res.send(buffer);
});
