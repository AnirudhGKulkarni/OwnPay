import crypto from "crypto";

export interface WebhookOptions {
  url: string;
  body: string; // raw JSON string
  secret: string; // merchant webhook secret
  maxRetries?: number;
  idempotencyKey?: string;
  testMode?: boolean;
}

function computeSignature(secret: string, payload: string) {
  const h = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${h}`;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function sendSignedWebhook(opts: WebhookOptions) {
  const maxRetries = opts.maxRetries ?? 5;
  let attempt = 0;
  const baseDelay = 1000; // 1s
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = computeSignature(opts.secret, opts.body);

  while (attempt <= maxRetries) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Gateway-Signature": signature,
        "X-Gateway-Timestamp": timestamp,
        "X-Gateway-Retry-Count": String(attempt),
      };
      if (opts.idempotencyKey) headers["X-Gateway-Idempotency-Key"] = opts.idempotencyKey;
      if (opts.testMode) headers["X-Gateway-Test-Mode"] = "true";

      const res = await fetch(opts.url, {
        method: "POST",
        headers,
        body: opts.body,
        // follow redirects
      });

      if (res.ok) {
        return { success: true, status: res.status };
      }

      // non-200 -> will retry
      attempt++;
      const jitter = Math.floor(Math.random() * 300);
      const delay = Math.min(30000, baseDelay * 2 ** attempt + jitter);
      await sleep(delay);
    } catch (err) {
      attempt++;
      const jitter = Math.floor(Math.random() * 300);
      const delay = Math.min(30000, baseDelay * 2 ** attempt + jitter);
      await sleep(delay);
    }
  }

  return { success: false, status: 0 };
}
