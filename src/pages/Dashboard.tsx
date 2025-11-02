import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, FolderOpen, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const stats = [
    { label: "Active Projects", value: "0", icon: FolderOpen, color: "text-ai-claude" },
    { label: "Token Balance", value: "0", icon: Sparkles, color: "text-primary" },
    { label: "Success Rate", value: "0%", icon: TrendingUp, color: "text-ai-gemini" },
    { label: "Time Saved", value: "0h", icon: Clock, color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Let's build something amazing.</p>
            </div>
            <Link to="/ideas/new">
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Idea
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Projects */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Start your first project by capturing your idea</p>
                <Link to="/ideas/new">
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Idea
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">📝 Capture New Idea</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start with our guided questionnaire
                </p>
                <Badge variant="outline" className="border-primary/30 text-primary">Phase 1</Badge>
              </CardContent>
            </Card>

            <Card className="glass-card hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🔍 Validate Idea</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run AI-powered validation
                </p>
                <Badge variant="outline" className="border-ai-gemini/30 text-ai-gemini">Phase 2</Badge>
              </CardContent>
            </Card>

            <Card className="glass-card hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🚀 Start Building</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Begin AI-assisted development
                </p>
                <Badge variant="outline" className="border-secondary/30 text-secondary">Phase 7</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
