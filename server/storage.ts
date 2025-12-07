import type { BankAccount, InsertBankAccount, Order, InsertOrder, Transaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  getBankAccounts(): Promise<BankAccount[]>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  updateBankAccountBalance(id: string, newBalance: number): Promise<BankAccount | undefined>;
  updateBankAccount(id: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: string): Promise<boolean>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactions(): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private bankAccounts: Map<string, BankAccount>;
  private orders: Map<string, Order>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.bankAccounts = new Map();
    this.orders = new Map();
    this.transactions = new Map();
    
    this.seedInitialData();
  }

  private seedInitialData() {
    const initialAccounts: InsertBankAccount[] = [
      {
        accountHolderName: "John Doe",
        accountNumber: "1234567890123",
        bankName: "HDFC Bank",
        balance: 50000,
      },
      {
        accountHolderName: "Jane Smith",
        accountNumber: "9876543210987",
        bankName: "ICICI Bank",
        balance: 25000,
      },
      {
        accountHolderName: "Test User",
        accountNumber: "5555666677778888",
        bankName: "State Bank of India",
        balance: 1000,
      },
    ];

    initialAccounts.forEach((account) => {
      const id = randomUUID();
      this.bankAccounts.set(id, { ...account, id });
    });
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const id = randomUUID();
    const account: BankAccount = { ...insertAccount, id };
    this.bankAccounts.set(id, account);
    return account;
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values());
  }

  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    return this.bankAccounts.get(id);
  }

  async updateBankAccountBalance(id: string, newBalance: number): Promise<BankAccount | undefined> {
    const account = this.bankAccounts.get(id);
    if (account) {
      account.balance = newBalance;
      this.bankAccounts.set(id, account);
      return account;
    }
    return undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = `ORD_${randomUUID().slice(0, 8).toUpperCase()}`;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createTransaction(transactionData: Omit<Transaction, "id">): Promise<Transaction> {
    const id = `TXN_${randomUUID().slice(0, 12).toUpperCase()}`;
    const transaction: Transaction = { ...transactionData, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async updateBankAccount(id: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    const account = this.bankAccounts.get(id);
    if (account) {
      const updatedAccount = { ...account, ...data };
      this.bankAccounts.set(id, updatedAccount);
      return updatedAccount;
    }
    return undefined;
  }

  async deleteBankAccount(id: string): Promise<boolean> {
    return this.bankAccounts.delete(id);
  }
}

export const storage = new MemStorage();
