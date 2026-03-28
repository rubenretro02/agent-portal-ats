import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// SMTP configuration - Update when you set up your mail server
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.yourdomain.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  // For relay services like Brevo/SendGrid:
  // host: 'smtp-relay.brevo.com',
  // port: 587,
};

interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string; // base64
    contentType: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SendEmailRequest = await request.json();
    const { to, cc, bcc, subject, body, html, attachments } = data;

    // Validate required fields
    if (!to || !to.length || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    // In production, uncomment and use this code:
    /*
    // Get user credentials from session/database
    const userEmail = 'agent@yourdomain.com'; // From session
    const userPassword = 'user-mail-password'; // From secure storage

    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: userEmail,
        pass: userPassword,
      },
    });

    const mailOptions = {
      from: userEmail,
      to: to.join(', '),
      cc: cc?.join(', '),
      bcc: bcc?.join(', '),
      subject,
      text: body,
      html: html || body,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
      })),
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
    */

    // Demo response until mail server is configured
    return NextResponse.json({
      success: false,
      message: 'Mail server not configured. Email was not sent.',
      demo: true,
      wouldSend: {
        to,
        cc,
        bcc,
        subject,
        bodyPreview: body.substring(0, 100) + '...',
      },
      instructions: [
        '1. Set up your mail server or SMTP relay',
        '2. Add SMTP_HOST, SMTP_PORT, SMTP_SECURE to .env',
        '3. Implement user mail credentials storage',
        '4. Uncomment the nodemailer code above',
      ],
    });
  } catch (error) {
    console.error('Send mail error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Example .env configuration for production:
//
// # Your own mail server:
// SMTP_HOST=mail.yourdomain.com
// SMTP_PORT=587
// SMTP_SECURE=false
// IMAP_HOST=mail.yourdomain.com
// IMAP_PORT=993
//
// # Or using Brevo (free relay):
// SMTP_HOST=smtp-relay.brevo.com
// SMTP_PORT=587
// SMTP_USER=your-brevo-email
// SMTP_PASS=your-brevo-api-key
