import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, DollarSign, TrendingUp, TrendingDown, Users, Building2, CreditCard, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction, BankAccount } from "@shared/schema";

export default function Admin() {
  const { data: transactions = [], isLoading: loadingTxns } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<BankAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const isLoading = loadingTxns || loadingAccounts;

  const successfulTxns = transactions.filter((t) => t.status === "success");
  const failedTxns = transactions.filter((t) => t.status === "failed");
  const totalAmount = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const paymentMethodStats = {
    card: transactions.filter((t) => t.paymentMethod === "card").length,
    upi: transactions.filter((t) => t.paymentMethod === "upi").length,
    netbanking: transactions.filter((t) => t.paymentMethod === "netbanking").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all accounts and transaction statistics
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                  <div className="h-8 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card data-testid="card-total-revenue">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold font-mono" data-testid="text-total-revenue">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {successfulTxns.length} successful transactions
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-success-rate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-success-rate">
                    {transactions.length > 0 
                      ? Math.round((successfulTxns.length / transactions.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {successfulTxns.length} passed, {failedTxns.length} failed
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-accounts">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Accounts</span>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-total-accounts">
                    {accounts.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Test bank accounts
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-balance">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">Total Balance</span>
                  </div>
                  <p className="text-2xl font-bold font-mono" data-testid="text-total-balance">
                    ₹{totalBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all accounts
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Transaction distribution by method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>Card Payments</span>
                      </div>
                      <Badge variant="outline" data-testid="badge-card-count">
                        {paymentMethodStats.card}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span>UPI Payments</span>
                      </div>
                      <Badge variant="outline" data-testid="badge-upi-count">
                        {paymentMethodStats.upi}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>Netbanking</span>
                      </div>
                      <Badge variant="outline" data-testid="badge-netbanking-count">
                        {paymentMethodStats.netbanking}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Bank Accounts</CardTitle>
                  <CardDescription>Current balances for all accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No bank accounts available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div 
                          key={account.id} 
                          className="flex items-center justify-between"
                          data-testid={`row-account-${account.id}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{account.accountHolderName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {account.bankName}
                            </p>
                          </div>
                          <div className="font-mono font-semibold shrink-0" data-testid={`text-balance-${account.id}`}>
                            ₹{account.balance.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <CardDescription>Last 5 transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No transactions yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction) => {
                        const isSuccess = transaction.status === "success";
                        const formattedDate = new Date(transaction.timestamp).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        });

                        return (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between gap-4"
                            data-testid={`row-recent-txn-${transaction.id}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isSuccess ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                              }`}>
                                {isSuccess ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-mono text-sm truncate">{transaction.id}</p>
                                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono font-semibold">₹{transaction.amount.toLocaleString()}</p>
                              <Badge
                                variant={isSuccess ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {transaction.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
