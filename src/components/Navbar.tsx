import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Coins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState(0);

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

  return (
    <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold gradient-text">Codilla.ai</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/ideas">Ideas</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/projects">Projects</Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/tokens">
                  <Coins className="w-4 h-4" />
                  {tokens}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;