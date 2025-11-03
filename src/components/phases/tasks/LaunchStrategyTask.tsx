import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { toast } from "sonner";

interface LaunchChannel {
  channel: string;
  strategy: string;
  timeline: string;
}

interface LaunchStrategyTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

export const LaunchStrategyTask = ({ projectId, phaseNumber, taskId }: LaunchStrategyTaskProps) => {
  const [channels, setChannels] = useState<LaunchChannel[]>([
    { channel: "", strategy: "", timeline: "" }
  ]);
  const [coreMessaging, setCoreMessaging] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [launchGoals, setLaunchGoals] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const existingArtifact = result.data.find((a: any) => a.task_id === taskId);
      if (existingArtifact?.artifact_data) {
        const data = existingArtifact.artifact_data;
        setChannels(data.channels || [{ channel: "", strategy: "", timeline: "" }]);
        setCoreMessaging(data.coreMessaging || "");
        setTargetAudience(data.targetAudience || "");
        setLaunchGoals(data.launchGoals || "");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveTaskArtifact(projectId, phaseNumber, taskId, "launch-strategy", {
      channels,
      coreMessaging,
      targetAudience,
      launchGoals
    });

    if (result.success) {
      toast.success("Launch strategy saved successfully");
    } else {
      toast.error("Failed to save launch strategy");
    }
    setIsSaving(false);
  };

  const addChannel = () => {
    setChannels([...channels, { channel: "", strategy: "", timeline: "" }]);
  };

  const removeChannel = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
  };

  const updateChannel = (index: number, field: keyof LaunchChannel, value: string) => {
    const updated = [...channels];
    updated[index][field] = value;
    setChannels(updated);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Launch Goals</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="launchGoals">Primary Launch Objectives</Label>
            <Textarea
              id="launchGoals"
              value={launchGoals}
              onChange={(e) => setLaunchGoals(e.target.value)}
              placeholder="What are the key success metrics and goals for the launch?"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Describe the primary and secondary target audiences"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="coreMessaging">Core Messaging</Label>
            <Textarea
              id="coreMessaging"
              value={coreMessaging}
              onChange={(e) => setCoreMessaging(e.target.value)}
              placeholder="What is the main value proposition and key messages?"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Launch Channels</h3>
          <Button onClick={addChannel} variant="outline" size="sm">Add Channel</Button>
        </div>
        {channels.map((ch, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Label>Channel {index + 1}</Label>
                {channels.length > 1 && (
                  <Button onClick={() => removeChannel(index)} variant="ghost" size="sm">Remove</Button>
                )}
              </div>
              <div>
                <Label htmlFor={`channel-${index}`}>Channel Name</Label>
                <Input
                  id={`channel-${index}`}
                  value={ch.channel}
                  onChange={(e) => updateChannel(index, "channel", e.target.value)}
                  placeholder="e.g., Product Hunt, Social Media, Email"
                />
              </div>
              <div>
                <Label htmlFor={`strategy-${index}`}>Strategy</Label>
                <Textarea
                  id={`strategy-${index}`}
                  value={ch.strategy}
                  onChange={(e) => updateChannel(index, "strategy", e.target.value)}
                  placeholder="Describe the approach for this channel"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor={`timeline-${index}`}>Timeline</Label>
                <Input
                  id={`timeline-${index}`}
                  value={ch.timeline}
                  onChange={(e) => updateChannel(index, "timeline", e.target.value)}
                  placeholder="When will this channel be activated?"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Launch Strategy"}
      </Button>
    </div>
  );
};
