import { useState } from "react";
import { X, CreditCard, Smartphone, Building2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order, BankAccount, PaymentMethod, ProcessPaymentInput } from "@shared/schema";

interface PaymentModalProps {
  order: Order;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onPayment: (input: ProcessPaymentInput) => Promise<void>;
  isProcessing: boolean;
}

export function PaymentModal({
  order,
  bankAccounts,
  onClose,
  onPayment,
  isProcessing,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentMethod>("card");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardHolderName: "",
  });
  const [upiId, setUpiId] = useState("");

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    const input: ProcessPaymentInput = {
      orderId: order.id,
      amount: order.amount,
      paymentMethod: activeTab,
    };

    if (activeTab === "card") {
      input.cardDetails = cardDetails;
    } else if (activeTab === "upi") {
      input.upiId = upiId;
    } else if (activeTab === "netbanking") {
      input.bankAccountId = selectedBank || undefined;
    }

    await onPayment(input);
  };

  const isCardValid = 
    cardDetails.cardNumber.length === 16 && 
    /^\d{16}$/.test(cardDetails.cardNumber) &&
    /^\d{2}\/\d{2}$/.test(cardDetails.expiry) && 
    cardDetails.cvv.length >= 3 && 
    /^\d{3,4}$/.test(cardDetails.cvv) &&
    cardDetails.cardHolderName.trim().length >= 2;

  const isUpiValid = /^[\w.-]+@[\w]+$/.test(upiId);
  
  const canPay = 
    (activeTab === "card" && isCardValid) ||
    (activeTab === "upi" && isUpiValid) ||
    (activeTab === "netbanking" && selectedBank);

  const tabs: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { id: "card", label: "Card", icon: CreditCard },
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "netbanking", label: "Netbanking", icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        data-testid="modal-backdrop"
      />
      
      <div className="relative w-full max-w-lg bg-background rounded-lg border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-4 p-6 border-b">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Order ID</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm" data-testid="text-order-id">{order.id}</span>
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
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 border-b bg-muted/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium" data-testid="text-customer-name">{order.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium truncate" data-testid="text-customer-email">{order.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium" data-testid="text-customer-phone">{order.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold font-mono" data-testid="text-order-amount">
                ₹{order.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === "card" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber" className="text-xs uppercase tracking-wide">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                    className="mt-1.5 font-mono"
                    data-testid="input-card-number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry" className="text-xs uppercase tracking-wide">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2);
                        setCardDetails({ ...cardDetails, expiry: val });
                      }}
                      className="mt-1.5 font-mono"
                      data-testid="input-card-expiry"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-xs uppercase tracking-wide">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="mt-1.5 font-mono"
                      data-testid="input-card-cvv"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardHolderName" className="text-xs uppercase tracking-wide">Cardholder Name</Label>
                  <Input
                    id="cardHolderName"
                    placeholder="John Doe"
                    value={cardDetails.cardHolderName}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })}
                    className="mt-1.5"
                    data-testid="input-card-holder-name"
                  />
                </div>
              </div>
            )}

            {activeTab === "upi" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upiId" className="text-xs uppercase tracking-wide">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1.5"
                    data-testid="input-upi-id"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter your UPI ID to simulate a UPI payment
                  </p>
                </div>
              </div>
            )}

            {activeTab === "netbanking" && (
              <div className="space-y-4">
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No bank accounts available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a test bank account to use netbanking
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {bankAccounts.map((account) => {
                      const insufficientBalance = account.balance < order.amount;
                      return (
                        <Card
                          key={account.id}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedBank === account.id
                              ? "ring-2 ring-primary bg-primary/5"
                              : insufficientBalance
                              ? "opacity-60"
                              : "hover-elevate"
                          }`}
                          onClick={() => !insufficientBalance && setSelectedBank(account.id)}
                          data-testid={`card-bank-${account.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedBank === account.id ? "border-primary" : "border-muted-foreground/30"
                              }`}>
                                {selectedBank === account.id && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{account.bankName}</p>
                                <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                  ****{account.accountNumber.slice(-4)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-semibold">
                                ₹{account.balance.toLocaleString()}
                              </p>
                              {insufficientBalance && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Low Balance
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30">
          <Button
            className="w-full"
            size="lg"
            disabled={!canPay || isProcessing}
            onClick={handlePayment}
            data-testid="button-pay-now"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay ₹{order.amount.toLocaleString()}</>
            )}
          </Button>
          <button
            onClick={onClose}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-cancel-payment"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
