// src/pages/ONGDetalhe.tsx
// ALTERAÇÃO: dados da ONG e suas ações agora vêm do backend (GET /ongs/:id),
// que retorna tudo numa única chamada já com as ações ativas incluídas.

import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AcaoCard } from "@/components/AcaoCard";
import { ArrowLeft, Building2, Mail, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ongApi, OngComAcoes } from "@/lib/api"; // ← usa o backend
import { toast } from "sonner";

const ONGDetalhePage = () => {
  const { id } = useParams();
  const [ong, setOng] = useState<OngComAcoes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ongApi
      .buscar(id)
      .then(setOng)
      .catch(() => toast.error("Erro ao carregar ONG."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container py-16 text-center text-muted-foreground">Carregando...</div>
        <Footer />
      </div>
    );
  }

  if (!ong) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container py-16 text-center">
          <p className="text-muted-foreground">ONG não encontrada.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/ongs">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/ongs">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar às ONGs
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{ong.nome}</h1>
                <Badge variant="secondary">{ong.categoria}</Badge>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">{ong.descricao}</p>

            <h2 className="text-xl font-semibold mb-4">Ações desta ONG</h2>
            {ong.acoes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {ong.acoes.map((acao, i) => (
                  <AcaoCard
                    key={acao.id}
                    acao={{
                      id: acao.id,
                      titulo: acao.titulo,
                      descricao: acao.descricao,
                      ongNome: ong.nome,
                      ongId: ong.id,
                      data: acao.data,
                      local: acao.local,
                      categoria: acao.categoria,
                      vagasTotal: acao.vagas_total,
                      vagasPreenchidas: 0,
                      status: acao.status,
                    }}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma ação ativa no momento.</p>
            )}
          </div>

          <aside>
            <div className="rounded-xl bg-card shadow-card ring-1 ring-foreground/5 p-6 space-y-4">
              <h3 className="font-semibold">Contato</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{ong.cidade}, {ong.estado}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{ong.email}</span>
                </div>
                {ong.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{ong.telefone}</span>
                  </div>
                )}
                {ong.site && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">🌐</span>
                    <a
                      href={ong.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline underline-offset-4 truncate"
                    >
                      {ong.site.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ONGDetalhePage;
