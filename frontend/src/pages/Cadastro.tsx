// src/pages/Cadastro.tsx
// ALTERAÇÃO: cadastro agora passa pelo backend (POST /auth/cadastro/*)
// em vez de chamar supabase diretamente.
// O login após cadastro continua usando o supabase SDK normalmente.

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authApi, ApiError } from "@/lib/api";  // ← usa o backend

const CadastroPage = () => {
  const navigate = useNavigate();
  const [tipoUsuario, setTipoUsuario] = useState("voluntario");
  const [loading, setLoading] = useState(false);

  // Voluntário fields
  const [vNome, setVNome] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vCidade, setVCidade] = useState("");
  const [vEstado, setVEstado] = useState("");
  const [vSenha, setVSenha] = useState("");

  // ONG fields
  const [ongNome, setOngNome] = useState("");
  const [ongEmail, setOngEmail] = useState("");
  const [ongTel, setOngTel] = useState("");
  const [ongCidade, setOngCidade] = useState("");
  const [ongEstado, setOngEstado] = useState("");
  const [ongDesc, setOngDesc] = useState("");
  const [ongCategoria, setOngCategoria] = useState("");
  const [ongSenha, setOngSenha] = useState("");

  const handleVoluntarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNome || !vEmail || !vSenha) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await authApi.cadastroVoluntario({
        nome: vNome,
        email: vEmail,
        senha: vSenha,
        cidade: vCidade || undefined,
        estado: vEstado || undefined,
      });
      toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
      navigate("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOngSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ongNome || !ongEmail || !ongSenha) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await authApi.cadastroOng({
        nome: ongNome,
        email: ongEmail,
        senha: ongSenha,
        telefone: ongTel || undefined,
        cidade: ongCidade || undefined,
        estado: ongEstado || undefined,
        descricao: ongDesc || undefined,
        categoria: ongCategoria || undefined,
      });
      toast.success("ONG cadastrada com sucesso! Verifique seu email para confirmar.");
      navigate("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao cadastrar ONG.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">Criar Conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Junte-se à comunidade Voluntár.io</p>
          </div>

          <Tabs value={tipoUsuario} onValueChange={setTipoUsuario}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="voluntario">Voluntário</TabsTrigger>
              <TabsTrigger value="ong">ONG</TabsTrigger>
            </TabsList>

            <TabsContent value="voluntario">
              <form onSubmit={handleVoluntarioSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input id="nome" placeholder="Seu nome completo" value={vNome} onChange={(e) => setVNome(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="v-email">Email *</Label>
                  <Input id="v-email" type="email" placeholder="seu@email.com" value={vEmail} onChange={(e) => setVEmail(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" placeholder="Sua cidade" value={vCidade} onChange={(e) => setVCidade(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" placeholder="UF" maxLength={2} value={vEstado} onChange={(e) => setVEstado(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="v-senha">Senha *</Label>
                  <Input id="v-senha" type="password" placeholder="••••••••" value={vSenha} onChange={(e) => setVSenha(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="ong">
              <form onSubmit={handleOngSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="ong-nome">Nome da ONG *</Label>
                  <Input id="ong-nome" placeholder="Nome da organização" value={ongNome} onChange={(e) => setOngNome(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ong-email">Email *</Label>
                  <Input id="ong-email" type="email" placeholder="contato@ong.org" value={ongEmail} onChange={(e) => setOngEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ong-tel">Telefone</Label>
                  <Input id="ong-tel" placeholder="(00) 00000-0000" value={ongTel} onChange={(e) => setOngTel(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ong-cidade">Cidade</Label>
                    <Input id="ong-cidade" placeholder="Cidade" value={ongCidade} onChange={(e) => setOngCidade(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ong-estado">Estado</Label>
                    <Input id="ong-estado" placeholder="UF" maxLength={2} value={ongEstado} onChange={(e) => setOngEstado(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ong-categoria">Categoria</Label>
                  <Input id="ong-categoria" placeholder="Ex: Educação, Saúde..." value={ongCategoria} onChange={(e) => setOngCategoria(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ong-desc">Descrição</Label>
                  <Textarea id="ong-desc" placeholder="Descreva a missão da sua ONG..." rows={3} value={ongDesc} onChange={(e) => setOngDesc(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ong-senha">Senha *</Label>
                  <Input id="ong-senha" type="password" placeholder="••••••••" value={ongSenha} onChange={(e) => setOngSenha(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cadastrar ONG
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline underline-offset-4 font-medium">Entrar</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CadastroPage;
