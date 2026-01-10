import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { z } from 'zod';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly BREVO_API_BASE = 'api.brevo.com';
  private readonly BREVO_TIMEOUT_MS = 10_000;

  constructor(private readonly configService: ConfigService) {}

  private parseEmailAddress(value: string, envName: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new Error(`missing ${envName}`);

    // Allow either:
    // - plain email: support@domain.com
    // - display format: "Inventory Manager <support@domain.com>"
    const angleMatch = trimmed.match(/<\s*([^>]+)\s*>/);
    const emailInStringMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const candidate = (angleMatch?.[1] ?? emailInStringMatch?.[0] ?? trimmed).trim();

    if (!z.string().email().safeParse(candidate).success) {
      throw new Error(`invalid ${envName}`);
    }
    return candidate;
  }

  private parseBrevoTemplateId(raw: string | undefined, envName: string): number | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    // Brevo requires a numeric template ID.
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`${envName} must be a positive integer.`);
    }

    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error(`${envName} must be a positive integer.`);
    }
    return parsed;
  }

  private getRequiredEmailConfig(): { fromEmail: string; fromName: string; supportEmail: string } {
    const fromEmailRaw = this.configService.get<string>('EMAIL_FROM');
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME');
    const supportEmailRaw = this.configService.get<string>('SUPPORT_EMAIL');

    if (!fromEmailRaw) throw new Error('missing EMAIL_FROM');
    if (!fromName) throw new Error('missing EMAIL_FROM_NAME');
    if (!supportEmailRaw) throw new Error('missing SUPPORT_EMAIL');

    const fromEmail = this.parseEmailAddress(fromEmailRaw, 'EMAIL_FROM');
    const supportEmail = this.parseEmailAddress(supportEmailRaw, 'SUPPORT_EMAIL');

    return { fromEmail, fromName, supportEmail };
  }

  /**
   * Send OTP email via Brevo
   */
  async sendOtpEmail(email: string, otpCode: string, userName?: string): Promise<boolean> {
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!brevoApiKey) {
      this.logger.warn('Email service disabled: missing BREVO_API_KEY');
      return false;
    }

    let fromEmail: string;
    let fromName: string;
    let supportEmail: string;
    let otpTemplateId: number;

    try {
      ({ fromEmail, fromName, supportEmail } = this.getRequiredEmailConfig());

      const otpTemplateIdRaw = this.configService.get<string>('BREVO_OTP_TEMPLATE_ID');
      const parsed = this.parseBrevoTemplateId(otpTemplateIdRaw, 'BREVO_OTP_TEMPLATE_ID');
      if (!parsed) throw new Error('missing BREVO_OTP_TEMPLATE_ID');
      otpTemplateId = parsed;
    } catch (err: any) {
      this.logger.warn(`Email service disabled: ${err?.message || 'invalid email configuration'}`);
      return false;
    }

      const basePayload = {
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [{ email, name: userName || email.split('@')[0] }],
        replyTo: {
          email: supportEmail,
        },
      };

      const payload = {
        ...basePayload,
        templateId: otpTemplateId,
        params: {
          otp: otpCode,
          name: userName || email.split('@')[0],
        },
      };

    try {
      await this.makeBrevoApiRequest(brevoApiKey, payload);
      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error?.message || error}`);
      return false;
    }
  }

  /**
   * Send password reset link email via Brevo
   */
  async sendPasswordResetLinkEmail(email: string, resetLink: string, userName?: string): Promise<boolean> {
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!brevoApiKey) {
      this.logger.warn('Email service disabled: missing BREVO_API_KEY');
      return false;
    }

    let fromEmail: string;
    let fromName: string;
    let supportEmail: string;
    let resetTemplateId: number;

    try {
      ({ fromEmail, fromName, supportEmail } = this.getRequiredEmailConfig());

      const resetTemplateIdRaw = this.configService.get<string>('BREVO_PASSWORD_RESET_TEMPLATE_ID');
      const parsed = this.parseBrevoTemplateId(
        resetTemplateIdRaw,
        'BREVO_PASSWORD_RESET_TEMPLATE_ID',
      );
      if (!parsed) throw new Error('missing BREVO_PASSWORD_RESET_TEMPLATE_ID');
      resetTemplateId = parsed;
    } catch (err: any) {
      this.logger.warn(`Email service disabled: ${err?.message || 'invalid email configuration'}`);
      return false;
    }

      const basePayload = {
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [{ email, name: userName || email.split('@')[0] }],
        replyTo: {
          email: supportEmail,
        },
      };

      const payload = {
        ...basePayload,
        templateId: resetTemplateId,
        params: {
          resetLink,
          name: userName || email.split('@')[0],
        },
      };

    try {
      await this.makeBrevoApiRequest(brevoApiKey, payload);
      this.logger.log(`Password reset link email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset link email to ${email}: ${error?.message || error}`,
      );
      return false;
    }
  }

  /**
   * Make request to Brevo API
   */
  private makeBrevoApiRequest(apiKey: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const payloadString = JSON.stringify(payload);

      const options = {
        hostname: this.BREVO_API_BASE,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadString),
        },
      };

      const req = https.request(options, (res: any) => {
        let data = '';

        res.on('data', (chunk: any) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (!data) {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({});
                return;
              }
              reject(new Error(`Brevo API error: HTTP ${res.statusCode}`));
              return;
            }

            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const errorMsg = parsed.message || parsed.error || `HTTP ${res.statusCode}`;
              reject(new Error(`Brevo API error: ${errorMsg}`));
            }
          } catch (e) {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({});
              return;
            }
            reject(new Error(`Failed to parse Brevo API response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request to Brevo API failed: ${error.message}`));
      });

      req.setTimeout(this.BREVO_TIMEOUT_MS, () => {
        req.destroy(new Error(`Request to Brevo API timed out after ${this.BREVO_TIMEOUT_MS}ms`));
      });

      req.write(payloadString);
      req.end();
    });
  }

  /**
   * Generate OTP email HTML template
   */
  private generateOtpEmailTemplate(otpCode: string, userName?: string): string {
    const name = userName || 'User';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .email-box { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1976d2; }
            .content { text-align: center; }
            .otp-code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #1976d2; 
              letter-spacing: 5px; 
              margin: 20px 0;
              padding: 20px;
              background: #f0f7ff;
              border-radius: 8px;
              font-family: monospace;
            }
            .expiry-notice { 
              color: #666; 
              font-size: 14px; 
              margin-top: 20px;
              padding: 10px;
              background: #fff3cd;
              border-left: 4px solid #ffc107;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #999; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-box">
              <div class="header">
                <div class="logo">Inventory Manager</div>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for signing up! Please verify your email address using the code below:</p>
                <div class="otp-code">${otpCode}</div>
                <div class="expiry-notice">
                  ⏱️ This code will expire in 10 minutes. Do not share this code with anyone.
                </div>
                <p style="margin-top: 30px; color: #666;">
                  If you didn't request this verification, please ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>Inventory Manager - ${new Date().getFullYear()}</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset email HTML template
   */
  private generatePasswordResetEmailTemplate(resetLink: string, userName?: string): string {
    const name = userName || 'User';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .email-box { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1976d2; }
            .content { text-align: center; }
            .expiry-notice { 
              color: #666; 
              font-size: 14px; 
              margin-top: 20px;
              padding: 10px;
              background: #fff3cd;
              border-left: 4px solid #ffc107;
            }
            .warning { 
              color: #d32f2f; 
              font-size: 14px;
              margin-top: 20px;
              padding: 10px;
              background: #ffebee;
              border-left: 4px solid #d32f2f;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #999; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-box">
              <div class="header">
                <div class="logo">Inventory Manager</div>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Use the secure link below:</p>
                <p style="margin: 20px 0;">
                  <a href="${resetLink}" style="display:inline-block; padding: 12px 18px; background: #1976d2; color: #fff; text-decoration:none; border-radius: 6px;">
                    Reset Password
                  </a>
                </p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
                <div class="expiry-notice">
                  ⏱️ This link will expire in 30 minutes.
                </div>
                <div class="warning">
                  🔒 If you didn't request this password reset, please ignore this email. Your account is safe.
                </div>
                <p style="margin-top: 30px; color: #666;">
                  Never share this link with anyone, not even support staff.
                </p>
              </div>
              <div class="footer">
                <p>Inventory Manager - ${new Date().getFullYear()}</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
