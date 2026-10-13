const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

async function generateText({ systemPrompt, userPrompt, maxOutputTokens = 800, responseMimeType }) {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) throw new Error('AI_PROVIDER_API_KEY is not configured.');

  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'gemini') {
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    if (!/^[a-z0-9.-]+$/i.test(model)) throw new Error('GEMINI_MODEL contains invalid characters.');

    const generationConfig = { maxOutputTokens };
    if (responseMimeType) generationConfig.responseMimeType = responseMimeType;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig,
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini request failed with status ${response.status}.`);
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned no text. Check the prompt and API key permissions.');
    return text;
  }

  if (provider !== 'anthropic') throw new Error(`Unsupported AI_PROVIDER "${provider}".`);

  const response = await fetch(`${process.env.AI_PROVIDER_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxOutputTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Anthropic request failed with status ${response.status}.`);
  }
  return (data.content || []).map((part) => part.text || '').join('').trim();
}

module.exports = { generateText };
