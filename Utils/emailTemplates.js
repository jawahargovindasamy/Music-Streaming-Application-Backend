export const generateResetEmailTemplate = (
  username,
  resetLink,
  appName,
  tokenExpiry
) => {
  const formatExpiry = tokenExpiry.replace(
    /(\d+)([hm])/,
    (match, num, unit) => {
      const unitName = unit === "h" ? "hour(s)" : "minute(s)";
      return `${num} ${unitName}`;
    }
  );

  return {
    subject: `Password Reset Request - ${appName}`,
    text: `
Hi ${username},

You requested a password reset for your ${appName} account.

Reset your password: ${resetLink}

This link expires in ${formatExpiry}.

If you didn't request this, please ignore this email.

Best regards,
${appName} Team
`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Password Reset Request</h2>
  <p>Hi ${username},</p>
  <p>You requested a password reset for your ${appName} account.</p>
  <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
  <p>This link expires in ${formatExpiry}.</p>
  <p>If you didn't request this, please ignore this email.</p>
  <p>Best regards,<br>${appName} Team</p>
</div>
`,
  };
};

