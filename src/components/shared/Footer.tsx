import { Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { memo } from "react";

export const Footer = memo(() => {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Codilla</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered platform for building and validating your startup ideas
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/ideas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ideas
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-muted-foreground hover:text-foreground transition-colors">
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@codilla.ai" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@codilla.ai
                </a>
              </li>
              <li>
                <a href="mailto:info@codilla.ai" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@codilla.ai
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:legal@codilla.ai" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:legal@codilla.ai" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-center md:text-left">
                GANAKYS CODILLA APPS (OPC) Private Limited<br />
                TC.6/1608-6, ROSE APTMT, Neerazhi lane,<br />
                Medical College PO, Thiruvananthapuram, Kerala, India - 695011
              </p>
            </div>
            <p className="text-center md:text-right">
              © {new Date().getFullYear()} Codilla. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
