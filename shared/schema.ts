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

// Enhanced v2 order contract
export const customerSchema = z.object({
  customer_id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const planSchema = z.object({
  plan_id: z.string(),
  name: z.string().optional(),
});

export const createOrderV2Schema = z.object({
  merchant_id: z.string(),
  order_id: z.string(),
  one_time_order_token: z.string().min(32).max(128).optional(),
  amount_in_paisa: z.number().int().positive(),
  currency: z.string().default("INR"),
  display_amount: z.string().optional(),
  customer: customerSchema.optional(),
  plan: planSchema.optional(),
  return_url: z.string().url(),
  callback_url: z.string().url(),
  test_mode: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  idempotency_key: z.string().optional(),
});

export type CreateOrderV2 = z.infer<typeof createOrderV2Schema>;

export const webhookPayloadSchema = z.object({
  gateway_order_id: z.string(),
  merchant_order_id: z.string(),
  payment_ref: z.string(),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]),
  amount_in_paisa: z.number().int(),
  currency: z.string(),
  paid_at: z.string().optional(),
  payment_method: z.string().optional(),
  card: z.object({
    network: z.string().optional(),
    masked: z.string().optional(),
    token_id: z.string().optional(),
  }).optional(),
  one_time_order_token: z.string().optional(),
  test_mode: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

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
