import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Copy, Check, CreditCard, Smartphone, Building2, ArrowLeft, Plus, Download } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

export default function Receipt() {
  const [, params] = useRoute("/receipt/:id");
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: transaction, isLoading, error } = useQuery<Transaction>({
    queryKey: ["/api/transactions", params?.id],
    enabled: !!params?.id,
  });

  const copyOrderId = () => {
    if (transaction) {
      navigator.clipboard.writeText(transaction.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReceipt = () => {
    if (!transaction) return;
    
    const receiptContent = `
PAYFLOW - PAYMENT RECEIPT
========================

Transaction ID: ${transaction.id}
Order ID: ${transaction.orderId}
Date: ${new Date(transaction.timestamp).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}

PAYMENT DETAILS
---------------
Amount: Rs. ${transaction.amount.toLocaleString()}
Payment Method: ${transaction.paymentMethod.toUpperCase()}
${transaction.bankName ? `Bank: ${transaction.bankName}` : ""}
Status: ${transaction.status.toUpperCase()}
${transaction.failureReason ? `Reason: ${transaction.failureReason}` : ""}

========================
This is a test transaction.
No real money was transferred.
    `.trim();

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${transaction.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-muted" />
              </div>
              <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The transaction you're looking for doesn't exist or has expired.
              </p>
              <Link href="/">
                <Button data-testid="button-go-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Checkout
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isSuccess = transaction.status === "success";
  const formattedDate = new Date(transaction.timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const paymentMethodIcons = {
    card: CreditCard,
    upi: Smartphone,
    netbanking: Building2,
  };

  const PaymentIcon = paymentMethodIcons[transaction.paymentMethod];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                isSuccess ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
              }`}>
                {isSuccess ? (
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h1 className="text-2xl font-semibold" data-testid="text-payment-status">
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </h1>
              {!isSuccess && transaction.failureReason && (
                <p className="text-muted-foreground mt-2" data-testid="text-failure-reason">
                  {transaction.failureReason}
                </p>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
                <p className="text-4xl font-bold font-mono" data-testid="text-amount">
                  ₹{transaction.amount.toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm" data-testid="text-order-id">{transaction.orderId}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={copyOrderId}
                      data-testid="button-copy-order-id"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm" data-testid="text-transaction-id">{transaction.id}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Payment Method</span>
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize" data-testid="text-payment-method">{transaction.paymentMethod}</span>
                  </div>
                </div>

                {transaction.bankName && (
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <span className="text-muted-foreground">Bank</span>
                    <span data-testid="text-bank-name">{transaction.bankName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={isSuccess ? "default" : "destructive"}
                    data-testid="badge-status"
                  >
                    {isSuccess ? "SUCCESS" : "FAILED"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="text-sm" data-testid="text-timestamp">{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={downloadReceipt}
                data-testid="button-download-receipt"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              <Link href="/">
                <Button className="w-full" size="lg" data-testid="button-new-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Another Payment
                </Button>
              </Link>
              <Link href="/accounts">
                <Button variant="outline" className="w-full" data-testid="button-view-accounts">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Bank Accounts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a test transaction. No real money was transferred.
        </p>
      </div>
    </div>
  );
}
