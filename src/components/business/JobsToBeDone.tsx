import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface JobsToBeDoneProps {
  data?: any;
  onChange: (data: any) => void;
}

const JobsToBeDone = ({ data = {}, onChange }: JobsToBeDoneProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Jobs-to-be-Done Framework</h2>
      <div className="space-y-6">
        <div>
          <Label>Core Functional Job</Label>
          <Textarea
            placeholder="What is the core task the customer is trying to accomplish?"
            value={data.functionalJob || ""}
            onChange={(e) => updateField("functionalJob", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Emotional Jobs</Label>
          <Textarea
            placeholder="How does the customer want to feel? What emotional needs are they satisfying?"
            value={data.emotionalJobs || ""}
            onChange={(e) => updateField("emotionalJobs", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Social Jobs</Label>
          <Textarea
            placeholder="How does the customer want to be perceived by others?"
            value={data.socialJobs || ""}
            onChange={(e) => updateField("socialJobs", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Related Jobs</Label>
          <Textarea
            placeholder="What other tasks do they need to complete around the core job?"
            value={data.relatedJobs || ""}
            onChange={(e) => updateField("relatedJobs", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Context & Circumstances</Label>
          <Textarea
            placeholder="When and where does this job arise? What triggers the need?"
            value={data.context || ""}
            onChange={(e) => updateField("context", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Desired Outcomes</Label>
          <Textarea
            placeholder="What metrics define success for this job? What outcomes matter most?"
            value={data.outcomes || ""}
            onChange={(e) => updateField("outcomes", e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default JobsToBeDone;
