package com.playx.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${playx.mail.from:no-reply@playx.music}")
    private String mailFrom;

    @Value("${playx.mail.from-name:PLAYX Music}")
    private String mailFromName;

    @Value("${playx.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    /**
     * Generates a 64-character cryptographically secure token.
     */
    public String generateVerificationToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    /**
     * Computes the SHA-256 hash of a raw verification token.
     */
    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    /**
     * Builds the verification URL pointing to the PlayX frontend.
     */
    public String buildVerificationUrl(String rawToken) {
        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
        return base + "/verify-email?token=" + rawToken;
    }

    /**
     * Sends the verification email using responsive HTML template.
     * Gracefully logs if SMTP is unconfigured or unavailable.
     */
    public boolean sendVerificationEmail(String recipientEmail, String recipientName, String rawToken) {
        String verificationUrl = buildVerificationUrl(rawToken);
        String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Music Lover";

        logger.info("Initiating account verification email for: {}", recipientEmail);

        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            logger.info("SMTP credentials not configured. Verification email simulated for: {}", recipientEmail);
            logger.info("Verification link: {}", verificationUrl);
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(mailFrom, mailFromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Verify Your PLAYX Account");
            helper.setText(buildHtmlEmail(safeName, verificationUrl), true);

            mailSender.send(message);
            logger.info("Verification email successfully delivered to: {}", recipientEmail);
            return true;
        } catch (Exception e) {
            logger.warn("Could not dispatch email via SMTP ({}). Falling back to direct verification URL.", e.getMessage());
            logger.info("Direct verification link for developer: {}", verificationUrl);
            return false;
        }
    }

    /**
     * Builds a modern, dark-themed responsive HTML email with PLAYX branding.
     */
    private String buildHtmlEmail(String name, String verificationUrl) {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your PLAYX Account</title>
          <style>
            body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
            .container { max-width: 580px; margin: 30px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
            .header { background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 50%%, #db2777 100%%); padding: 36px 30px; text-align: center; }
            .logo { font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
            .tagline { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 6px; letter-spacing: 1px; }
            .content { padding: 40px 32px; }
            .greeting { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
            .text { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px; }
            .btn-wrapper { text-align: center; margin: 32px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%%, #a855f7 100%%); color: #ffffff !important; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35); }
            .expiry-box { background-color: #1e293b; border-left: 4px solid #a855f7; padding: 14px 18px; border-radius: 8px; margin: 24px 0; }
            .expiry-text { font-size: 13px; color: #cbd5e1; margin: 0; }
            .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1f2937; }
            .link-fallback a { color: #818cf8; text-decoration: underline; }
            .footer { background-color: #0b0f19; padding: 24px 30px; text-align: center; border-top: 1px solid #1f2937; }
            .footer-text { font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">PLAYX</h1>
              <div class="tagline">YOUR ULTIMATE MUSIC STREAMING UNIVERSE</div>
            </div>
            <div class="content">
              <div class="greeting">Hi %s,</div>
              <p class="text">
                Thank you for joining <strong>PLAYX</strong>! We're thrilled to have you with us. Please verify your email address to activate your account and start discovering millions of tracks.
              </p>
              <div class="btn-wrapper">
                <a href="%s" target="_blank" class="btn">Verify Email Address</a>
              </div>
              <div class="expiry-box">
                <p class="expiry-text">⏰ <strong>Security Notice:</strong> This verification link will expire in <strong>15 minutes</strong>.</p>
              </div>
              <p class="text" style="font-size: 13px; margin-bottom: 0;">
                If you did not create an account on PLAYX, you can safely ignore this email — no account will be activated.
              </p>
              <div class="link-fallback">
                <p style="margin: 0 0 6px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="%s">%s</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                &copy; 2026 PLAYX Music Inc. All rights reserved.<br>
                This is an automated system email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
        """.formatted(name, verificationUrl, verificationUrl, verificationUrl);
    }
}
