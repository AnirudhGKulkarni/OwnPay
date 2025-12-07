import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { History, CreditCard, Smartphone, Building2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const paymentMethodIcons = {
    card: CreditCard,
    upi: Smartphone,
    netbanking: Building2,
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <History className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View all completed payment transactions
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-24" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete a payment to see it appear here
              </p>
              <Link href="/">
                <Button className="mt-4" data-testid="button-create-payment">
                  Create Payment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">All Transactions</CardTitle>
                <CardDescription>
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {transactions.map((transaction) => {
                    const PaymentIcon = paymentMethodIcons[transaction.paymentMethod];
                    const isSuccess = transaction.status === "success";

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-4 p-4"
                        data-testid={`row-transaction-${transaction.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            isSuccess ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                          }`}>
                            {isSuccess ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm truncate" data-testid={`text-txn-id-${transaction.id}`}>
                                {transaction.id}
                              </span>
                              <Badge variant="outline" className="shrink-0">
                                <PaymentIcon className="h-3 w-3 mr-1" />
                                <span className="capitalize">{transaction.paymentMethod}</span>
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              <span>{formatDate(transaction.timestamp)}</span>
                              {transaction.bankName && (
                                <>
                                  <span className="mx-1.5">·</span>
                                  <span>{transaction.bankName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-mono font-semibold" data-testid={`text-amount-${transaction.id}`}>
                              ₹{transaction.amount.toLocaleString()}
                            </p>
                            <Badge
                              variant={isSuccess ? "default" : "destructive"}
                              className="text-xs"
                              data-testid={`badge-status-${transaction.id}`}
                            >
                              {isSuccess ? "SUCCESS" : "FAILED"}
                            </Badge>
                          </div>
                          <Link href={`/receipt/${transaction.id}`}>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              data-testid={`button-view-receipt-${transaction.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Link href="/">
                <Button variant="outline" data-testid="button-new-payment">
                  Create New Payment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
