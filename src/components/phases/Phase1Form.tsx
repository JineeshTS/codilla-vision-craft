import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle } from "lucide-react";

interface Phase1FormProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  step: number;
}

const categories = [
  "Healthcare & Fitness",
  "Finance & Banking",
  "Education & Learning",
  "E-commerce & Retail",
  "Social & Communication",
  "Productivity & Business",
  "Entertainment & Media",
  "Travel & Hospitality",
  "Real Estate",
  "Food & Delivery",
  "Transportation",
  "Other"
];

const businessModels = [
  "B2C - Direct to Consumer",
  "B2B - Business to Business",
  "B2B2C - Business to Business to Consumer",
  "C2C - Consumer to Consumer",
  "B2G - Business to Government"
];

const audienceSizes = [
  "Niche (<10,000 users)",
  "Focused (10K - 100K users)",
  "Broad (100K - 1M users)",
  "Mass Market (>1M users)"
];

const inspirationSources = [
  "Personal problem I faced",
  "Observed others struggling",
  "Gap in current market",
  "Improvement on existing solution",
  "Completely new innovation",
  "Client/Friend request",
  "Trend analysis"
];

const differentiators = [
  "Better Technology (AI/ML)",
  "Better UX/Design",
  "Better Price",
  "Better Speed",
  "Better Integration",
  "Network Effects",
  "First Mover",
  "Niche Focus"
];

export const Phase1Form = ({ formData, errors, onChange, step }: Phase1FormProps) => {
  return (
    <>
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Idea Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Connect Remote Workers Through Virtual Coffee"
              value={formData.title}
              onChange={(e) => onChange("title", e.target.value)}
              maxLength={60}
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.title}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Format: [Verb] + [Target User] + [Core Value]
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Idea Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your idea in detail. Explain what it does, who it's for, and what problem it solves. Feel free to be as detailed as you need - the AI Mentor can help you refine this."
              rows={6}
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              maxLength={5000}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.description}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/5000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category/Industry</Label>
            <Select value={formData.category} onValueChange={(val) => onChange("category", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_model">Business Model</Label>
            <Select value={formData.business_model} onValueChange={(val) => onChange("business_model", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                {businessModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience_size">Target Audience Size</Label>
            <Select value={formData.audience_size} onValueChange={(val) => onChange("audience_size", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience size" />
              </SelectTrigger>
              <SelectContent>
                {audienceSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspiration">Inspiration Source</Label>
            <Select value={formData.inspiration_source} onValueChange={(val) => onChange("inspiration_source", val)}>
              <SelectTrigger>
                <SelectValue placeholder="What inspired this idea?" />
              </SelectTrigger>
              <SelectContent>
                {inspirationSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="problem">Problem Statement</Label>
            <Textarea
              id="problem"
              placeholder="Currently, [target user] experience [problem] when trying to [task/goal]. This happens [frequency] and causes [negative impact]."
              rows={5}
              value={formData.problem_statement}
              onChange={(e) => onChange("problem_statement", e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              Describe the problem your idea solves
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Who Has This Problem?</Label>
            <Textarea
              id="audience"
              placeholder="Describe your primary user persona: demographics, psychographics, behaviors"
              rows={5}
              value={formData.target_audience}
              onChange={(e) => onChange("target_audience", e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="geography">Target Geography</Label>
              <Input
                id="geography"
                placeholder="e.g., USA, Europe, Global"
                value={formData.target_geography}
                onChange={(e) => onChange("target_geography", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market_size">Estimated Market Size ($)</Label>
              <Input
                id="market_size"
                type="text"
                placeholder="e.g., $50M TAM"
                value={formData.estimated_market_size}
                onChange={(e) => onChange("estimated_market_size", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Demographics</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_range" className="text-sm">Age Range</Label>
                <Input
                  id="age_range"
                  placeholder="e.g., 25-40"
                  value={formData.demographics?.age_range}
                  onChange={(e) => onChange("demographics", { ...formData.demographics, age_range: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm">Gender</Label>
                <Select 
                  value={formData.demographics?.gender} 
                  onValueChange={(val) => onChange("demographics", { ...formData.demographics, gender: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="income" className="text-sm">Income Level</Label>
                <Select 
                  value={formData.demographics?.income_level} 
                  onValueChange={(val) => onChange("demographics", { ...formData.demographics, income_level: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (&lt;$30K)</SelectItem>
                    <SelectItem value="medium">Medium ($30K-$100K)</SelectItem>
                    <SelectItem value="high">High ($100K-$250K)</SelectItem>
                    <SelectItem value="very-high">Very High (&gt;$250K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="psychographics">Psychographics</Label>
            <Textarea
              id="psychographics"
              placeholder="Interests, values, lifestyle, behaviors, tech-savviness, etc."
              rows={3}
              value={formData.psychographics}
              onChange={(e) => onChange("psychographics", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitors">Known Competitors / Current Solutions</Label>
            <Textarea
              id="competitors"
              placeholder="List 3-5 existing solutions and their key weaknesses"
              rows={4}
              value={formData.competitive_landscape}
              onChange={(e) => onChange("competitive_landscape", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="uvp">Unique Value Proposition</Label>
            <Textarea
              id="uvp"
              placeholder="We solve [problem] by [unique approach]. Users will [key action] which will [create value]. Unlike [current solution], we [key differentiator]."
              rows={5}
              value={formData.unique_value_proposition}
              onChange={(e) => onChange("unique_value_proposition", e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="differentiator">Key Differentiator</Label>
            <Select value={formData.key_differentiator} onValueChange={(val) => onChange("key_differentiator", val)}>
              <SelectTrigger>
                <SelectValue placeholder="What makes you different?" />
              </SelectTrigger>
              <SelectContent>
                {differentiators.map(diff => (
                  <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Expected Outcomes (After 6 Months)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_users" className="text-sm">Total Users</Label>
                <Input
                  id="total_users"
                  type="number"
                  placeholder="1000"
                  value={formData.expected_outcomes.total_users}
                  onChange={(e) => onChange("expected_outcomes", { ...formData.expected_outcomes, total_users: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue" className="text-sm">Monthly Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="5000"
                  value={formData.expected_outcomes.revenue}
                  onChange={(e) => onChange("expected_outcomes", { ...formData.expected_outcomes, revenue: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Passion Level (1-10)</Label>
            <div className="space-y-2">
              <Slider
                value={[formData.passion_score]}
                onValueChange={(val) => onChange("passion_score", val[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not passionate</span>
                <span className="text-primary font-bold">{formData.passion_score}/10</span>
                <span>Extremely passionate</span>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2">
              <li>✓ I would use this product myself</li>
              <li>✓ I can talk about this problem for hours</li>
              <li>✓ I'm excited to work on this for 6+ months</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Label>Domain Knowledge (1-10)</Label>
            <div className="space-y-2">
              <Slider
                value={[formData.domain_knowledge_score]}
                onValueChange={(val) => onChange("domain_knowledge_score", val[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No knowledge</span>
                <span className="text-primary font-bold">{formData.domain_knowledge_score}/10</span>
                <span>Expert level</span>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2">
              <li>• Industry Experience</li>
              <li>• Problem Understanding</li>
              <li>• Technical Capability</li>
              <li>• Network Access</li>
            </ul>
          </div>

          {(formData.passion_score > 0 || formData.domain_knowledge_score > 0) && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                Your Screening Score: {Math.round((formData.passion_score + formData.domain_knowledge_score) / 2)}/10
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((formData.passion_score + formData.domain_knowledge_score) / 2) >= 7 && "Strong Go - Excellent fit!"}
                {Math.round((formData.passion_score + formData.domain_knowledge_score) / 2) >= 5 && Math.round((formData.passion_score + formData.domain_knowledge_score) / 2) < 7 && "Conditional Go - Needs work"}
                {Math.round((formData.passion_score + formData.domain_knowledge_score) / 2) < 5 && "Consider refining or pivoting"}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
