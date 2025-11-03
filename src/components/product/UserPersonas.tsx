import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserPersonasProps {
  personas: any[];
}

const UserPersonas = ({ personas }: UserPersonasProps) => {
  if (!personas || personas.length === 0) {
    return null;
  }

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">User Personas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona: any, index: number) => (
          <Card key={index} className="p-6 bg-background/50">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback>
                  {persona.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{persona.name}</h3>
                <p className="text-sm text-muted-foreground">{persona.role || persona.demographics}</p>
              </div>
            </div>

            {persona.goals && (
              <div className="mb-3">
                <p className="text-sm font-semibold mb-1">Goals</p>
                <p className="text-sm text-muted-foreground">{persona.goals}</p>
              </div>
            )}

            {persona.painPoints && (
              <div className="mb-3">
                <p className="text-sm font-semibold mb-1">Pain Points</p>
                <p className="text-sm text-muted-foreground">{persona.painPoints}</p>
              </div>
            )}

            {persona.motivations && (
              <div>
                <p className="text-sm font-semibold mb-1">Motivations</p>
                <p className="text-sm text-muted-foreground">{persona.motivations}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default UserPersonas;
