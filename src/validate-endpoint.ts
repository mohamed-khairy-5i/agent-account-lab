/**
 * Strict URL parsing and endpoint validation.
 * Ensures custom endpoints adhere to security constraints:
 * - Valid WHATWG URL format.
 * - Forbids embedded user/password credentials.
 * - Restricts http: strictly to local testing (localhost, 127.0.0.1, [::1]).
 * - Enforces https: for all remote / external providers to protect API keys.
 * - Forbids non-HTTP protocols (e.g. javascript:, ftp:, data:).
 */
export function validateCustomEndpoint(endpoint: string): { valid: boolean; error?: string } {
  const trimmed = endpoint.trim();
  if (!trimmed || trimmed === '/api/llm') {
    return { valid: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { 
      valid: false, 
      error: 'عنوان URL غير صالح. يجب كتابة رابط مكتمل مثل https://api.openai.com/v1 (Invalid URL format)' 
    };
  }

  // Security check 1: Disallow user credentials embedded in URL
  if (parsed.username || parsed.password) {
    return { 
      valid: false, 
      error: 'غير مسموح بوضع اسم مستخدم أو كلمة مرور داخل الرابط (Credentials in URL forbidden)' 
    };
  }

  const allowedLocalHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  const hostname = parsed.hostname.toLowerCase();

  // Security check 2: Protocol restrictions
  if (parsed.protocol === 'http:') {
    if (!allowedLocalHosts.has(hostname)) {
      return { 
        valid: false, 
        error: `بروتوكول http:// غير مسموح به إلا للخوادم المحلية (localhost, 127.0.0.1). المزودات الخارجية (${hostname}) يجب أن تستخدم https:// لحماية المفتاح.` 
      };
    }
    return { valid: true };
  }

  if (parsed.protocol === 'https:') {
    return { valid: true };
  }

  return { 
    valid: false, 
    error: `البروتوكول ${parsed.protocol} غير مدعوم. استخدم https:// أو http://localhost` 
  };
}
