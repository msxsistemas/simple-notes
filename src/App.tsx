import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import ReportsWithdrawals from "./pages/ReportsWithdrawals";
import Financial from "./pages/Financial";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import CheckoutPublic from "./pages/CheckoutPublic";
import Integrations from "./pages/Integrations";
import Fees from "./pages/Fees";
import Docs from "./pages/Docs";
import Settings from "./pages/Settings";
import SplitConfig from "./pages/SplitConfig";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/entries" element={<Reports />} />
            <Route path="/reports/withdrawals" element={<ReportsWithdrawals />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/products" element={<Products />} />
            <Route path="/checkout/demo" element={<Checkout />} />
            <Route path="/checkout" element={<CheckoutPublic />} />
            <Route path="/pay" element={<CheckoutPublic />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/split" element={<SplitConfig />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
