import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

interface AbstractApiResponse {
  email_address: string;
  email_deliverability: {
    status: string;
    status_detail: string;
    is_format_valid: boolean;
    is_smtp_valid: boolean;
    is_mx_valid: boolean;
    mx_records: string[];
  };
  email_sender: {
    first_name: string;
    last_name: string;
    email_provider_name: string;
    organization_name: string;
    organization_type: string;
  };
  email_domain: {
    domain: string;
    domain_age: number;
    is_live_site: boolean;
    registrar: string;
    registrar_url: string;
    date_registered: string;
    date_last_renewed: string;
    date_expires: string;
    is_risky_tld: boolean;
  };
  email_quality: {
    score: number;
    is_free_email: boolean;
    is_username_suspicious: boolean;
    is_disposable: boolean;
    is_catchall: boolean;
    is_subaddress: boolean;
    is_role: boolean;
    is_dmarc_enforced: boolean;
    is_spf_strict: boolean;
    minimum_age: number;
  };
  email_risk: {
    address_risk_status: string;
    domain_risk_status: string;
  };
  email_breaches?: {
    total_breaches: number;
    date_first_breached: string;
    date_last_breached: string;
    breached_domains: Array<{
      domain: string;
      breach_date: string;
    }>;
  };
}

interface BrevoSendResponse {
  id: number;
  uuid: string;
  messageId?: string;
}

interface VerificationEmailData {
  verificationToken: string;
  verificationUrl: string;
  expiresIn: string;
}

@Injectable()
export class EmailValidatorService {
  private readonly logger = new Logger(EmailValidatorService.name);
  private readonly ABSTRACT_API_BASE = 'emailreputation.abstractapi.com';
  private readonly BREVO_API_BASE = 'api.brevo.com';
  private readonly VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in ms
  private readonly VERIFICATION_TOKEN_LENGTH = 32;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate email using Abstract API
   * Checks format, deliverability, and risk factors
   */
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    reason?: string;
    details?: AbstractApiResponse;
  }> {
    try {
      const apiKey = this.configService.get<string>('ABSTRACT_API_KEY');
      if (!apiKey) {
        this.logger.warn('ABSTRACT_API_KEY not configured, skipping email validation');
        return { isValid: true }; // Allow if not configured
      }

      const response = await this.makeAbstractApiRequest(email, apiKey);

      // Check validation rules
      if (!response.email_deliverability.is_format_valid) {
        return {
          isValid: false,
          reason: 'Invalid email format',
          details: response,
        };
      }

      if (response.email_quality.is_disposable) {
        return {
          isValid: false,
          reason: 'Disposable email addresses are not allowed',
          details: response,
        };
      }

      if (response.email_deliverability.status === 'undeliverable') {
        return {
          isValid: false,
          reason: 'Email address is undeliverable',
          details: response,
        };
      }

      if (response.email_quality.score < 0.5) {
        return {
          isValid: false,
          reason: 'Email quality score is too low',
          details: response,
        };
      }

      this.logger.log(`Email validated successfully: ${email} (quality: ${response.email_quality.score})`);
      return {
        isValid: true,
        details: response,
      };
    } catch (error) {
      this.logger.error(`Email validation failed for ${email}:`, error.message);
      throw new BadRequestException(`Email validation failed: ${error.message}`);
    }
  }

  /**
   * Make request to Abstract API
   */
  private makeAbstractApiRequest(
    email: string,
    apiKey: string,
  ): Promise<AbstractApiResponse> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.ABSTRACT_API_BASE,
        path: `/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
        method: 'GET',
        headers: {
          'User-Agent': 'InventoryManager/1.0',
        },
      };

      const req = https.request(options, (res: any) => {
        let data = '';

        res.on('data', (chunk: any) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Log response for debugging
            if (res.statusCode !== 200) {
              this.logger.error(`Abstract API returned status ${res.statusCode}: ${data}`);
              reject(new Error(`Abstract API error (${res.statusCode}): ${data.substring(0, 200)}`));
              return;
            }
            
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            this.logger.error(`Failed to parse response (status ${res.statusCode}): ${data.substring(0, 200)}`);
            reject(new Error(`Failed to parse Abstract API response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request to Abstract API failed: ${error.message}`));
      });

      req.end();
    });
  }

  /**
   * Generate secure verification token
   */
  generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < this.VERIFICATION_TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Send verification email via Brevo API
   */
  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string,
    verificationUrl: string,
  ): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('BREVO_API_KEY');
      if (!apiKey) {
        throw new BadRequestException('BREVO_API_KEY is not configured');
      }

      const emailContent = this.generateVerificationEmailTemplate(
        userName,
        verificationUrl,
      );

      const payload = {
        sender: {
          name: this.configService.get<string>('EMAIL_FROM_NAME') || 'Inventory Manager',
          email: this.configService.get<string>('EMAIL_FROM') || 'noreply@inventorymanager.com',
        },
        to: [
          {
            email: email,
            name: userName,
          },
        ],
        subject: 'Verify Your Email Address',
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        replyTo: {
          email: this.configService.get<string>('SUPPORT_EMAIL') || 'support@inventorymanager.com',
        },
      };

      const response = await this.makeBrevoApiRequest(apiKey, payload);
      this.logger.log(
        `Verification email sent successfully to ${email} (Message ID: ${response.id})`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Make request to Brevo API
   */
  private makeBrevoApiRequest(apiKey: string, payload: any): Promise<BrevoSendResponse> {
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
              const errorMsg =
                parsed.message ||
                parsed.error ||
                `HTTP ${res.statusCode}`;
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
   * Generate verification email HTML template
   */
  private generateVerificationEmailTemplate(
    userName: string,
    verificationUrl: string,
  ): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .footer { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Thank you for signing up for Inventory Manager! To complete your registration, please verify your email address by clicking the button below.</p>
              
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                <strong>Security Note:</strong> This verification link expires in 24 hours. If you did not sign up for this account, please ignore this email.
              </div>
              
              <p>Questions? Contact our support team at <a href="mailto:support@inventorymanager.com">support@inventorymanager.com</a></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Inventory Manager. All rights reserved.</p>
              <p>If you received this email by mistake, please ignore it.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Verify Your Email
      
      Hi ${userName},
      
      Thank you for signing up for Inventory Manager! To complete your registration, please click the link below to verify your email address:
      
      ${verificationUrl}
      
      This verification link expires in 24 hours. If you did not sign up for this account, please ignore this email.
      
      Questions? Contact our support team at support@inventorymanager.com
      
      © 2026 Inventory Manager. All rights reserved.
    `;

    return { html, text };
  }

  /**
   * Get verification expiry time in milliseconds
   */
  getVerificationTokenExpiry(): number {
    return this.VERIFICATION_TOKEN_EXPIRY;
  }

  /**
   * Get frontend verification URL
   */
  getVerificationUrl(token: string, appUrl?: string): string {
    const baseUrl =
      appUrl || this.configService.get<string>('APP_URL') || 'https://app.inventorymanager.com';
    return `${baseUrl}/verify-email?token=${token}`;
  }
}
