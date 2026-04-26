/**
 * Email Service
 * 
 * Handles email sending with SMTP using nodemailer
 * Includes retry logic and comprehensive logging
 */

import nodemailer, { Transporter } from 'nodemailer';
import logger from './logger';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with SMTP configuration
 */
const initializeTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env['SMTP_HOST'];
  const smtpPort = parseInt(process.env['SMTP_PORT'] || '587', 10);
  const smtpUser = process.env['SMTP_USER'];
  const smtpPass = process.env['SMTP_PASS'];

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn('SMTP configuration incomplete, email service disabled', {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    });
    throw new Error('SMTP configuration incomplete');
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // Use TLS for port 465, STARTTLS for 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    pool: true, // Use pooled connections
    maxConnections: 5,
    maxMessages: 100,
  });

  logger.info('Email transporter initialized', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
  });

  return transporter;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send email with retry logic
 * @param to Recipient email address
 * @param subject Email subject
 * @param htmlBody HTML body content
 * @param textBody Plain text body (optional, fallback to stripping HTML)
 * @param retries Number of retry attempts (default 3)
 */
export const sendEmail = async (
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  retries: number = 3
): Promise<boolean> => {
  try {
    // Initialize transporter if not already done
    const emailTransporter = initializeTransporter();

    const fromEmail = process.env['SMTP_FROM'] || process.env['SMTP_USER'];

    if (!fromEmail) {
      logger.error('SMTP_FROM not configured');
      return false;
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retries) {
      attempt++;

      try {
        logger.info('Sending email', {
          to,
          subject,
          attempt,
          maxRetries: retries,
        });

        const info = await emailTransporter.sendMail({
          from: fromEmail,
          to,
          subject,
          html: htmlBody,
          text: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        });

        logger.info('Email sent successfully', {
          to,
          subject,
          messageId: info.messageId,
          attempt,
        });

        return true;
      } catch (error) {
        lastError = error as Error;
        logger.warn('Email send attempt failed', {
          to,
          subject,
          attempt,
          error: lastError.message,
        });

        // If not the last attempt, wait before retrying with exponential backoff
        if (attempt < retries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          logger.info('Retrying email send', {
            to,
            subject,
            nextAttempt: attempt + 1,
            delayMs,
          });
          await sleep(delayMs);
        }
      }
    }

    // All retries failed
    logger.error('Email send failed after all retries', {
      to,
      subject,
      attempts: retries,
      error: lastError?.message,
    });

    return false;
  } catch (error) {
    logger.error('Email service error', {
      to,
      subject,
      error,
    });
    return false;
  }
};

/**
 * Send deadline alert email to user
 * @param to Recipient email
 * @param userName User name
 * @param tasks Array of tasks with deadline alerts
 */
export const sendDeadlineAlertEmail = async (
  to: string,
  userName: string,
  tasks: Array<{
    title: string;
    project: string;
    deadline: Date;
    daysRemaining: number;
    priority: string;
  }>
): Promise<boolean> => {
  const subject = `Deadline Alert: ${tasks.length} Task(s) Require Attention`;

  const taskRows = tasks
    .map(
      (task) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${task.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${task.project}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${task.deadline.toLocaleDateString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; color: ${task.daysRemaining <= 1 ? '#d32f2f' : '#f57c00'}; font-weight: bold;">${task.daysRemaining} day(s)</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${task.priority}</td>
    </tr>
  `
    )
    .join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; background-color: white; margin-top: 20px; }
        th { background-color: #1976d2; color: white; padding: 12px; text-align: left; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Deadline Alert</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>You have <strong>${tasks.length}</strong> task(s) approaching their deadline that require your attention:</p>
          
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Time Remaining</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              ${taskRows}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">Please review these tasks and take appropriate action to ensure they are completed on time.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Task Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, htmlBody);
};

/**
 * Verify email configuration
 * @returns True if email is properly configured
 */
export const isEmailConfigured = (): boolean => {
  const smtpHost = process.env['SMTP_HOST'];
  const smtpUser = process.env['SMTP_USER'];
  const smtpPass = process.env['SMTP_PASS'];

  return !!(smtpHost && smtpUser && smtpPass);
};

// Export email service
export default {
  sendEmail,
  sendDeadlineAlertEmail,
  isEmailConfigured,
};
