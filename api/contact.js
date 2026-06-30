module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, service, message } = req.body;

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: 'All fields (name, email, service, message) are required.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = process.env.RESEND_TO_EMAIL || 'hello@dreamsites.pro';

  const html = `
    <div style="font-family: sans-serif; color: #17201c; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
      <h2 style="color: #ff6b52; margin-top: 0;">New Contact Form Submission!</h2>
      <p>A visitor has requested a consultation through the contact form.</p>
      
      <div style="background: #faf8f2; border-left: 4px solid #ff6b52; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>Name:</strong> ${name}<br/>
        <strong>Email:</strong> ${email}<br/>
        <strong>Service:</strong> ${service}<br/>
      </div>
      
      <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px;">Message:</h3>
      <div style="padding-top: 10px; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">
        ${message}
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `DreamSites Contact Form <${fromEmail}>`,
        to: toEmail,
        subject: `New Lead: ${name} (${service})`,
        html: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API Error: ${errText}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
};
