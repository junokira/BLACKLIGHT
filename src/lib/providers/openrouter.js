export async function orChat({
  messages,
  model = 'openai/gpt-4o-mini',
  apiKey = import.meta.env.VITE_OPENROUTER_KEY,
  stream = false,
}) {
  if (!apiKey) throw new Error('Missing VITE_OPENROUTER_KEY');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      'X-Title': 'BLACKLIGHT',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function orVision({
  prompt,
  imageUrl,
  model = 'openai/gpt-4o-mini',
  apiKey = import.meta.env.VITE_OPENROUTER_KEY,
}) {
  const messages = [
    { role: 'system', content: 'You are an expert visual analyst.' },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt || 'Analyze this image.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
  return orChat({ messages, model, apiKey });
}


