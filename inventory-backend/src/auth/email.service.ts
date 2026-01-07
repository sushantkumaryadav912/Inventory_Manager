import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly BREVO_API_BASE = 'api.brevo.com';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send OTP email via Brevo
   */
  async sendOtpEmail(email: string, otpCode: string, userName?: string): Promise<boolean> {
    try {
      const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
      
      // Allow test mode - just log the OTP
      if (!brevoApiKey) {
        this.logger.log(`[TEST MODE] OTP Email to ${email}: ${otpCode}`);
        return true;
      }

      const subject = 'Your Email Verification Code';
      const htmlContent = this.generateOtpEmailTemplate(otpCode, userName);
      const textContent = `Your verification code is: ${otpCode}. This code expires in 10 minutes.`;

      const payload = {
        sender: {
          name: this.configService.get<string>('EMAIL_FROM_NAME') || 'Inventory Manager',
          email: this.configService.get<string>('EMAIL_FROM') || 'noreply@inventorymanager.com',
        },
        to: [{ email, name: userName || email.split('@')[0] }],
        subject,
        htmlContent,
        textContent,
        replyTo: {
          email: this.configService.get<string>('SUPPORT_EMAIL') || 'support@inventorymanager.com',
        },
      };

      await this.makeBrevoApiRequest(brevoApiKey, payload);
      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Send password reset OTP email via Brevo
   */
  async sendPasswordResetEmail(email: string, otpCode: string, userName?: string): Promise<boolean> {
    try {
      const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
      
      // Allow test mode - just log the OTP
      if (!brevoApiKey) {
        this.logger.log(`[TEST MODE] Password Reset Email to ${email}: ${otpCode}`);
        return true;
      }

      const subject = 'Password Reset Request';
      const htmlContent = this.generatePasswordResetEmailTemplate(otpCode, userName);
      const textContent = `Your password reset code is: ${otpCode}. This code expires in 30 minutes.`;

      const payload = {
        sender: {
          name: this.configService.get<string>('EMAIL_FROM_NAME') || 'Inventory Manager',
          email: this.configService.get<string>('EMAIL_FROM') || 'noreply@inventorymanager.com',
        },
        to: [{ email, name: userName || email.split('@')[0] }],
        subject,
        htmlContent,
        textContent,
        replyTo: {
          email: this.configService.get<string>('SUPPORT_EMAIL') || 'support@inventorymanager.com',
        },
      };

      await this.makeBrevoApiRequest(brevoApiKey, payload);
      this.logger.log(`Password reset email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error.message);
      throw error;
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
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const errorMsg = parsed.message || parsed.error || `HTTP ${res.statusCode}`;
              reject(new Error(`Brevo API error: ${errorMsg}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Brevo API response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request to Brevo API failed: ${error.message}`));
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
  private generatePasswordResetEmailTemplate(otpCode: string, userName?: string): string {
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
              color: #d32f2f; 
              letter-spacing: 5px; 
              margin: 20px 0;
              padding: 20px;
              background: #ffebee;
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
                <p>We received a request to reset your password. Use the code below:</p>
                <div class="otp-code">${otpCode}</div>
                <div class="expiry-notice">
                  ⏱️ This code will expire in 30 minutes.
                </div>
                <div class="warning">
                  🔒 If you didn't request this password reset, please ignore this email. Your account is safe.
                </div>
                <p style="margin-top: 30px; color: #666;">
                  Never share this code with anyone, not even support staff.
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
