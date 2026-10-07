export async function sendMailgunEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain)
    throw new Error("Mailgun environment variables are missing.");
  const body = new URLSearchParams({
    from: process.env.MAIL_FROM || `Regsure <hello@${domain}>`,
    to,
    subject,
    html,
  });
  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!response.ok) throw new Error(`Mailgun failed with ${response.status}`);
  return response.json();
}
