import { Link } from "react-router-dom";
import { MapPin, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { Acao } from "@/data/mockData";

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

interface AcaoCardProps {
  acao: Acao;
  index?: number;
}

export function AcaoCard({ acao, index = 0 }: AcaoCardProps) {
  const vagasRestantes = acao.vagasTotal - acao.vagasPreenchidas;
  const esgotado = vagasRestantes <= 0;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-200 ring-1 ring-foreground/5 overflow-hidden flex flex-col"
    >
      {/* Color bar */}
      <div className="h-1.5 bg-primary" />

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {acao.categoria}
          </Badge>
          {esgotado ? (
            <span className="text-xs text-muted-foreground font-medium tabular-nums">Esgotado</span>
          ) : (
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {vagasRestantes} vaga{vagasRestantes !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-tight mb-1 group-hover:text-primary transition-colors">
          {acao.titulo}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{acao.ongNome}</p>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">
          {acao.descricao}
        </p>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{acao.local}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">
              {new Date(acao.data).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">
              {acao.vagasPreenchidas}/{acao.vagasTotal} inscritos
            </span>
          </div>
        </div>

        <Button asChild className="w-full" size="sm" disabled={esgotado}>
          <Link to={`/acoes/${acao.id}`}>Ver Detalhes</Link>
        </Button>
      </div>
    </motion.div>
  );
}
