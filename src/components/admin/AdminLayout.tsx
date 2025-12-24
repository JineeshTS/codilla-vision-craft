import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Loader2, Menu, LayoutDashboard, Users, FileText, CreditCard, BarChart3, Settings, ClipboardList, MessageSquare, Bell, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "User Management", icon: Users },
  { path: "/admin/content", label: "Content Moderation", icon: FileText },
  { path: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
  { path: "/admin/payments", label: "Payments & Tokens", icon: CreditCard },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/announcements", label: "Announcements", icon: Bell },
  { path: "/admin/settings", label: "System Config", icon: Settings },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

const Sidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="p-6 border-b">
        <Link to="/admin" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Admin Panel</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
        <Link to="/dashboard">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Back to App
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive" 
          size="sm"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const { isAdmin, loading } = useAdminGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed w-64 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <Link to="/admin" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold">Admin</span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};