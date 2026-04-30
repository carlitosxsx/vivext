// src/pages/AcaoDetalhe.tsx
// ALTERAÇÃO: busca de detalhe da ação e inscrição agora usam o backend.
// A lógica de inscrição foi implementada de verdade (antes era só um mock).

import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Users, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { acaoApi, inscricaoApi, AcaoDetalhe, ApiError } from "@/lib/api";  // ← usa o backend
import { useAuth } from "@/contexts/AuthContext";

const AcaoDetalhePage = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const [acao, setAcao] = useState<AcaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [inscricaoStatus, setInscricaoStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    acaoApi.buscar(id)
      .then(setAcao)
      .catch(() => toast.error("Erro ao carregar ação."))
      .finally(() => setLoading(false));
  }, [id]);

  // Verifica se o voluntário já está inscrito nesta ação
  useEffect(() => {
    if (!user || role !== "voluntario" || !id) return;
    inscricaoApi.minhas().then((minhas) => {
      const encontrada = minhas.find((i) => i.acao_id === id);
      if (encontrada) {
        setInscricaoId(encontrada.id);
        setInscricaoStatus(encontrada.status);
      }
    });
  }, [user, role, id]);

  const handleInscrever = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para se inscrever.");
      return;
    }
    if (role !== "voluntario") {
      toast.error("Apenas voluntários podem se inscrever em ações.");
      return;
    }
    setSubmitting(true);
    try {
      const nova = await inscricaoApi.inscrever(id!);
      setInscricaoId(nova.id);
      setInscricaoStatus("pendente");
      toast.success(`Inscrição realizada! Aguarde a aprovação da ONG.`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao se inscrever.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!inscricaoId) return;
    setSubmitting(true);
    try {
      await inscricaoApi.remover(inscricaoId);
      setInscricaoId(null);
      setInscricaoStatus(null);
      toast.success("Inscrição cancelada.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao cancelar inscrição.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container py-16 text-center text-muted-foreground">Carregando...</div>
        <Footer />
      </div>
    );
  }

  if (!acao) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container py-16 text-center">
          <p className="text-muted-foreground">Ação não encontrada.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/acoes"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const vagasRestantes = acao.vagas_total > 0
    ? acao.vagas_total - acao.inscricoes_stats.aprovados
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/acoes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar às Ações
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{acao.categoria}</Badge>
              <Badge variant={acao.status === "ativa" ? "default" : "secondary"}>
                {acao.status === "ativa" ? "Ativa" : "Concluída"}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">{acao.titulo}</h1>
            <p className="text-muted-foreground mb-6 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <Link to={`/ongs/${acao.ong_id}`} className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                {acao.ongs?.nome ?? "ONG"}
              </Link>
            </p>

            <div className="prose prose-sm max-w-none text-foreground/80 mb-8">
              <p>{acao.descricao || "Sem descrição disponível."}</p>
            </div>
          </div>

          {/* Card lateral */}
          <div className="space-y-4">
            <div className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{new Date(acao.data + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{acao.local}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {vagasRestantes !== null
                    ? `${vagasRestantes} vaga${vagasRestantes !== 1 ? "s" : ""} disponível`
                    : "Vagas ilimitadas"}
                </span>
              </div>

              <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                <p>{acao.inscricoes_stats.aprovados} aprovado(s)</p>
                <p>{acao.inscricoes_stats.pendentes} aguardando aprovação</p>
              </div>

              {/* Botão de inscrição — só para voluntários */}
              {role === "voluntario" && acao.status === "ativa" && (
                <div className="pt-2">
                  {!inscricaoId ? (
                    <Button className="w-full" onClick={handleInscrever} disabled={submitting || vagasRestantes === 0}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {vagasRestantes === 0 ? "Vagas esgotadas" : "Inscrever-se"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Badge variant={inscricaoStatus === "aprovado" ? "default" : inscricaoStatus === "recusado" ? "destructive" : "secondary"} className="w-full justify-center py-1">
                        {inscricaoStatus === "aprovado" && "✓ Inscrição aprovada"}
                        {inscricaoStatus === "pendente" && "⏳ Aguardando aprovação"}
                        {inscricaoStatus === "recusado" && "✗ Inscrição recusada"}
                      </Badge>
                      {inscricaoStatus === "pendente" && (
                        <Button variant="outline" className="w-full" onClick={handleCancelar} disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Cancelar inscrição
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!user && acao.status === "ativa" && (
                <Button className="w-full" asChild>
                  <Link to="/login">Entre para se inscrever</Link>
                </Button>
              )}

              {acao.ongs && (
                <div className="pt-2 border-t border-border/50 space-y-1 text-sm text-muted-foreground">
                  {acao.ongs.email && <p>✉ {acao.ongs.email}</p>}
                  {acao.ongs.telefone && <p>📞 {acao.ongs.telefone}</p>}
                  {acao.ongs.cidade && <p>📍 {acao.ongs.cidade}, {acao.ongs.estado}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AcaoDetalhePage;
