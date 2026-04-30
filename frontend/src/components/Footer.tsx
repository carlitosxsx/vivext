import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container py-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 text-primary" />
          <span>Voluntár.io — Conectando pessoas a causas que importam.</span>
        </div>
      </div>
    </footer>
  );
}
