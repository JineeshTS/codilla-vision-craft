import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { ResearchReportSidebar } from "./ResearchReportSidebar";

interface ResearchReportProps {
  idea: any;
  validations: any[];
}

export const ResearchReport = ({ idea, validations }: ResearchReportProps) => {
  const [activeSection, setActiveSection] = useState("executive-summary");
  const contentRef = useRef<HTMLDivElement>(null);

  const consensusScore = idea.consensus_score || 0;
  const allStrengths = validations.flatMap(v => v.strengths || []);
  const allConcerns = validations.flatMap(v => v.concerns || []);
  const allRecommendations = validations.flatMap(v => v.recommendations || []);

  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
  const uniqueConcerns = [...new Set(allConcerns)].slice(0, 5);
  const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);

  const getDecision = () => {
    if (consensusScore >= 70) return { text: "GO", color: "text-success", icon: TrendingUp };
    if (consensusScore >= 50) return { text: "CONDITIONAL GO", color: "text-warning", icon: Minus };
    return { text: "NO-GO", color: "text-destructive", icon: TrendingDown };
  };

  const decision = getDecision();
  const DecisionIcon = decision.icon;

  const sections = [
    { id: "overview", title: "Overview", subsections: [
      { id: "executive-summary", title: "Executive Summary" },
      { id: "key-findings", title: "Key Findings" },
    ]},
    { id: "market", title: "Market Research", subsections: [
      { id: "market-opportunity", title: "Market Opportunity" },
      { id: "market-size", title: "Market Size & Trends" },
    ]},
    { id: "competitive", title: "Competitive Analysis", subsections: [
      { id: "competitive-landscape", title: "Competitive Landscape" },
      { id: "competitor-insights", title: "Competitor Insights" },
    ]},
    { id: "strategic", title: "Strategic Frameworks", subsections: [
      { id: "swot-analysis", title: "SWOT Analysis" },
      { id: "research-methodology", title: "Research Methodology" },
    ]},
    { id: "recommendations", title: "Recommendations" },
    { id: "next-steps", title: "Implementation Roadmap" },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      let currentSection = "executive-summary";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section.getAttribute("data-section") || currentSection;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Research Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;
    doc.setFontSize(18);
    doc.text(idea.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    doc.setFontSize(14);
    doc.text(`Decision: ${decision.text}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Consensus Score: ${consensusScore}%`, 20, yPosition);

    doc.save(`${idea.title.replace(/[^a-z0-9]/gi, '_')}_Research_Report.pdf`);
  };

  const generateWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Research Report",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: idea.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 400 },
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${idea.title.replace(/[^a-z0-9]/gi, '_')}_Research_Report.docx`);
  };

  return (
    <Card className="glass-panel overflow-hidden">
      <div className="flex h-full">
        <ResearchReportSidebar 
          sections={sections}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
        />

        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          <div className="p-8">
            {/* Header with Export */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <div>
                <h2 className="text-3xl font-bold mb-2">Professional Research Report</h2>
                <p className="text-sm text-muted-foreground">
                  Multi-AI validated McKinsey-quality analysis
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={generatePDF} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={generateWord} variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Word
                </Button>
              </div>
            </div>

            {/* Executive Summary */}
            <section id="executive-summary" data-section="executive-summary" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Executive Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 border-2 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <DecisionIcon className={`w-5 h-5 ${decision.color}`} />
                    <p className="text-sm text-muted-foreground">Decision</p>
                  </div>
                  <p className={`text-2xl font-bold ${decision.color}`}>{decision.text}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Consensus Score</p>
                  <p className="text-2xl font-bold text-primary">{consensusScore}%</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">AI Agents</p>
                  <p className="text-2xl font-bold">{validations.length}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Category</p>
                  <p className="text-lg font-medium">{idea.category || 'N/A'}</p>
                </Card>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <p className="text-sm leading-relaxed">
                  Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), 
                  this startup idea received a <span className="font-bold">{consensusScore}% consensus score</span>. 
                  {consensusScore >= 70 && " The idea shows strong potential with favorable market conditions and clear competitive advantages."}
                  {consensusScore >= 50 && consensusScore < 70 && " The idea has potential but requires refinement in key areas before proceeding."}
                  {consensusScore < 50 && " Significant concerns were identified that require addressing before moving forward."}
                </p>
              </div>
            </section>

            {/* Key Findings */}
            <section id="key-findings" data-section="key-findings" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Key Findings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-success/10 p-6 rounded-lg">
                  <p className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Key Strengths
                  </p>
                  <ul className="text-sm space-y-2">
                    {uniqueStrengths.slice(0, 5).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-destructive/10 p-6 rounded-lg">
                  <p className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Key Concerns
                  </p>
                  <ul className="text-sm space-y-2">
                    {uniqueConcerns.slice(0, 5).map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/10 p-6 rounded-lg">
                  <p className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Minus className="w-4 h-4" />
                    Top Recommendations
                  </p>
                  <ul className="text-sm space-y-2">
                    {uniqueRecommendations.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Market Opportunity */}
            <section id="market-opportunity" data-section="market-opportunity" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Market Opportunity Analysis</h3>
              <div className="space-y-4">
                {validations.map((validation, idx) => 
                  validation.marketAnalysis && (
                    <Card key={idx} className="p-6 bg-muted/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="capitalize">
                          {validation.agent === 'claude' && '🔵'} 
                          {validation.agent === 'gemini' && '🟢'} 
                          {validation.agent === 'codex' && '🟣'} 
                          {validation.agent} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{validation.marketAnalysis}</p>
                    </Card>
                  )
                )}
              </div>
            </section>

            {/* Competitive Landscape */}
            <section id="competitive-landscape" data-section="competitive-landscape" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Competitive Landscape</h3>
              <div className="space-y-4">
                {validations.map((validation, idx) => 
                  validation.competitorInsights && (
                    <Card key={idx} className="p-6 bg-muted/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="capitalize">
                          {validation.agent === 'claude' && '🔵'} 
                          {validation.agent === 'gemini' && '🟢'} 
                          {validation.agent === 'codex' && '🟣'} 
                          {validation.agent} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{validation.competitorInsights}</p>
                    </Card>
                  )
                )}
              </div>
            </section>

            {/* SWOT Analysis */}
            <section id="swot-analysis" data-section="swot-analysis" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">SWOT Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-success/5 border-success/30">
                  <p className="font-bold text-success mb-4 text-lg">Strengths</p>
                  <ul className="text-sm space-y-2">
                    {uniqueStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-6 bg-destructive/5 border-destructive/30">
                  <p className="font-bold text-destructive mb-4 text-lg">Weaknesses/Concerns</p>
                  <ul className="text-sm space-y-2">
                    {uniqueConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-destructive">⚠</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </section>

            {/* Research Methodology */}
            <section id="research-methodology" data-section="research-methodology" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Research Methodologies</h3>
              {validations.map((validation, idx) => 
                validation.researchProcess && (
                  <Card key={idx} className="p-6 bg-primary/5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="capitalize">
                        {validation.agent}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{validation.researchProcess}</p>
                  </Card>
                )
              )}
            </section>

            {/* Recommendations */}
            <section id="recommendations" data-section="recommendations" className="mb-12 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Implementation Recommendations</h3>
              <div className="space-y-3">
                {uniqueRecommendations.map((rec, i) => (
                  <Card key={i} className="p-5 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-primary font-bold text-lg shrink-0">{i + 1}.</span>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Next Steps */}
            <section id="next-steps" data-section="next-steps" className="mb-8 scroll-mt-4">
              <h3 className="text-2xl font-bold mb-6">Implementation Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 border-2 border-primary/50">
                  <p className="font-bold mb-3 text-lg">Phase 1: Validation</p>
                  <p className="text-xs text-muted-foreground mb-3">0-3 months</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Complete business validation</li>
                    <li>• Define target market</li>
                    <li>• Build MVP specifications</li>
                  </ul>
                </Card>
                <Card className="p-6 border-2 border-primary/30">
                  <p className="font-bold mb-3 text-lg">Phase 2: MVP</p>
                  <p className="text-xs text-muted-foreground mb-3">3-6 months</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Develop core features</li>
                    <li>• Launch beta testing</li>
                    <li>• Gather user feedback</li>
                  </ul>
                </Card>
                <Card className="p-6 border-2 border-primary/20">
                  <p className="font-bold mb-3 text-lg">Phase 3: Scale</p>
                  <p className="text-xs text-muted-foreground mb-3">6-12 months</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Market expansion</li>
                    <li>• Team building</li>
                    <li>• Revenue optimization</li>
                  </ul>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Card>
  );
};