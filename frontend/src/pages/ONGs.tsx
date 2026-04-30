// src/pages/ONGs.tsx
// ALTERAÇÃO: busca de ONGs agora usa GET /ongs do backend.

import { useState, useEffect } from "react";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATEGORIAS } from "@/data/mockData";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ongApi, Ong } from "@/lib/api";  // ← usa o backend
import { toast } from "sonner";

const ONGsPage = () => {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [ongs, setOngs] = useState<Ong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ongApi.listar()
      .then(setOngs)
      .catch(() => toast.error("Erro ao carregar ONGs."))
      .finally(() => setLoading(false));
  }, []);

  const ongsFiltradas = ongs.filter((ong) => {
    const matchBusca =
      ong.nome.toLowerCase().includes(busca.toLowerCase()) ||
      ong.cidade.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !categoriaSelecionada || ong.categoria === categoriaSelecionada;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-6">ONGs Cadastradas</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar ONG ou cidade..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={!categoriaSelecionada ? "default" : "secondary"} className="cursor-pointer" onClick={() => setCategoriaSelecionada(null)}>Todas</Badge>
            {CATEGORIAS.map((cat) => (
              <Badge key={cat} variant={categoriaSelecionada === cat ? "default" : "secondary"} className="cursor-pointer" onClick={() => setCategoriaSelecionada(cat === categoriaSelecionada ? null : cat)}>{cat}</Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {ongsFiltradas.map((ong, i) => (
              <motion.div
                key={ong.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={`/ongs/${ong.id}`}
                  className="block rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-200 ring-1 ring-foreground/5 p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{ong.nome}</h3>
                      <p className="text-sm text-muted-foreground">{ong.cidade}, {ong.estado}</p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ong.descricao}</p>
                      <Badge variant="secondary" className="mt-3 text-xs">{ong.categoria}</Badge>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && ongsFiltradas.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma ONG encontrada.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ONGsPage;
