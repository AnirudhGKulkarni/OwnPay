import { z } from "zod";

export const bankAccountSchema = z.object({
  id: z.string(),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  bankName: z.string().min(1, "Bank name is required"),
  balance: z.number().min(0, "Balance cannot be negative"),
});

export const insertBankAccountSchema = bankAccountSchema.omit({ id: true });

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

export const orderSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  amount: z.number().min(1, "Amount must be at least 1"),
});

export const insertOrderSchema = orderSchema.omit({ id: true });

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type PaymentMethod = "card" | "upi" | "netbanking";

export const transactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  paymentMethod: z.enum(["card", "upi", "netbanking"]),
  bankAccountId: z.string().optional(),
  bankName: z.string().optional(),
  status: z.enum(["success", "failed"]),
  failureReason: z.string().optional(),
  timestamp: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const processPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  paymentMethod: z.enum(["card", "upi", "netbanking"]),
  bankAccountId: z.string().optional(),
  cardDetails: z.object({
    cardNumber: z.string(),
    expiry: z.string(),
    cvv: z.string(),
    cardHolderName: z.string(),
  }).optional(),
  upiId: z.string().optional(),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
