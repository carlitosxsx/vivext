// src/pages/Index.tsx
// ALTERAÇÃO: ações em destaque e stats agora vêm do backend (GET /acoes).
// Stats de ONGs e voluntários continuam via Supabase (contagens simples sem risco de segurança).

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Heart, Users, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AcaoCard } from "@/components/AcaoCard";
import { CATEGORIAS } from "@/data/mockData";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import { acaoApi, AcaoComOng } from "@/lib/api"; // ← usa o backend para ações

const Index = () => {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [acoes, setAcoes] = useState<AcaoComOng[]>([]);
  const [stats, setStats] = useState({ ongs: 0, acoes: 0, voluntarios: 0 });

  useEffect(() => {
    // Ações em destaque — via backend (traz vagas_preenchidas real)
    acaoApi.listar({ status: "ativa" }).then((data) => {
      setAcoes(data.slice(0, 6));
    });

    // Contagens públicas — via Supabase direto (dados não sensíveis)
    Promise.all([
      supabase.from("ongs").select("id", { count: "exact", head: true }),
      supabase.from("acoes").select("id", { count: "exact", head: true }).eq("status", "ativa"),
      supabase.from("voluntarios").select("id", { count: "exact", head: true }),
    ]).then(([ongsRes, acoesRes, volRes]) => {
      setStats({
        ongs: ongsRes.count ?? 0,
        acoes: acoesRes.count ?? 0,
        voluntarios: volRes.count ?? 0,
      });
    });
  }, []);

  const acoesFiltradas = acoes
    .filter((a) => {
      const matchBusca =
        a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        a.local.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = !categoriaSelecionada || a.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    })
    .slice(0, 3);

  const statsData = [
    { icon: Building2, label: "ONGs Cadastradas", value: String(stats.ongs) },
    { icon: Heart, label: "Ações Disponíveis", value: String(stats.acoes) },
    { icon: Users, label: "Voluntários Ativos", value: String(stats.voluntarios) },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.3) 100%), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4 text-white">
              Conectando mãos que querem ajudar a causas que precisam de{" "}
              <span className="text-primary">você</span>.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              Encontre oportunidades de voluntariado na sua região e faça a diferença na sua comunidade.
            </p>

            <div className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação ou cidade..."
                  className="pl-9 h-11 bg-white/90 border-white/20"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <Button size="lg" asChild>
                <Link to="/acoes">
                  Encontrar Oportunidades
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="container py-8">
          <div className="grid grid-cols-3 gap-8">
            {statsData.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ações em destaque */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Ações em Destaque</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/acoes">
              Ver Todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
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
                vagasPreenchidas: acao.vagas_preenchidas, // ← real, vindo do backend
                status: acao.status,
              }}
              index={i}
            />
          ))}
        </div>

        {acoesFiltradas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma ação encontrada para essa busca.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Sua ONG precisa de voluntários?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            Cadastre sua organização e publique ações voluntárias para encontrar pessoas engajadas.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/cadastro">Cadastrar ONG</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
