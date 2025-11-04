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
    <div className="flex h-full bg-background">
      <ResearchReportSidebar 
        sections={sections}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      <div className="flex-1 overflow-y-auto bg-muted/20" ref={contentRef}>
        {/* Document Container */}
        <div className="max-w-[850px] mx-auto bg-background shadow-lg my-8">
          {/* Cover Page */}
          <div className="p-16 border-b bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center space-y-6">
              <div className="inline-block px-4 py-1 bg-primary/10 rounded-full mb-4">
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Research Report</p>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{idea.title}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Multi-AI Validated Business Analysis
              </p>
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button onClick={generatePDF} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={generateWord} variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Word
                </Button>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-16 space-y-12">

            {/* Executive Summary */}
            <section id="executive-summary" data-section="executive-summary" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Executive Summary</h2>
              </div>
              
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center p-6 bg-muted/30 rounded-lg border-l-4 border-primary">
                  <DecisionIcon className={`w-8 h-8 ${decision.color} mx-auto mb-2`} />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision</p>
                  <p className={`text-xl font-bold ${decision.color}`}>{decision.text}</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consensus Score</p>
                  <p className="text-3xl font-bold text-primary">{consensusScore}%</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Agents</p>
                  <p className="text-3xl font-bold">{validations.length}</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p className="text-lg font-semibold">{idea.category || 'N/A'}</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), 
                  this startup idea received a <strong className="text-foreground">{consensusScore}% consensus score</strong>. 
                  {consensusScore >= 70 && " The idea shows strong potential with favorable market conditions and clear competitive advantages."}
                  {consensusScore >= 50 && consensusScore < 70 && " The idea has potential but requires refinement in key areas before proceeding."}
                  {consensusScore < 50 && " Significant concerns were identified that require addressing before moving forward."}
                </p>
              </div>
            </section>

            {/* Key Findings */}
            <section id="key-findings" data-section="key-findings" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Key Findings</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-success" />
                    <h3 className="text-lg font-bold text-success">Key Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    {uniqueStrengths.slice(0, 5).map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-success font-bold mt-0.5">✓</span>
                        <span className="text-muted-foreground leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                    <h3 className="text-lg font-bold text-destructive">Key Concerns</h3>
                  </div>
                  <ul className="space-y-3">
                    {uniqueConcerns.slice(0, 5).map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-destructive font-bold mt-0.5">⚠</span>
                        <span className="text-muted-foreground leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Minus className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-primary">Top Recommendations</h3>
                  </div>
                  <ul className="space-y-3">
                    {uniqueRecommendations.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-primary font-bold mt-0.5">→</span>
                        <span className="text-muted-foreground leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Market Opportunity */}
            <section id="market-opportunity" data-section="market-opportunity" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Market Opportunity Analysis</h2>
              </div>
              
              <div className="space-y-6">
                {validations.map((validation, idx) => 
                  validation.marketAnalysis && (
                    <div key={idx} className="border-l-4 border-muted pl-6 py-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="font-medium">
                          {validation.agent === 'claude' && '🔵'} 
                          {validation.agent === 'gemini' && '🟢'} 
                          {validation.agent === 'codex' && '🟣'} 
                          {validation.agent.charAt(0).toUpperCase() + validation.agent.slice(1)} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{validation.marketAnalysis}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Competitive Landscape */}
            <section id="competitive-landscape" data-section="competitive-landscape" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Competitive Landscape</h2>
              </div>
              
              <div className="space-y-6">
                {validations.map((validation, idx) => 
                  validation.competitorInsights && (
                    <div key={idx} className="border-l-4 border-muted pl-6 py-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="font-medium">
                          {validation.agent === 'claude' && '🔵'} 
                          {validation.agent === 'gemini' && '🟢'} 
                          {validation.agent === 'codex' && '🟣'} 
                          {validation.agent.charAt(0).toUpperCase() + validation.agent.slice(1)} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{validation.competitorInsights}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* SWOT Analysis */}
            <section id="swot-analysis" data-section="swot-analysis" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">SWOT Analysis</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-success/5 p-8 rounded-lg border border-success/20">
                  <h3 className="font-bold text-success mb-6 text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {uniqueStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-success font-bold mt-0.5">✓</span>
                        <span className="text-muted-foreground leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-destructive/5 p-8 rounded-lg border border-destructive/20">
                  <h3 className="font-bold text-destructive mb-6 text-xl flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Weaknesses/Concerns
                  </h3>
                  <ul className="space-y-3">
                    {uniqueConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-destructive font-bold mt-0.5">⚠</span>
                        <span className="text-muted-foreground leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Research Methodology */}
            <section id="research-methodology" data-section="research-methodology" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Research Methodologies</h2>
              </div>
              
              <div className="space-y-6">
                {validations.map((validation, idx) => 
                  validation.researchProcess && (
                    <div key={idx} className="bg-muted/30 p-6 rounded-lg">
                      <Badge variant="secondary" className="mb-3 font-medium">
                        {validation.agent.charAt(0).toUpperCase() + validation.agent.slice(1)}
                      </Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed">{validation.researchProcess}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Recommendations */}
            <section id="recommendations" data-section="recommendations" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Implementation Recommendations</h2>
              </div>
              
              <div className="space-y-4">
                {uniqueRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">{rec}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Next Steps */}
            <section id="next-steps" data-section="next-steps" className="scroll-mt-24">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 pb-3 border-b-2 border-primary/20">Implementation Roadmap</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="p-8 bg-primary/5 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                    1
                  </div>
                  <h3 className="font-bold mb-2 text-xl">Phase 1: Validation</h3>
                  <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">0-3 months</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Complete business validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Define target market</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Build MVP specifications</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 bg-muted/20 rounded-lg border-2 border-muted">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted-foreground text-background font-bold text-xl mb-4">
                    2
                  </div>
                  <h3 className="font-bold mb-2 text-xl">Phase 2: MVP</h3>
                  <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">3-6 months</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Develop core features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Launch beta testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Gather user feedback</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 bg-muted/20 rounded-lg border-2 border-muted">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted-foreground text-background font-bold text-xl mb-4">
                    3
                  </div>
                  <h3 className="font-bold mb-2 text-xl">Phase 3: Scale</h3>
                  <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">6-12 months</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Market expansion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Team building</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Revenue optimization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};