import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreditCard, Building2, Home, History, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Checkout from "@/pages/checkout";
import BankAccounts from "@/pages/bank-accounts";
import Transactions from "@/pages/transactions";
import Admin from "@/pages/admin";
import Receipt from "@/pages/receipt";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  const isReceiptPage = location.startsWith("/receipt");
  
  if (isReceiptPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold hidden sm:inline">PayFlow</span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"} 
              size="sm"
              data-testid="nav-checkout"
            >
              <Home className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Checkout</span>
            </Button>
          </Link>
          <Link href="/transactions">
            <Button 
              variant={location === "/transactions" ? "secondary" : "ghost"} 
              size="sm"
              data-testid="nav-transactions"
            >
              <History className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Transactions</span>
            </Button>
          </Link>
          <Link href="/accounts">
            <Button 
              variant={location === "/accounts" ? "secondary" : "ghost"} 
              size="sm"
              data-testid="nav-accounts"
            >
              <Building2 className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Accounts</span>
            </Button>
          </Link>
          <Link href="/admin">
            <Button 
              variant={location === "/admin" ? "secondary" : "ghost"} 
              size="sm"
              data-testid="nav-admin"
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>
          <div className="ml-2 border-l pl-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Checkout} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/accounts" component={BankAccounts} />
      <Route path="/admin" component={Admin} />
      <Route path="/receipt/:id" component={Receipt} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
