import prisma from './prisma';

// Email configuration
// In production, you would use a service like Resend, SendGrid, or AWS SES
// For this demo, we'll simulate sending emails and log them to the database

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  template: string;
  metadata?: Record<string, unknown>;
}

async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    // Log the email to the database
    const emailLog = await prisma.emailLog.create({
      data: {
        to: config.to,
        subject: config.subject,
        template: config.template,
        status: 'pending',
        metadata: config.metadata ? JSON.stringify(config.metadata) : null,
      },
    });

    // In production, you would send the email here
    // For example, using Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'AgentHub <noreply@agenthub.com>',
    //   to: config.to,
    //   subject: config.subject,
    //   html: config.html,
    // });

    // Simulate email sending (in production, remove this and use actual email service)
    console.log('📧 Email sent:', {
      to: config.to,
      subject: config.subject,
      template: config.template,
    });

    // Update email log to sent
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);

    // Log failed email
    await prisma.emailLog.create({
      data: {
        to: config.to,
        subject: config.subject,
        template: config.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: config.metadata ? JSON.stringify(config.metadata) : null,
      },
    });

    return false;
  }
}

// Email Templates
interface ApplicationConfirmationParams {
  to: string;
  agentName: string;
  opportunityName: string;
  applicationId: string;
  clientName: string;
}

export async function sendApplicationConfirmationEmail(params: ApplicationConfirmationParams): Promise<boolean> {
  const { to, agentName, opportunityName, applicationId, clientName } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .success-icon { width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
        .success-icon svg { width: 30px; height: 30px; color: white; }
        .app-id { background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px; text-align: center; margin: 20px 0; border: 1px dashed #d1d5db; }
        .footer { background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #9ca3af; font-size: 12px; }
        .btn { display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Application Submitted!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${agentName}</strong>,</p>
          <p>Thank you for applying to the <strong>${opportunityName}</strong> opportunity with <strong>${clientName}</strong>. Your application has been received and is now being reviewed by our team.</p>

          <div class="app-id">
            <small style="color: #6b7280;">Application ID</small><br>
            <strong>${applicationId}</strong>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Opportunity</span>
              <span class="detail-value">${opportunityName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Client</span>
              <span class="detail-value">${clientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value" style="color: #f59e0b;">Pending Review</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Submitted</span>
              <span class="detail-value">${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
            </div>
          </div>

          <h3>What's Next?</h3>
          <ul>
            <li>Our recruitment team will review your application within 2-3 business days</li>
            <li>If selected, you'll receive an email with next steps</li>
            <li>Keep your phone nearby for potential screening calls</li>
            <li>Make sure your profile and documents are up to date</li>
          </ul>

          <p style="text-align: center;">
            <a href="#" class="btn">View Application Status</a>
          </p>
        </div>
        <div class="footer">
          <p>AgentHub - 1099 Agent Portal + ATS Platform</p>
          <p>This email was sent regarding your application. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Application Received: ${opportunityName}`,
    html,
    template: 'application_confirmation',
    metadata: {
      applicationId,
      opportunityName,
      clientName,
      agentName,
    },
  });
}

// Additional email templates
interface StatusChangeParams {
  to: string;
  agentName: string;
  opportunityName: string;
  oldStatus: string;
  newStatus: string;
  applicationId: string;
}

export async function sendStatusChangeEmail(params: StatusChangeParams): Promise<boolean> {
  const { to, agentName, opportunityName, oldStatus, newStatus, applicationId } = params;

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    rejected: '#ef4444',
  };

  const statusMessages: Record<string, string> = {
    in_review: 'Your application is now being reviewed by our team.',
    approved: 'Congratulations! Your application has been approved. You will receive further instructions shortly.',
    rejected: 'Unfortunately, your application was not selected at this time. We encourage you to apply for other opportunities.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; background: ${statusColors[newStatus] || '#6b7280'}; }
        .footer { background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Status Update</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${agentName}</strong>,</p>
          <p>The status of your application for <strong>${opportunityName}</strong> has been updated:</p>

          <p style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${newStatus.replace('_', ' ').toUpperCase()}</span>
          </p>

          <p>${statusMessages[newStatus] || 'Your application status has been updated.'}</p>

          <p><small style="color: #6b7280;">Application ID: ${applicationId}</small></p>
        </div>
        <div class="footer">
          <p>AgentHub - 1099 Agent Portal + ATS Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Application Update: ${opportunityName}`,
    html,
    template: 'status_change',
    metadata: {
      applicationId,
      opportunityName,
      oldStatus,
      newStatus,
    },
  });
}
