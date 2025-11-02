import Navbar from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <ErrorBoundary name="Hero"><Hero /></ErrorBoundary>
        <ErrorBoundary name="Features"><Features /></ErrorBoundary>
        <ErrorBoundary name="PhaseTimeline"><PhaseTimeline /></ErrorBoundary>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold gradient-text">Codilla.ai</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform ideas into reality with AI-powered consensus validation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary transition-colors">Get Started</Link></li>
                <li><Link to="/templates" className="hover:text-primary transition-colors">Templates</Link></li>
                <li><Link to="/analytics" className="hover:text-primary transition-colors">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Codilla.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
