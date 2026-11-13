import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendMail(
    params: MailParams,
  ): Promise<{ sent: boolean }> {
    const provider = process.env.EMAIL_PROVIDER;

    if (provider === 'smtp') {
      return this.sendMailViaSmtp(params);
    }

    if (provider === 'resend') {
      return this.sendMailViaResend(params);
    }

    this.logger.error(
      'EMAIL_PROVIDER must be set to smtp or resend',
    );

    return { sent: false };
  }

  private async sendMailViaSmtp(
    params: MailParams,
  ): Promise<{ sent: boolean }> {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user;
    const port = Number(process.env.SMTP_PORT || 587);

    if (
      !host ||
      !user ||
      !pass ||
      !from ||
      !Number.isInteger(port) ||
      port <= 0 ||
      port > 65535
    ) {
      this.logger.error('Invalid or missing SMTP configuration');
      return { sent: false };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });

    try {
      await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return { sent: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';

      this.logger.error(`SMTP sending failed: ${message}`);
      return { sent: false };
    } finally {
      transporter.close();
    }
  }

  private async sendMailViaResend(
    params: MailParams,
  ): Promise<{ sent: boolean }> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      this.logger.error(
        'Missing RESEND_API_KEY or MAIL_FROM',
      );
      return { sent: false };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(params.text !== undefined
            ? { text: params.text }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.error(
          `Resend rejected request: HTTP ${response.status}`,
        );
        return { sent: false };
      }

      // Le fournisseur a accepté la demande d'envoi.
      return { sent: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown API error';

      this.logger.error(`Resend request failed: ${message}`);
      return { sent: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  private dashboardUrl(path: string): string {
    const baseUrl = process.env.FRONTEND_URL;

    if (!baseUrl) {
      throw new Error('FRONTEND_URL is missing');
    }

    return new URL(path, baseUrl).toString();
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }

  async sendMatchApprovedEmail(params: {
    professionalEmail: string;
    professionalName?: string | null;
    buyerName?: string | null;
    leadLocation?: string | null;
    matchId: string;
  }) {
    const url = this.dashboardUrl('/dashboard/my-matches');

    const professionalName = this.escapeHtml(
      params.professionalName || 'Professional',
    );
    const buyerName = this.escapeHtml(
      params.buyerName || 'Buyer lead',
    );
    const location = this.escapeHtml(
      params.leadLocation || 'Not specified',
    );

    return this.sendMail({
      to: params.professionalEmail,
      subject: 'New approved buyer match',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
          <h2>New buyer match approved</h2>
          <p>Hello ${professionalName},</p>
          <p>A buyer match has been approved and is now available in your dashboard.</p>
          <p><strong>Buyer:</strong> ${buyerName}</p>
          <p><strong>Location:</strong> ${location}</p>
          <a href="${this.escapeHtml(url)}"
             style="display:inline-block;background:#1B365D;color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
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
    const url = this.dashboardUrl('/dashboard/matching');

    const buyerName = this.escapeHtml(
      params.buyerName || 'Buyer',
    );
    const professionalName = this.escapeHtml(
      params.professionalName ||
        params.professionalCompany ||
        'Professional',
    );

    return this.sendMail({
      to: params.buyerEmail,
      subject: 'A professional has contacted your request',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0F2340">
          <h2>Your real estate request has been contacted</h2>
          <p>Hello ${buyerName},</p>
          <p>A professional has started the follow-up for your request.</p>
          <p><strong>Professional:</strong> ${professionalName}</p>
          <a href="${this.escapeHtml(url)}"
             style="display:inline-block;background:#1B365D;color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
            View Dashboard
          </a>
        </div>
      `,
    });
  }
}