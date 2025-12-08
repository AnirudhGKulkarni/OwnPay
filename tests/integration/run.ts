import http from "http";
import { spawn, ChildProcess } from "child_process";
import crypto from "crypto";

async function findFreePort(start = 5200, end = 5999): Promise<number> {
  for (let p = start; p <= end; p++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = http.createServer();
        s.once("error", (err: any) => {
          s.close();
          reject(err);
        });
        s.once("listening", () => {
          s.close();
          resolve();
        });
        s.listen(p, "127.0.0.1");
      });
      return p;
    } catch (e) {
      // try next
    }
  }
  throw new Error("no free port found");
}

const DEFAULT_GATEWAY_PORT_PROMISE = (async () => {
  const envPort = process.env.TEST_GATEWAY_PORT ? parseInt(process.env.TEST_GATEWAY_PORT, 10) : undefined;
  if (envPort) return envPort;
  return await findFreePort();
})();

let GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN || `http://localhost:5050`;
const WEBHOOK_PORT = 6000;
const WEBHOOK_PATH = "/webhook";
const MERCHANT_TEST_SECRET = process.env.MERCHANT_TEST_WEBHOOK_SECRET || "test_secret";

function computeSignature(secret: string, body: string) {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function waitForGateway(): Promise<ChildProcess | null> {
  // Always spawn a local dev server for deterministic tests
  console.log("Starting local gateway dev server for tests");

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = await findFreePort();
    const actualPort = port;
    GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN || `http://localhost:${actualPort}`;
    const env = { ...process.env, MERCHANT_TEST_WEBHOOK_SECRET: MERCHANT_TEST_SECRET, PORT: String(actualPort) };
    const cp = spawn("npx", ["tsx", "server/index.ts"], { shell: true, env, stdio: ["ignore", "pipe", "pipe"] });

    cp.stdout?.on("data", (d) => process.stdout.write(`[server stdout] ${d}`));
    cp.stderr?.on("data", (d) => process.stderr.write(`[server stderr] ${d}`));

    // wait for the "serving on port" log
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("server start timeout")), 15000);
        const onData = (chunk: Buffer) => {
          const s = String(chunk);
          if (s.toLowerCase().includes("serving on port") || s.toLowerCase().includes("listening")) {
            clearTimeout(timeout);
            cp.stdout?.off("data", onData);
            resolve();
          }
        };
        cp.stdout?.on("data", onData);
        cp.on("exit", (code) => {
          clearTimeout(timeout);
          reject(new Error(`server process exited with code ${code}`));
        });
      });
      return cp;
    } catch (e) {
      console.error("server start failed on port", actualPort, e);
      try {
        cp.kill();
      } catch {}
      // try next port
    }
  }

  throw new Error("failed to start server after multiple attempts");
}

async function runTests() {
  let serverProcess: ChildProcess | null = null;
  try {
    serverProcess = await waitForGateway();

    const received: Array<{ headers: http.IncomingHttpHeaders; raw: string }> = [];

    // webhook server behavior: for the first test, accept immediately; for test 2 (retry) we will reject first request then accept
    let rejectFirst = false;

    const webhookServer = http.createServer(async (req, res) => {
      if (req.url !== WEBHOOK_PATH) {
        res.writeHead(404).end();
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString("utf-8");
      const headers = req.headers;
      console.log("[webhook] received headers:", headers);
      console.log("[webhook] raw body:", raw);
      received.push({ headers, raw });

      // simulate platform signature validation
      try {
        const expected = computeSignature(MERCHANT_TEST_SECRET, raw);
        const got = headers["x-gateway-signature"] as string | undefined;
        if (!got || got !== expected) {
          console.log("[webhook] signature mismatch", got, expected);
          // respond 400 to simulate rejection (gateway should retry)
          res.writeHead(400).end("bad signature");
          return;
        }
      } catch (e) {
        console.error(e);
        res.writeHead(400).end("error");
        return;
      }

      // simulate amount mismatch rejection if header asked
      const simulateAmountMismatch = headers["x-simulate-amount-mismatch"] === "1";
      if (simulateAmountMismatch) {
        res.writeHead(400).end("ERR_AMOUNT_MISMATCH");
        return;
      }

      // optionally reject first request to test retry logic
      if (rejectFirst) {
        rejectFirst = false; // only once
        console.log("[webhook] intentionally rejecting first request to test retry behavior");
        res.writeHead(500).end("transient error");
        return;
      }

      res.writeHead(200).end("ok");
    });

    await new Promise<void>((resolve, reject) => {
      webhookServer.listen(WEBHOOK_PORT, (err?: any) => {
        if (err) return reject(err);
        console.log("Webhook server listening on port", WEBHOOK_PORT);
        resolve();
      });
    });

    // Test 1: Happy path
    console.log("TEST 1: Happy path - create v2 order and process payment, expect signed webhook");
    const orderResp = await fetch(`${GATEWAY_ORIGIN}/api/v2/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: "mer_test",
        order_id: "order_test_1",
        amount_in_paisa: 49900,
        currency: "INR",
        display_amount: "₹499.00",
        customer: { customer_id: "cust_1", name: "Test User", email: "t@e.com", phone: "+911234567890" },
        plan: { plan_id: "plan1", name: "Pro" },
        return_url: `http://localhost:5000/pay/return`,
        callback_url: `http://localhost:${WEBHOOK_PORT}${WEBHOOK_PATH}`,
        test_mode: true,
      }),
    });

    if (![200, 201].includes(orderResp.status)) throw new Error(`create order failed: ${orderResp.status}`);
    const orderJson = await orderResp.json();
    console.log("create order response:", orderJson);

    const gw = orderJson.gateway_order_id;
    if (!gw) throw new Error("no gateway_order_id returned");

    // call process-payment to trigger webhook
    const payResp = await fetch(`${GATEWAY_ORIGIN}/api/process-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: gw, amount: 49900, paymentMethod: "card", cardDetails: { cardNumber: "4242424242424242", expiry: "12/30", cvv: "123", cardHolderName: "Test" } }),
    });
    if (![200, 201].includes(payResp.status)) throw new Error(`process payment failed: ${payResp.status}`);
    const payJson = await payResp.json();
    console.log("process-payment response", payJson);

    // wait for webhook (with timeout)
    await waitForWebhook(received, 10000);
    const first = received[received.length - 1];
    verifyWebhookPayload(first.raw, first.headers);
    console.log("TEST 1 passed\n");

    // Test 2: Webhook retry behavior (simulate transient failure on first delivery)
    console.log("TEST 2: Webhook retry behavior - gateway should retry when receiver returns 5xx");
    // set flag to reject first request
    rejectFirst = true;
    // create new order
    const orderResp2 = await fetch(`${GATEWAY_ORIGIN}/api/v2/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: "mer_test",
        order_id: "order_test_2",
        amount_in_paisa: 10000,
        currency: "INR",
        display_amount: "₹100.00",
        customer: { customer_id: "cust_2" },
        plan: { plan_id: "plan2" },
        return_url: `http://localhost:5000/pay/return`,
        callback_url: `http://localhost:${WEBHOOK_PORT}${WEBHOOK_PATH}`,
        test_mode: true,
      }),
    });
    const ord2 = await orderResp2.json();
    const gw2 = ord2.gateway_order_id;
    const payResp2 = await fetch(`${GATEWAY_ORIGIN}/api/process-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: gw2, amount: 10000, paymentMethod: "card", cardDetails: { cardNumber: "4242424242424242", expiry: "12/30", cvv: "123", cardHolderName: "Test" } }),
    });
    if (![200, 201].includes(payResp2.status)) throw new Error(`process payment failed: ${payResp2.status}`);

    // wait for at least 2 webhook attempts (first rejected, second accepted)
    await waitForWebhookCount(received, 2, 20000);
    console.log(`Webhook attempts: ${received.length}`);
    console.log("TEST 2 passed\n");

    // cleanup
    webhookServer.close();

    console.log("All tests passed");

    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(0);
  } catch (err) {
    console.error("Test run error:", err);
    process.exit(1);
  }
}

function verifyWebhookPayload(raw: string, headers: http.IncomingHttpHeaders) {
  const sig = headers["x-gateway-signature"] as string | undefined;
  if (!sig) throw new Error("missing signature header");
  const expected = computeSignature(MERCHANT_TEST_SECRET, raw);
  if (sig !== expected) throw new Error(`signature mismatch: got ${sig} expected ${expected}`);
  const payload = JSON.parse(raw);
  if (!payload.gateway_order_id) throw new Error("missing gateway_order_id in payload");
  if (!payload.payment_ref) throw new Error("missing payment_ref in payload");
  console.log("Webhook payload verified. status=", payload.status);
}

async function waitForWebhook(received: any[], timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (received.length > 0) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("timeout waiting for webhook");
}

async function waitForWebhookCount(received: any[], count: number, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (received.length >= count) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`timeout waiting for ${count} webhook attempts`);
}

runTests();
