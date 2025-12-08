import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBankAccountSchema, insertOrderSchema, processPaymentSchema, createOrderV2Schema, webhookPayloadSchema } from "@shared/schema";
import { sendSignedWebhook } from "./webhooks";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/create-account", async (req, res) => {
    try {
      const parsed = insertBankAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parsed.error.flatten() 
        });
      }
      
      const account = await storage.createBankAccount(parsed.data);
      return res.status(201).json(account);
    } catch (error) {
      console.error("Error creating bank account:", error);
      return res.status(500).json({ error: "Failed to create bank account" });
    }
  });

  app.get("/api/accounts", async (_req, res) => {
    try {
      const accounts = await storage.getBankAccounts();
      return res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/create-order", async (req, res) => {
    try {
      const parsed = insertOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parsed.error.flatten() 
        });
      }
      
      const order = await storage.createOrder(parsed.data);
      return res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Enhanced v2 create order endpoint
  app.post("/api/v2/orders", async (req, res) => {
    try {
      const parsed = createOrderV2Schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }

      // basic URL rules: require https, but allow http for localhost during sandbox/testing
      const { return_url, callback_url } = parsed.data;
      try {
        const ru = new URL(return_url);
        const cu = new URL(callback_url);
        const okReturn = ru.protocol === "https:" || ru.hostname === "localhost" || ru.hostname === "127.0.0.1";
        const okCallback = cu.protocol === "https:" || cu.hostname === "localhost" || cu.hostname === "127.0.0.1";
        if (!okReturn || !okCallback) {
          return res.status(400).json({ error: "ERR_URL_NOT_REGISTERED", message: "return_url and callback_url must be HTTPS and pre-registered" });
        }
      } catch (e) {
        return res.status(400).json({ error: "ERR_URL_NOT_REGISTERED", message: "invalid return_url or callback_url" });
      }

      const created = await storage.createOrderV2(parsed.data);

      return res.status(201).json({
        gateway_order_id: created.gateway_order_id,
        redirect_url: created.redirect_url,
        one_time_order_token: created.one_time_order_token,
        test_mode: !!parsed.data.test_mode,
      });
    } catch (error) {
      console.error("Error creating v2 order:", error);
      return res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/process-payment", async (req, res) => {
    try {
      const parsed = processPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parsed.error.flatten() 
        });
      }

      const { orderId, amount, paymentMethod, bankAccountId, cardDetails, upiId } = parsed.data;

      let order = await storage.getOrder(orderId);
      // support v2 gateway order ids (gw_...)
      if (!order && orderId && orderId.startsWith("gw_")) {
        // @ts-ignore
        const v2 = await storage.getV2Order(orderId);
        if (!v2) return res.status(404).json({ error: "Order not found" });
        // keep order undefined for v2 flows; v2 handling occurs later
      } else if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      let status: "success" | "failed" = "success";
      let failureReason: string | undefined;
      let bankName: string | undefined;

      if (paymentMethod === "netbanking" && bankAccountId) {
        const bankAccount = await storage.getBankAccount(bankAccountId);
        if (!bankAccount) {
          return res.status(404).json({ error: "Bank account not found" });
        }

        bankName = bankAccount.bankName;

        if (bankAccount.balance < amount) {
          status = "failed";
          failureReason = "Insufficient balance in the selected bank account";
        } else {
          await storage.updateBankAccountBalance(bankAccountId, bankAccount.balance - amount);
        }
      } else if (paymentMethod === "card" && cardDetails) {
        const lastFourDigits = cardDetails.cardNumber.slice(-4);
        if (lastFourDigits === "0000") {
          status = "failed";
          failureReason = "Card declined by issuer";
        } else if (lastFourDigits === "1111") {
          status = "failed";
          failureReason = "Insufficient funds";
        }
      } else if (paymentMethod === "upi" && upiId) {
        if (upiId.includes("fail")) {
          status = "failed";
          failureReason = "UPI transaction declined";
        }
      }

      const transaction = await storage.createTransaction({
        orderId,
        amount,
        paymentMethod,
        bankAccountId,
        bankName,
        status,
        failureReason,
        timestamp: new Date().toISOString(),
      });

      // If this payment was for a v2 order, send signed webhook to merchant's callback_url
      try {
        const v2order = await storage.getOrderByMerchantId("", "");
        // try to find by gateway_order if orderId looks like gw_
        let v2: any | undefined = undefined;
        // if orderId looks like a gateway order id we will try direct lookup below

        // simple attempt: check v2orders map via storage (duck-typed)
        // we will attempt to access storage.v2orders if present (this is in-memory implementation)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if ((storage as any).v2orders) {
          // @ts-ignore
          v2 = (storage as any).v2orders.get(orderId);
        }

        if (v2) {
          // mark order paid/completed in v2 storage for session exchange
          v2.status = status === "success" ? "COMPLETED" : "FAILED";
          v2.paid_at = new Date().toISOString();
          v2.transaction_id = transaction.id;

          const payload = {
            gateway_order_id: v2.gateway_order_id,
            merchant_order_id: v2.merchant_order_id,
            payment_ref: transaction.id,
            status: status === "success" ? "SUCCESS" : "FAILED",
            amount_in_paisa: v2.amount_in_paisa,
            currency: v2.currency,
            paid_at: new Date().toISOString(),
            payment_method: paymentMethod.toUpperCase(),
            card: paymentMethod === "card" && cardDetails ? { network: "", masked: `****${cardDetails.cardNumber.slice(-4)}`, token_id: undefined } : undefined,
            one_time_order_token: v2.one_time_order_token,
            test_mode: !!v2.test_mode,
            metadata: v2.metadata,
          };

          const raw = JSON.stringify(payload);
          const secret = v2.test_mode ? process.env.MERCHANT_TEST_WEBHOOK_SECRET ?? "test_secret" : process.env.MERCHANT_WEBHOOK_SECRET ?? "prod_secret";

          // send webhook asynchronously, don't block response
          sendSignedWebhook({ url: v2.callback_url, body: raw, secret, idempotencyKey: transaction.id, testMode: !!v2.test_mode }).then((r) => {
            if (!r.success) console.error("Webhook delivery failed for", v2.callback_url);
          });
        }
      } catch (err) {
        console.error("Error attempting to send webhook:", err);
      }

      return res.status(201).json(transaction);

    // Return endpoint used after payment to perform server-side session creation (Pattern A demo)
    app.get("/pay/return", async (req, res) => {
      try {
        const gw = (req.query.gw_order || req.query.gateway_order_id || req.query.orderId) as string | undefined;
        if (!gw) return res.status(400).send("missing gw_order");

        // try to fetch v2 order
        // @ts-ignore
        const v2 = await storage.getV2Order(gw);
        if (!v2) return res.status(404).send("order not found");

        if (v2.status === "COMPLETED") {
          // create server-side session for the customer (demo)
          // @ts-ignore
          req.session.user = {
            merchant_id: v2.merchant_id,
            merchant_order_id: v2.merchant_order_id,
            customer_id: v2.customer?.customer_id,
            gateway_order_id: v2.gateway_order_id,
          };

          // If the merchant's return_url is on the same host as the gateway (sandbox flow), we can redirect there.
          // Otherwise, redirect to a gateway-hosted success page that demonstrates the session was created.
          const returnUrl = v2.return_url;
          try {
            const returnHost = new URL(returnUrl).host;
            // if return host equals our host, redirect directly
            if (returnHost === req.headers.host) {
              return res.redirect(returnUrl);
            }
          } catch (e) {
            // ignore
          }

          // redirect to gateway demo success page that reads session
          return res.redirect(`/merchant/success?gw_order=${encodeURIComponent(gw)}`);
        }

        return res.redirect(`${v2.return_url}?status=${encodeURIComponent(v2.status || "PENDING")}`);
      } catch (err) {
        console.error("/pay/return error", err);
        return res.status(500).send("internal error");
      }
    });

    // Demo merchant success route: shows session information (for sandbox/demo only)
    app.get("/merchant/success", (req, res) => {
      // @ts-ignore
      const user = req.session?.user;
      if (!user) return res.status(403).send("no session");

      res.setHeader("Content-Type", "text/html;charset=utf-8");
      res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Merchant Success</title></head><body><h1>Logged in (demo)</h1><pre>${JSON.stringify(user,null,2)}</pre><p>This demonstrates server-side session creation on payment completion (Pattern A demo).</p></body></html>`);
    });
    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({ error: "Failed to process payment" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      return res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.get("/api/transactions", async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const parsed = insertBankAccountSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parsed.error.flatten() 
        });
      }
      
      const account = await storage.updateBankAccount(req.params.id, parsed.data);
      if (!account) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      return res.json(account);
    } catch (error) {
      console.error("Error updating bank account:", error);
      return res.status(500).json({ error: "Failed to update bank account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBankAccount(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      return res.status(500).json({ error: "Failed to delete bank account" });
    }
  });

  return httpServer;
}
