export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmProviderConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
}

// Hàm lọc dữ liệu nhạy cảm: email, số điện thoại, MSNV (giả định định dạng AM\w+ hoặc \d{6} gắn với họ tên)
export function maskSensitiveData(text: string): string {
  if (!text) return text;
  let masked = text;
  
  // Mask Email
  masked = masked.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '[EMAIL ĐÃ CHE]');
  
  // Mask Phone (VN format roughly: 03,05,07,08,09 + 8 digits)
  masked = masked.replace(/(0[3|5|7|8|9][0-9]{8})/g, '[SĐT ĐÃ CHE]');
  
  // Mask MSNV (Example: AM12345, AMDKG, or 6 digits) - very basic heuristic
  // Actually, masking too much might break user's intent. The user specifically said "MSNV kèm họ tên". 
  // We'll mask pure 6-digit MSNVs if they stand alone like "MSNV 123456"
  masked = masked.replace(/MSNV[\s:]*([a-zA-Z0-9]{5,8})/gi, 'MSNV [ĐÃ CHE]');

  return masked;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function askLLM(messages: LlmMessage[], maxTokens: number = 800): Promise<string> {
  const providers: LlmProviderConfig[] = [];
  
  // Load environment variables for providers
  const groqKey = (process.env as any).GROQ_API_KEY || (globalThis as any).GROQ_API_KEY;
  const groqModel = (process.env as any).GROQ_MODEL || (globalThis as any).GROQ_MODEL || 'llama3-8b-8192';

  const geminiKey = (process.env as any).GEMINI_API_KEY || (globalThis as any).GEMINI_API_KEY;
  const geminiModel = (process.env as any).GEMINI_MODEL || (globalThis as any).GEMINI_MODEL || 'gemini-1.5-flash';

  const openRouterKey = (process.env as any).OPENROUTER_API_KEY || (globalThis as any).OPENROUTER_API_KEY;
  const openRouterModel = (process.env as any).OPENROUTER_MODEL || (globalThis as any).OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';

  if (groqKey) {
    providers.push({
      name: 'Groq',
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqKey,
      model: groqModel
    });
  }
  if (geminiKey) {
    // Note: Gemini provides an OpenAI-compatible endpoint
    providers.push({
      name: 'Gemini',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: geminiKey,
      model: geminiModel
    });
  }
  if (openRouterKey) {
    providers.push({
      name: 'OpenRouter',
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: openRouterKey,
      model: openRouterModel
    });
  }

  if (providers.length === 0) {
    throw new Error("Chưa cấu hình API Key cho bất kỳ provider LLM nào.");
  }

  // Mask sensitive data in messages
  const maskedMessages = messages.map(msg => ({
    ...msg,
    content: maskSensitiveData(msg.content)
  }));

  const maxRetries = 3;

  for (const provider of providers) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(provider.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          },
          body: JSON.stringify({
            model: provider.model,
            messages: maskedMessages,
            max_tokens: maxTokens,
            temperature: 0.3
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
          }
          throw new Error("Invalid response format from LLM");
        }

        const errData = await res.text();
        
        // If it's a permanent error (like 400 Bad Request, 401 Unauthorized), don't retry on same provider
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          console.error(`[LLM] Provider ${provider.name} auth/request error: ${res.status}. Switching provider...`);
          break; // Switch to next provider
        }

        // Retry on 429, 500, 502, 503, 504
        throw new Error(`HTTP ${res.status}: ${errData}`);
      } catch (err: any) {
        console.warn(`[LLM] Attempt ${attempt} with ${provider.name} failed: ${err.message}`);
        if (attempt < maxRetries) {
          // Exponential backoff + jitter
          const backoff = Math.pow(2, attempt) * 500 + Math.random() * 500;
          await delay(backoff);
        } else {
          console.error(`[LLM] Provider ${provider.name} failed after ${maxRetries} attempts.`);
          // Continue to next provider in the outer loop
        }
      }
    }
  }

  throw new Error("Tất cả các dịch vụ LLM đều đang gặp sự cố. Vui lòng thử lại sau.");
}
