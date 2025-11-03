import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface Persona {
  name: string;
  role: string;
  demographics: string;
  goals: string;
  painPoints: string;
  motivations: string;
  behaviors: string;
}

interface UserPersonasTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const UserPersonasTask = ({ projectId, phaseNumber, taskId }: UserPersonasTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([
    { name: "", role: "", demographics: "", goals: "", painPoints: "", motivations: "", behaviors: "" }
  ]);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact && artifact.artifact_data.personas) {
        setPersonas(artifact.artifact_data.personas);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTaskArtifact(
        projectId,
        phaseNumber,
        taskId,
        "user_personas",
        { personas }
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "User personas saved successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addPersona = () => {
    setPersonas([...personas, { 
      name: "", role: "", demographics: "", goals: "", painPoints: "", motivations: "", behaviors: "" 
    }]);
  };

  const removePersona = (index: number) => {
    setPersonas(personas.filter((_, i) => i !== index));
  };

  const updatePersona = (index: number, field: keyof Persona, value: string) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    setPersonas(updated);
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">User Personas</h3>
        <div className="flex gap-2">
          <Button onClick={addPersona} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Persona
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona, index) => (
          <Card key={index} className="p-6 bg-background/50 border-muted">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>
                    {persona.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">Persona {index + 1}</div>
              </div>
              {personas.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePersona(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Sarah Marketing Manager"
                  value={persona.name}
                  onChange={(e) => updatePersona(index, "name", e.target.value)}
                />
              </div>

              <div>
                <Label>Role/Title</Label>
                <Input
                  placeholder="e.g., Marketing Director"
                  value={persona.role}
                  onChange={(e) => updatePersona(index, "role", e.target.value)}
                />
              </div>

              <div>
                <Label>Demographics</Label>
                <Textarea
                  placeholder="Age, location, education, tech-savviness..."
                  value={persona.demographics}
                  onChange={(e) => updatePersona(index, "demographics", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Goals</Label>
                <Textarea
                  placeholder="What are they trying to achieve?"
                  value={persona.goals}
                  onChange={(e) => updatePersona(index, "goals", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Pain Points</Label>
                <Textarea
                  placeholder="What frustrates them?"
                  value={persona.painPoints}
                  onChange={(e) => updatePersona(index, "painPoints", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Motivations</Label>
                <Textarea
                  placeholder="What drives their decisions?"
                  value={persona.motivations}
                  onChange={(e) => updatePersona(index, "motivations", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Behaviors</Label>
                <Textarea
                  placeholder="How do they currently solve this problem?"
                  value={persona.behaviors}
                  onChange={(e) => updatePersona(index, "behaviors", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default UserPersonasTask;
