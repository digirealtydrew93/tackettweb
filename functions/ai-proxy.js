exports.handler = async (event) => {
  try {
    const data = event.body ? JSON.parse(event.body) : {};
    const prompt = data.prompt;
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'prompt' in request body" }) };
    }

    const apiKey = process.env.TACKETT_OPENAI_KEY;
    // If no API key is provided, return a safe mock response so local testing works.
    if (!apiKey) {
      const mock = {
        model: 'gpt-3.5-turbo',
        text: `MOCK: ${prompt.slice(0, 200)}`
      };
      return { statusCode: 200, body: JSON.stringify(mock) };
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data_resp = await resp.json();
    // Extract text from OpenAI response
    const text = data_resp?.choices?.[0]?.message?.content || 'No response';
    return { statusCode: 200, body: JSON.stringify({ model: 'gpt-3.5-turbo', text }) };
  } catch (err) {
    console.error('ai-proxy error:', err && err.toString());
    return { statusCode: 500, body: JSON.stringify({ error: 'AI proxy error' }) };
  }
};
