import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AcoesPage from "./pages/Acoes";
import AcaoDetalhePage from "./pages/AcaoDetalhe";
import ONGsPage from "./pages/ONGs";
import ONGDetalhePage from "./pages/ONGDetalhe";
import LoginPage from "./pages/Login";
import CadastroPage from "./pages/Cadastro";
import DashboardPage from "./pages/Dashboard";
import EsqueciSenhaPage from "./pages/EsqueciSenha";
import RedefinirSenhaPage from "./pages/RedefinirSenha";
import NovaAcaoPage from "./pages/NovaAcao";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/acoes" element={<AcoesPage />} />
          <Route path="/acoes/:id" element={<AcaoDetalhePage />} />
          <Route path="/ongs" element={<ONGsPage />} />
          <Route path="/ongs/:id" element={<ONGDetalhePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          <Route path="/dashboard/nova-acao" element={<NovaAcaoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
