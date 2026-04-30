// src/pages/NovaAcao.tsx
// ALTERAÇÃO: criação de ação agora usa POST /acoes do backend.
// Não precisamos mais buscar o ong_id — o backend resolve pelo token.

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { acaoApi, ApiError } from "@/lib/api";  // ← usa o backend
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const CATEGORIAS = [
  "Educação", "Saúde", "Meio Ambiente", "Assistência Social",
  "Cultura", "Animais", "Esporte", "Tecnologia",
];

const NovaAcaoPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [categoria, setCategoria] = useState("");
  const [vagasTotal, setVagasTotal] = useState("");
  const [status, setStatus] = useState<"ativa" | "rascunho">("ativa");

  useEffect(() => {
    if (!authLoading && (!user || role !== "ong")) {
      navigate("/login");
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !data || !local || !categoria) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await acaoApi.criar({
        titulo,
        descricao,
        data,
        local,
        categoria,
        vagas_total: parseInt(vagasTotal) || 0,
        status,
      });
      toast.success("Ação publicada com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao publicar ação.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao Painel</Link>
        </Button>

        <h1 className="text-2xl font-bold tracking-tight mb-6">Publicar Nova Ação</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Aula de Reforço Escolar" required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a ação voluntária..." rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vagas">Vagas</Label>
              <Input id="vagas" type="number" min="0" value={vagasTotal} onChange={(e) => setVagasTotal(e.target.value)} placeholder="0 = ilimitado" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="local">Local *</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: São Paulo, SP" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "ativa" | "rascunho")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publicar Ação
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default NovaAcaoPage;
