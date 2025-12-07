import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Plus, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";

const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2, "Name must be at least 2 characters"),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  bankName: z.string().min(1, "Please select a bank"),
  balance: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Balance must be a positive number"),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

const bankOptions = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IndusInd Bank",
];

function generateAccountNumber(): string {
  const prefix = Math.floor(Math.random() * 9000) + 1000;
  const suffix = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${suffix}`;
}

export default function BankAccounts() {
  const { toast } = useToast();

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      balance: "",
    },
  });

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      const response = await apiRequest("POST", "/api/create-account", {
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        balance: parseFloat(data.balance),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      form.reset();
      toast({
        title: "Account Created",
        description: "Your test bank account has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bank account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BankAccountFormData) => {
    createAccountMutation.mutate(data);
  };

  const autoGenerateAccountNumber = () => {
    form.setValue("accountNumber", generateAccountNumber());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Create Test Bank Account</h1>
          <p className="text-muted-foreground mt-1">
            Add fake bank accounts to test netbanking payments
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">New Bank Account</CardTitle>
            <CardDescription>
              Enter the details for your test bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wide">Account Holder Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field}
                          data-testid="input-account-holder-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wide">Account Number</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="1234567890123" 
                            className="font-mono flex-1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                            data-testid="input-account-number"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={autoGenerateAccountNumber}
                            data-testid="button-generate-account-number"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wide">Bank Name</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bank-name">
                            <SelectValue placeholder="Select a bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankOptions.map((bank) => (
                            <SelectItem key={bank} value={bank} data-testid={`option-bank-${bank.replace(/\s+/g, "-").toLowerCase()}`}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wide">Initial Balance (₹)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input 
                            type="number"
                            min="0"
                            step="100"
                            placeholder="50000" 
                            className="pl-8 font-mono"
                            {...field}
                            data-testid="input-initial-balance"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={createAccountMutation.isPending}
                  data-testid="button-create-account"
                >
                  {createAccountMutation.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            Existing Accounts
            {accounts.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                ({accounts.length})
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No bank accounts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first test bank account above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((account) => (
                <Card key={account.id} data-testid={`card-account-${account.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{account.bankName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {account.accountHolderName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {account.accountNumber}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-mono font-semibold">
                          ₹{account.balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
