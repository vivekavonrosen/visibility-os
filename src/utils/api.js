// ============================================================
// Anthropic API — Direct browser calls
// Uses claude-sonnet-4-20250514 for cost-effective MVP
// Upgrade to claude-opus-4-20250514 for deeper strategy outputs
// ============================================================

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

/**
 * Call Anthropic API and stream the response.
 * @param {string} prompt - The full prompt to send
 * @param {string} apiKey - User's Anthropic API key
 * @param {function} onChunk - Called with each text chunk as it arrives
 * @param {function} onDone - Called when streaming is complete with full text
 * @param {function} onError - Called on error with error message
 * @returns {AbortController} - Call .abort() to cancel
 */
export function streamCompletion(prompt, apiKey, onChunk, onDone, onError) {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          stream: true,
          system: `You are a senior business strategist specializing in helping accomplished professional women 50+ build visible authority businesses from their expertise. You give specific, grounded, commercially sharp advice. You avoid generic motivation, buzzwords, and vague inspiration. Every output is structured, actionable, and respects the intelligence of the reader. Use clear headers, short paragraphs, and concrete examples. Format your response in clean Markdown.`,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `API error: ${response.status} ${response.statusText}`;
        onError(msg);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const chunk = parsed.delta.text;
              fullText += chunk;
              onChunk(chunk, fullText);
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError(err.message || 'An unexpected error occurred.');
    }
  })();

  return controller;
}

/**
 * Non-streaming version for simpler use cases
 */
export async function callCompletion(prompt, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: `You are a senior business strategist specializing in helping accomplished professional women 50+ build visible authority businesses from their expertise. You give specific, grounded, commercially sharp advice. Format your response in clean Markdown.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export function validateApiKey(key) {
  return typeof key === 'string' && key.startsWith('sk-ant-') && key.length > 20;
}
