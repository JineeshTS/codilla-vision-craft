import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Coins, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "@/components/shared/NotificationCenter";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { User } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTokens(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTokens(session.user.id);
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
            <Link to="/about" onClick={onNavigate}>About</Link>
          </Button>
          <Button variant="ghost" asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to="/code-ide" onClick={onNavigate}>Code IDE</Link>
          </Button>
          <Button variant="outline" asChild className={mobile ? "w-full justify-start gap-2" : "gap-2"} aria-label={`${tokens} tokens available`}>
            <Link to="/tokens" onClick={onNavigate}>
              <Coins className="w-4 h-4" />
              {tokens}
            </Link>
          </Button>
          {!mobile && <NotificationCenter />}
          <ThemeToggle mobile={mobile} />
          <Button 
            variant="ghost" 
            size={mobile ? "default" : "icon"} 
            onClick={() => { handleSignOut(); onNavigate?.(); }} 
            className={mobile ? "w-full justify-start" : ""}
            aria-label="Sign out"
          >
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <span className="text-lg sm:text-xl font-bold gradient-text">Codilla.ai</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-4" aria-label="Main navigation">
          <NavLinks />
        </nav>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-80" aria-label="Mobile navigation">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks mobile onNavigate={() => setMobileMenuOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;