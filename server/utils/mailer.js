const nodemailer = require('nodemailer');

let _transport = null;

const getTransport = () => {
    if (_transport) return _transport;
    const { SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) {
        throw new Error('Email is not configured. Set SMTP_USER and SMTP_PASS (Gmail App Password) in your .env file.');
    }
    _transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return _transport;
};

const APP_NAME = process.env.APP_NAME || 'FitForge';
const FROM = () => `"${APP_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

const PURPOSE_COPY = {
    signup: { subject: 'Verify your email', heading: 'Welcome to FitForge!', body: 'Use the code below to finish creating your account.' },
    change_password: { subject: 'Confirm password change', heading: 'Password change requested', body: 'Use the code below to confirm changing your password.' },
    change_username: { subject: 'Confirm username change', heading: 'Username change requested', body: 'Use the code below to confirm changing your username.' },
    reset_data: { subject: 'Confirm data reset', heading: 'Data reset requested', body: 'Use the code below to confirm wiping all of your workout & nutrition history. This cannot be undone.' },
};

const buildHtml = (code, purpose) => {
    const meta = PURPOSE_COPY[purpose] || PURPOSE_COPY.signup;
    return `<!doctype html><html><body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;color:#e8e8ec;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;color:#fca311;">${APP_NAME}</div>
    </div>
    <div style="background:#1a1a24;border:1px solid #2a2a3a;border-radius:18px;padding:32px 28px;">
      <h2 style="margin:0 0 12px;font-size:1.25rem;color:#fff;">${meta.heading}</h2>
      <p style="margin:0 0 24px;font-size:0.95rem;color:#a0a0b0;line-height:1.55;">${meta.body}</p>
      <div style="text-align:center;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:2.2rem;font-weight:800;letter-spacing:0.6rem;color:#fca311;background:#0f0f14;padding:18px;border-radius:14px;border:1px solid #2a2a3a;">
        ${code}
      </div>
      <p style="margin:24px 0 0;font-size:0.82rem;color:#6c6c7a;text-align:center;">
        This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
      </p>
    </div>
    <p style="margin:20px 0 0;font-size:0.72rem;color:#6c6c7a;text-align:center;">
      &copy; ${new Date().getFullYear()} ${APP_NAME}
    </p>
  </div>
</body></html>`;
};

const sendOtpEmail = async ({ to, code, purpose }) => {
    const meta = PURPOSE_COPY[purpose] || PURPOSE_COPY.signup;
    const transport = getTransport();
    const info = await transport.sendMail({
        from: FROM(),
        to,
        subject: `${meta.subject} — ${code}`,
        text: `${meta.heading}\n\n${meta.body}\n\nYour code: ${code}\n\nThis code expires in 10 minutes. If you didn't request it, you can ignore this email.`,
        html: buildHtml(code, purpose),
    });
    if (process.env.OTP_DEV_LOG === 'true') {
        console.log(`[OTP] purpose=${purpose} to=${to} code=${code}`);
    }
    return info.messageId;
};

module.exports = { sendOtpEmail };
