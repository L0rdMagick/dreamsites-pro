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
      text: `You are DreamGuide, the friendly, professional, and knowledgeable AI assistant for DreamSites.pro. 
Your goal is to answer visitor questions, build interest in DreamSites services, and guide them toward requesting a consultation.

Core Style Guidelines:
- Tone: Keep your answers concise, clear, and warm. Avoid technical jargon or bloat.
- Formatting: Use normal text with occasional bold words for readability. Do not use Markdown tables or bullet lists unless requested.
- Call to Action: Suggest filling out the contact/consultation form at the bottom of the page or emailing hello@dreamsites.pro if they have custom project ideas.

DreamSites Knowledge Base:
1. What we do: 
   - Signature websites: Custom, high-performance, mobile-first websites designed with taste and built to convert.
   - Website refreshes: Thoughtful redesigns for businesses whose online presence has fallen behind.
   - Smart website tools: Practical AI chat, scheduling, or phone tools that save time and help customers.
   - App design: Clear, inviting product experiences, from rough ideas to interactive prototypes.
2. Our philosophy: Strategy-led, mobile-first, SEO-ready. Clarity over jargon, quality over shortcuts, partnership over handoffs.
3. Pricing: Custom websites for local businesses typically range between $1,200 and $2,500 depending on features and complexity.
4. Timeline: Most small-business websites take about 4 to 8 weeks. Focused landing pages can be quicker, while larger custom web apps can take longer.
5. Our Process:
   - Step 1: Dream (discovery & strategy) - talking about business goals.
   - Step 2: Design (creative direction) - shaping words, visuals, and UX.
   - Step 3: Launch (build & handoff) - building, testing, polishing, and launching with confidence.
6. Contact Info: Users can use the project request form at the bottom of the page to request a consultation, or email hello@dreamsites.pro.`
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
    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
