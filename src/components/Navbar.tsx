import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Coins, Menu, X, Shield, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [tokens, setTokens] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTokens(session.user.id);
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTokens(session.user.id);
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTokens = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("total_tokens, tokens_used")
      .eq("id", userId)
      .single();

    if (data) {
      setTokens(data.total_tokens - data.tokens_used);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    setIsAdmin(data?.role === "admin");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const NavLinks = ({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) => (
    <>
      {user ? (
        <>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/dashboard" onClick={onNavigate}>Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/ideas" onClick={onNavigate}>Ideas</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/projects" onClick={onNavigate}>Projects</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/templates" onClick={onNavigate}>Templates</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/analytics" onClick={onNavigate}>Analytics</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/code-ide" onClick={onNavigate}>Code IDE</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" asChild className={mobile ? "w-full justify-start gap-2" : "gap-2"}>
              <Link to="/admin/dashboard" onClick={onNavigate}>
                <Shield className="w-4 h-4" />
                {mobile && <span>Admin</span>}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className={mobile ? "w-full justify-start gap-2" : "gap-2"}>
            <Link to="/tokens" onClick={onNavigate}>
              <Coins className="w-4 h-4" />
              {tokens}
            </Link>
          </Button>
          <Button variant="ghost" size={mobile ? "default" : "icon"} asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/profile" onClick={onNavigate}>
              <User className="w-4 h-4" />
              {mobile && <span className="ml-2">Profile</span>}
            </Link>
          </Button>
          <Button variant="ghost" size={mobile ? "default" : "icon"} onClick={() => { handleSignOut(); onNavigate?.(); }} className={mobile ? "w-full justify-start" : ""}>
            <LogOut className="w-4 h-4" />
            {mobile && <span className="ml-2">Sign Out</span>}
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/auth" onClick={onNavigate}>Sign In</Link>
          </Button>
          <Button asChild className={mobile ? "w-full" : ""}>
            <Link to="/auth" onClick={onNavigate}>Get Started</Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold gradient-text">Codilla.ai</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <NavLinks />
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks mobile onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;