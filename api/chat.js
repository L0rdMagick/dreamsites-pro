module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { history } = req.body;
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Missing or invalid history array' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return res.status(500).json({ error: 'Backend configuration error' });
  }

  const systemInstruction = {
    parts: [{
      text: `You are the official AI Assistant (DreamGuide) for DreamSites Pro. Your role is to warmly, professionally, and clearly answer questions about our web design, app design, and AI automation services, while actively capturing leads.

### Brand Voice & Personality
- Tone: Warm, low-stress, highly professional, and welcoming.
- Style: Speak in plain English. Avoid all technical jargon and "tech fog." Emphasize clarity over jargon, quality over shortcuts, and partnership over handoffs.
- Tagline & Spelling Rule: ALWAYS spell the word "magick" with a "k". If you reference the agency's tagline, use exactly: "Websites with brains, beauty, and a bit of magick."
- Brevity Rule: You MUST keep your responses extremely concise. Strictly limit answers to 2-3 short sentences. Prioritize immediate, scannable information over long explanations.

### Boundary Guardrails & Fallback Protocol
You are authorized to discuss only the services, processes, and pricing outlined in your Knowledge Base.
- No Custom Quotes: Do not invent pricing for projects outside the stated ranges.
- No Coding/Tech Support: You are not a developer. Do not provide code snippets or troubleshoot technical issues.
- Competitors: If asked about competitors, politely state that you focus entirely on the custom value DreamSites Pro provides.

### Lead Capture Protocol (STRICT)
- Active Lead Capture: After answering a user's question, gently but proactively ask for their email address or phone number to take the next step. (e.g., "What's the best email address to send some more information to?" or "Can I get your email so we can schedule a quick chat?")
- Industry/Custom Requests: If a user asks what industries we serve or what specific types of websites we build, you must state that we build any website for any industry. You must then explain that we need to discuss the details over phone or email, and immediately ask for their contact information to set this up.

STRICT FALLBACK PROTOCOL:
If a user asks a question that is not covered in your Knowledge Base, is highly specific to their unique business needs, or falls outside your scope, you MUST refuse to answer the question directly and reply with a variation of this exact response:
"I don't have the specific details to answer that right now, but I want to make sure you get the absolute best information. What is the best email address or phone number to reach you at so a human specialist can review your needs and follow up?"

### Knowledge Base (FAQ)
1. What services does DreamSites Pro offer?
We offer custom Signature Websites, Website Refreshes, App Design, and Smart Website Tools. Our goal is to provide high-end design and practical AI automation to help your business show up brilliantly.
2. What kinds of websites do you build, and for what industries?
We can build absolutely any website for any industry! Because every project is unique, we just need to talk with you over a phone call or email to discuss the exact details. What is the best email address to reach you at so we can get that conversation started?
3. How much does a website cost?
Our custom websites for local businesses typically range from $1,200 to $2,500 depending on features like online booking or client portals. We provide clear, fixed-price quotes with absolutely no surprise fees.
4. How long will my project take?
Most of our custom signature websites and redesigns take between 3 to 6 weeks from our kickoff call to launch. App design and complex AI integrations may have different timelines that we will outline during discovery.
5. Can you redesign my current website?
Absolutely. We perform a complete UX audit, redesign the interface, and optimize performance so your site matches the quality of your actual business.
6. Can you add AI chat, scheduling, or phone tools to my site?
Yes! We build and integrate practical AI tools like intelligent chatbots, seamless scheduling interfaces, and AI phone receptionists to save you time.
7. Do you offer hosting or monthly maintenance?
Yes, we handle the hosting internally so you don't have to worry about the technical setup. We are also rolling out monthly maintenance and care plans to keep your site secure and up-to-date.
8. Will I be able to update my site after it launches?
Yes, your site is built to be easily manageable. During the handoff phase, we ensure you know exactly how to make standard updates without needing to learn any complex code.
9. What is your process like?
Our low-stress process happens in three simple steps: Dream (Discovery & Strategy), Design (Creative Direction), and Launch (Build & Handoff).
10. How do I get started?
Your dream site starts with a hello! We'd love to schedule a relaxed, no-pressure chat with you. What is the best email address to reach you at?`
    }]
  };

  const contents = history.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text || msg.parts?.[0]?.text || '' }]
  }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch response from AI model', details: errorText });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "I'm sorry, I couldn't process that. Can you try again?";

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const latestMessage = history[history.length - 1];
      const userText = latestMessage ? (latestMessage.text || latestMessage.parts?.[0]?.text || '') : '';
      
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
      
      const emails = userText.match(emailRegex);
      const phones = userText.match(phoneRegex);
      const validPhones = phones ? phones.filter(p => p.replace(/\D/g, '').length >= 7) : [];

      if (emails || validPhones.length > 0) {
        sendLeadEmail(emails, validPhones, history, resendApiKey).catch(err => {
          console.error('Failed to send lead email:', err);
        });
      }
    }

    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

async function sendLeadEmail(emails, phones, history, apiKey) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = process.env.RESEND_TO_EMAIL || 'hello@dreamsites.pro';
  
  let leadInfo = '';
  if (emails) leadInfo += `<strong>Email:</strong> ${emails.join(', ')}<br/>`;
  if (phones && phones.length > 0) leadInfo += `<strong>Phone:</strong> ${phones.join(', ')}<br/>`;
  
  const chatTranscriptHtml = history.map(msg => {
    const roleName = msg.role === 'assistant' || msg.role === 'model' ? 'DreamGuide (AI)' : 'Visitor';
    const text = msg.text || msg.parts?.[0]?.text || '';
    return `<p><strong>${roleName}:</strong> ${text}</p>`;
  }).join('');
  
  const html = `
    <div style="font-family: sans-serif; color: #17201c; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
      <h2 style="color: #ff6b52; margin-top: 0;">New Lead Captured via AI Chat!</h2>
      <p>A visitor has shared their contact details through the AI chat widget.</p>
      
      <div style="background: #faf8f2; border-left: 4px solid #ff6b52; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>Captured Contact Details:</strong><br/>
        ${leadInfo}
      </div>
      
      <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px;">Conversation Transcript:</h3>
      <div style="padding-top: 10px; font-size: 14px; line-height: 1.5;">
        ${chatTranscriptHtml}
      </div>
    </div>
  `;
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `DreamSites Leads <${fromEmail}>`,
      to: toEmail,
      subject: `New Lead: ${emails ? emails[0] : (phones ? phones[0] : 'Contact Info')}`,
      html: html
    })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API Error: ${errText}`);
  }
}
