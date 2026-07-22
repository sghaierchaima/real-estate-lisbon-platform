import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendMail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return { sent: true };
    } catch (error) {
      this.logger.error(error);
      return { sent: false };
    }
  }

  async sendMatchApprovedEmail(params: {
    professionalEmail: string;
    professionalName?: string | null;
    buyerName?: string | null;
    leadLocation?: string | null;
    matchId: string;
  }) {
    const url = `${process.env.FRONTEND_URL}/dashboard/my-matches`;

    return this.sendMail({
      to: params.professionalEmail,
      subject: 'New approved buyer match',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
          <h2>New buyer match approved</h2>
          <p>Hello ${params.professionalName || 'Professional'},</p>
          <p>A buyer match has been approved and is now available in your dashboard.</p>
          <p><strong>Buyer:</strong> ${params.buyerName || 'Buyer lead'}</p>
          <p><strong>Location:</strong> ${params.leadLocation || 'Not specified'}</p>
          <a href="${url}" style="display:inline-block;background:#1B365D;color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
            View Match
          </a>
        </div>
      `,
    });
  }

async sendBuyerContactedEmail(params: {
  buyerEmail: string;
  buyerName?: string | null;
  professionalName?: string | null;
  professionalCompany?: string | null;
}) {
  const url = `${process.env.FRONTEND_URL}/dashboard/matching`;

  return this.sendMail({
    to: params.buyerEmail,
    subject: 'A professional has contacted your request',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
        <h2>Your real estate request has been contacted</h2>
        <p>Hello ${params.buyerName || 'Buyer'},</p>
        <p>A professional has started the follow-up for your request.</p>
        <p><strong>Professional:</strong> ${
          params.professionalName || params.professionalCompany || 'Professional'
        }</p>
        <a href="${url}" style="display:inline-block;background:#1B365D;color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
          View Dashboard
        </a>
      </div>
    `,
  });
}

}