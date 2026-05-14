import nodemailer from "nodemailer";

const hasSmtpConfig = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const sendOTPEmail = async (email, otp) => {
  try {
    if (!hasSmtpConfig && process.env.NODE_ENV !== "production") {
      console.log(`[email-dev] OTP for ${email}: ${otp}`);
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@campus-portal.com",
      to: email,
      subject: "Campus Portal - Email Verification OTP",
      text: `Your verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Campus Portal</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Email Verification</p>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hello,
            </p>
            <p style="color: #555; font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
              Your verification code is: ${otp}
            </p>
            <div style="background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
              This OTP expires in 10 minutes. Do not share it with anyone.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              If you did not request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@campus-portal.com",
      to: email,
      subject: "Campus Portal - Password Reset Link",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Campus Portal</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Password Reset</p>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hello,
            </p>
            <p style="color: #555; font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
              This link expires in 30 minutes.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              If you did not request a password reset, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0 0; border-top: 1px solid #ddd; padding-top: 15px;">
              Or paste this link in your browser: <br>
              <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export const sendApplicationStatusUpdateEmail = async ({
  email,
  studentName,
  company,
  jobTitle,
  status
}) => {
  try {
    const normalizedStatus = status.replaceAll("_", " ").toUpperCase();

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@campus-portal.com",
      to: email,
      subject: `Application Update - ${company} (${normalizedStatus})`,
      text: `Hi ${studentName}, your application for ${jobTitle} at ${company} is now ${normalizedStatus}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Application Status Update</h2>
          <p>Hi ${studentName},</p>
          <p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> is now:</p>
          <p style="font-size: 20px; font-weight: bold; color: #0f766e;">${normalizedStatus}</p>
          <p>Please log in to your dashboard for full details.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending application status email:", error);
    return false;
  }
};
