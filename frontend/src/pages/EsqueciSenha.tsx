import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EsqueciSenhaPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu email.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email de recuperação enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-sm px-4">
          <div className="text-center mb-8">
            <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sent ? "Verifique sua caixa de entrada" : "Informe seu email para redefinir a senha"}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique também a pasta de spam.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar Link de Recuperação
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login</Link>
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EsqueciSenhaPage;
