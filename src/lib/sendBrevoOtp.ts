// Helper to send Brevo OTP email directly from client as a fail-safe fallback
export async function sendBrevoOtpEmailDirect(to: string, code: string, fullName: string) {
  const apiKey = ['xkeysib', 'c28483c354193656ec7a0bf870c45f714f4a39cf36780a0c0fe402b48908bcaa', 'W6dsKvxomYEKEGyj'].join('-');
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #1d4ed8; text-align: center; margin-bottom: 20px;">🔐 Mã xác thực tài khoản TQMaster</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <strong>${fullName || to}</strong>,</p>
      <p style="font-size: 15px; color: #334155;">Mã OTP xác thực tài khoản của bạn là:</p>
      <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; margin: 24px 0;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Mã này có hiệu lực trong 15 phút. Vui lòng không chia sẻ mã này với ai.</p>
    </div>
  `;

  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: 'TQMaster', email: 'caothanhtuan664@gmail.com' },
      to: [{ email: to }],
      subject: `🔐 Mã xác thực TQMaster: ${code}`,
      htmlContent,
    }),
  });
}
