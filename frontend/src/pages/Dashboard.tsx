// src/pages/Dashboard.tsx
// ALTERAÇÃO: dados do dashboard agora vêm de GET /ongs/me/dashboard do backend.
// Aprovação/recusa de inscrições usa PATCH /inscricoes/:id/status.

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Users, ClipboardList, CheckCircle, XCircle, Plus, Eye, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ongApi, inscricaoApi, OngDashboard, InscricaoComVoluntario, ApiError } from "@/lib/api";  // ← usa o backend

const DashboardPage = () => {
  const { user, role, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<OngDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user && role === "ong") {
      ongApi.dashboard()
        .then(setDashboard)
        .catch(() => toast.error("Erro ao carregar dashboard."))
        .finally(() => setLoading(false));
    } else if (user && role) {
      setLoading(false);
    }
  }, [user, role, authLoading, navigate]);

  const handleUpdateInscricao = async (inscricaoId: string, newStatus: "aprovado" | "recusado") => {
    setUpdatingId(inscricaoId);
    try {
      await inscricaoApi.atualizarStatus(inscricaoId, newStatus);
      toast.success(newStatus === "aprovado" ? "Voluntário aprovado!" : "Voluntário recusado.");
      // Atualiza o estado local sem refetch
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          inscricoes: prev.inscricoes.map((i) =>
            i.id === inscricaoId ? { ...i, status: newStatus } : i
          ),
          stats: {
            ...prev.stats,
            inscricoes_pendentes: prev.stats.inscricoes_pendentes - 1,
            inscricoes_aprovadas:
              newStatus === "aprovado"
                ? prev.stats.inscricoes_aprovadas + 1
                : prev.stats.inscricoes_aprovadas,
          },
        };
      });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao atualizar inscrição.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Voluntário logado — redireciona para histórico
  if (role === "voluntario") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Minha Área</h1>
          <p className="text-sm text-muted-foreground mb-6">{profile?.nome}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/acoes" className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6 hover:shadow-card-hover transition-all block">
              <h3 className="font-semibold mb-1">Explorar Ações</h3>
              <p className="text-sm text-muted-foreground">Encontre ações voluntárias para participar.</p>
            </Link>
            <Link to="/dashboard/historico" className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6 hover:shadow-card-hover transition-all block">
              <h3 className="font-semibold mb-1">Meu Histórico</h3>
              <p className="text-sm text-muted-foreground">Veja suas inscrições e ações participadas.</p>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!dashboard) return null;

  const { acoes, inscricoes, stats } = dashboard;
  const pendentes = inscricoes.filter((i) => i.status === "pendente");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard da ONG</h1>
            <p className="text-sm text-muted-foreground">{dashboard.ong.nome}</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/nova-acao"><Plus className="mr-1 h-4 w-4" /> Publicar Ação</Link>
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Ações Ativas</span>
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">{stats.acoes_ativas}</p>
          </div>
          <div className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Inscrições Pendentes</span>
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">{stats.inscricoes_pendentes}</p>
          </div>
          <div className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Voluntários Aprovados</span>
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">{stats.inscricoes_aprovadas}</p>
          </div>
        </div>

        {/* Inscrições pendentes */}
        {pendentes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Inscrições Pendentes ({pendentes.length})</h2>
            <div className="space-y-3">
              {pendentes.map((insc) => {
                const p = insc.voluntario_profile;
                return (
                  <div key={insc.id} className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p?.nome ?? "Voluntário"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p?.email}</p>
                      {p?.cidade && <p className="text-xs text-muted-foreground">{p.cidade}, {p.estado}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Ação: <span className="text-foreground">{(insc.acoes as any)?.titulo ?? insc.acao_id}</span>
                      </p>
                      {insc.voluntarios?.habilidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {insc.voluntarios.habilidades.slice(0, 3).map((h) => (
                            <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleUpdateInscricao(insc.id, "aprovado")}
                        disabled={updatingId === insc.id}
                      >
                        {updatingId === insc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleUpdateInscricao(insc.id, "recusado")}
                        disabled={updatingId === insc.id}
                      >
                        {updatingId === insc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de ações */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Suas Ações ({acoes.length})</h2>
          {acoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground rounded-xl bg-card ring-1 ring-foreground/5">
              <p>Nenhuma ação cadastrada ainda.</p>
              <Button asChild className="mt-4">
                <Link to="/dashboard/nova-acao">Publicar primeira ação</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {acoes.map((acao) => (
                <div key={acao.id} className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{acao.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(acao.data + "T00:00:00").toLocaleDateString("pt-BR")} · {acao.local}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={acao.status === "ativa" ? "default" : "secondary"} className="text-xs">
                        {acao.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {inscricoes.filter((i) => i.acao_id === acao.id).length} inscrições
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/acoes/${acao.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
