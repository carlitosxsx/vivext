import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Ações", href: "/acoes" },
  { label: "ONGs", href: "/ongs" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Heart className="h-5 w-5 text-primary" />
          <span>Voluntár.io</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!loading && user ? (
            <>
              <span className="text-sm text-muted-foreground mr-1">
                {profile?.nome || user.email}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Painel</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />Sair
              </Button>
            </>
          ) : !loading ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 mt-3">
            {!loading && user ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Painel</Link>
                </Button>
                <Button size="sm" className="flex-1" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  Sair
                </Button>
              </>
            ) : !loading ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/cadastro" onClick={() => setMobileOpen(false)}>Cadastrar</Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
