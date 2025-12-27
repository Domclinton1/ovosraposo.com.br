import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import ReactPixel from "react-facebook-pixel";
import Home from "./pages/Home";
import Products from "./pages/Products";
import OurStory from "./pages/OurStory";
import Recipes from "./pages/Recipes";
import Nutrition from "./pages/Nutrition";
import NutritionistTips from "./pages/NutritionistTips";
import Delivery from "./pages/Delivery";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import CompleteProfile from "./pages/CompleteProfile";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import OrdersByPayment from "./pages/OrdersByPayment";
import OrderConfirmation from "./pages/OrderConfirmation";
import SnowEffect from "./components/SnowEffect";
import WhatsButton from "./components/WhatsButton";

const queryClient = new QueryClient();

const PixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    ReactPixel.init("805047972423399", undefined, {
      autoConfig: true,
      debug: false,
    });
  }, []);

  useEffect(() => {
    ReactPixel.pageView();
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />

      <WhatsButton />
      <Sonner />

      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <PixelTracker />
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/nossa-historia" element={<OurStory />} />
          <Route path="/receitas" element={<Recipes />} />
          <Route path="/nutricao" element={<Nutrition />} />
          <Route path="/dicas-nutricionista" element={<NutritionistTips />} />
          <Route path="/entrega" element={<Delivery />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/admin/orders/:paymentMethod"
            element={<OrdersByPayment />}
          />
          <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
