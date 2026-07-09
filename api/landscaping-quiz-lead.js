module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    primary_goal,
    property_area,
    yard_condition,
    desired_style,
    maintenance_preference,
    water_use_preference,
    budget_range,
    timeline,
    special_priorities,
    user_notes,
    uploaded_photos,
    recommendation_title,
    recommended_services,
    priority_level,
    project_type,
    suggested_next_step,
    personalized_explanation,
    customer_name,
    phone,
    email,
    property_address,
    preferred_contact_method,
    preferred_consultation_date,
    best_time_to_contact
  } = req.body;

  // Basic validation
  if (!customer_name || !phone || !email || !property_address) {
    return res.status(400).json({ error: 'Required contact fields (Name, Phone, Email, Address) are missing.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY environment variable is not configured. Submission logged locally.');
    return res.status(200).json({ 
      success: true, 
      warning: 'API Key not set. Lead saved locally.' 
    });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = process.env.RESEND_TO_EMAIL || 'hello@dreamsites.pro';

  const prioritiesText = special_priorities && special_priorities.length 
    ? special_priorities.join(', ') 
    : 'None specified';

  const servicesText = recommended_services && recommended_services.length 
    ? recommended_services.join(', ') 
    : 'None';

  // 1. HTML Email for the business owner
  const adminHtml = `
    <div style="font-family: sans-serif; color: #17201c; max-width: 600px; margin: 0 auto; border: 1px solid #e2ece7; padding: 25px; border-radius: 12px; background: #fafcfb;">
      <div style="background: #2d5a27; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="color: white; margin: 0; font-weight: normal; font-size: 20px;">New AI Landscape Quiz Lead</h2>
      </div>
      
      <p style="font-size: 15px;">A homeowner completed the AI Landscaping Recommendation Quiz and requested a consultation:</p>
      
      <h3 style="border-bottom: 2px solid #2d5a27; padding-bottom: 6px; color: #2d5a27; font-size: 16px; margin-top: 25px;">Customer Contact Details</h3>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 10px;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Name:</td><td style="padding: 6px 0;">${customer_name}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Phone:</td><td style="padding: 6px 0;">${phone}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td style="padding: 6px 0;">${email}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Address:</td><td style="padding: 6px 0;">${property_address}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Contact Method:</td><td style="padding: 6px 0;">${preferred_contact_method}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Pref. Date:</td><td style="padding: 6px 0;">${preferred_consultation_date || 'Anytime'}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Best Time:</td><td style="padding: 6px 0;">${best_time_to_contact || 'Anytime'}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #2d5a27; padding-bottom: 6px; color: #2d5a27; font-size: 16px; margin-top: 25px;">AI Plan Recommendation</h3>
      <div style="background: #e8f9e6; border-left: 4px solid #2d5a27; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555;">Recommended Direction:</span><br/>
        <strong style="font-size: 18px; color: #2d5a27; line-height: 1.3;">${recommendation_title}</strong>
        <table style="width: 100%; font-size: 12px; margin-top: 10px; border-collapse: collapse;">
          <tr><td style="font-weight: bold; width: 100px;">Priority Level:</td><td>${priority_level}</td></tr>
          <tr><td style="font-weight: bold;">Project Type:</td><td>${project_type}</td></tr>
          <tr><td style="font-weight: bold;">Suggested Next:</td><td>${suggested_next_step}</td></tr>
        </table>
      </div>
      
      <p style="font-size: 14px; font-weight: bold; color: #2d5a27; margin-bottom: 4px;">Recommended Services:</p>
      <p style="font-size: 13px; margin: 0 0 15px 0; color: #333;">${servicesText}</p>

      <p style="font-size: 14px; font-weight: bold; color: #2d5a27; margin-bottom: 4px;">AI Recommendation Reasoning:</p>
      <div style="font-size: 13px; color: #444; line-height: 1.5; background: #f4f6f5; padding: 12px; border-radius: 6px;">
        ${personalized_explanation || 'N/A'}
      </div>

      <h3 style="border-bottom: 2px solid #2d5a27; padding-bottom: 6px; color: #2d5a27; font-size: 16px; margin-top: 25px;">Homeowner Quiz Responses</h3>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
        <tr><td style="padding: 4px 0; font-weight: bold; width: 150px;">Primary Goal:</td><td>${primary_goal}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Property Area:</td><td>${property_area}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Current Condition:</td><td>${yard_condition}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Desired Style:</td><td>${desired_style}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Maintenance Prep:</td><td>${maintenance_preference}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Water Use Prep:</td><td>${water_use_preference}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Budget Range:</td><td>${budget_range}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold;">Timeline:</td><td>${timeline}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: bold; vertical-align: top;">Special Priorities:</td><td>${prioritiesText}</td></tr>
      </table>

      <h4 style="color: #2d5a27; margin-top: 20px; font-size: 14px;">Customer Notes:</h4>
      <p style="font-size: 13px; line-height: 1.5; font-style: italic; background: #fff; border: 1px dashed #ccc; padding: 10px; border-radius: 4px;">
        ${user_notes || 'None specified.'}
      </p>
    </div>
  `;

  // 2. HTML Email for the customer (Receipt confirmation)
  const clientHtml = `
    <div style="font-family: sans-serif; color: #17201c; max-width: 600px; margin: 0 auto; border: 1px solid #e2ece7; padding: 25px; border-radius: 12px; background: #fafcfb;">
      <h2 style="color: #2d5a27; margin-top: 0; font-weight: normal;">Your Landscaping Recommendation is Ready!</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #555;">Hi ${customer_name}, thanks for taking our AI Landscaping Recommendation Quiz. Here is the custom design concept we generated for your property:</p>
      
      <div style="background: #f4fcf3; padding: 18px; margin: 20px 0; border-radius: 8px; border: 1px solid #e8f9e6;">
        <h4 style="margin: 0 0 4px 0; font-size: 12px; color: #606763; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Direction</h4>
        <strong style="font-size: 20px; color: #2d5a27; display: block; margin-bottom: 12px;">${recommendation_title}</strong>
        
        <p style="font-size: 13px; line-height: 1.5; color: #333; margin: 0 0 12px 0;">
          <strong>Why this fits:</strong><br/>
          ${personalized_explanation ? personalized_explanation.split('\n\n')[0] : 'N/A'}
        </p>

        <p style="font-size: 12px; color: #555; margin: 0;">
          <strong>Services Highlight:</strong> ${servicesText}
        </p>
      </div>

      <h4 style="margin: 25px 0 8px 0; font-size: 14px; color: #2d5a27;">Next Steps for Your Project:</h4>
      <ol style="font-size: 13px; color: #555; padding-left: 20px; line-height: 1.6;">
        <li>A landscaping specialist will review your answers and any uploaded yard photos.</li>
        <li>We will follow up to finalize a consultation date (${preferred_consultation_date || 'Anytime'}).</li>
        <li>We will compile a complete project scope estimate range for your review.</li>
      </ol>
      
      <p style="font-size: 11px; color: #888; margin-top: 20px; line-height: 1.4;">
        * Disclaimer: This recommendation is for planning purposes only. Final service recommendations and pricing may vary after site inspection.
      </p>

      <p style="font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; color: #888; text-align: center;">
        Need to adjust your plans? Reach us at <a href="mailto:hello@dreamsites.pro" style="color: #2d5a27; text-decoration: underline;">hello@dreamsites.pro</a>.
      </p>
    </div>
  `;

  // Attachments preparation
  const attachments = [];
  if (uploaded_photos && uploaded_photos.length) {
    uploaded_photos.forEach(photo => {
      try {
        if (photo.base64 && photo.base64.includes('base64,')) {
          const rawContent = photo.base64.split('base64,')[1];
          attachments.push({
            filename: photo.name,
            content: rawContent,
            encoding: 'base64'
          });
        }
      } catch (err) {
        console.error("Failed to parse photo attachment:", photo.name, err);
      }
    });
  }

  try {
    // Send email to business
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `AI Landscape Quiz <${fromEmail}>`,
        to: toEmail,
        subject: `New AI Quiz Lead: ${customer_name} - ${recommendation_title}`,
        html: adminHtml,
        attachments: attachments
      })
    });

    if (!adminRes.ok) {
      const errText = await adminRes.text();
      console.error(`Resend Quiz Admin Email Error: ${errText}`);
    }

    // Send confirmation email to customer
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `GreenScape Landscaping <${fromEmail}>`,
        to: email,
        subject: `Your personalized landscaping plan is ready!`,
        html: clientHtml
      })
    });

    if (!clientRes.ok) {
      const errText = await clientRes.text();
      console.error(`Resend Quiz Customer Email Error: ${errText}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(200).json({ 
      success: true, 
      error: 'Failed to deliver emails, but lead data received successfully.' 
    });
  }
};
