import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBankAccountSchema, insertOrderSchema, processPaymentSchema } from "@shared/schema";

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

      const order = await storage.getOrder(orderId);
      if (!order) {
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

      return res.status(201).json(transaction);
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

  return httpServer;
}
