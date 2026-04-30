// src/pages/Acoes.tsx
// ALTERAÇÃO: busca de ações agora usa GET /acoes do backend.
// A filtragem de busca e categoria continua no front (como antes).

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AcaoCard } from "@/components/AcaoCard";
import { CATEGORIAS } from "@/data/mockData";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { acaoApi, AcaoComOng } from "@/lib/api";  // ← usa o backend
import { toast } from "sonner";

const AcoesPage = () => {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [acoes, setAcoes] = useState<AcaoComOng[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    acaoApi.listar({ status: "ativa" })
      .then(setAcoes)
      .catch(() => toast.error("Erro ao carregar ações."))
      .finally(() => setLoading(false));
  }, []);

  const acoesFiltradas = acoes.filter((a) => {
    const matchBusca =
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.local.toLowerCase().includes(busca.toLowerCase()) ||
      (a.ongs?.nome ?? "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !categoriaSelecionada || a.categoria === categoriaSelecionada;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Ações Voluntárias</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ação, ONG ou cidade..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={categoriaSelecionada === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setCategoriaSelecionada(null)}
            >
              Todas
            </Badge>
            {CATEGORIAS.map((cat) => (
              <Badge
                key={cat}
                variant={categoriaSelecionada === cat ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setCategoriaSelecionada(cat === categoriaSelecionada ? null : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acoesFiltradas.map((acao, i) => (
              <AcaoCard
                key={acao.id}
                acao={{
                  id: acao.id,
                  titulo: acao.titulo,
                  descricao: acao.descricao,
                  ongNome: acao.ongs?.nome ?? "ONG",
                  ongId: acao.ong_id,
                  data: acao.data,
                  local: acao.local,
                  categoria: acao.categoria,
                  vagasTotal: acao.vagas_total,
                  vagasPreenchidas: acao.vagas_preenchidas,  // ← agora vem do backend
                  status: acao.status,
                }}
                index={i}
              />
            ))}
          </div>
        )}

        {!loading && acoesFiltradas.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Nenhuma ação encontrada.</p>
            <p className="text-sm mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AcoesPage;
