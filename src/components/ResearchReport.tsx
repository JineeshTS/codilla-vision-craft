import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, TrendingUp, TrendingDown, Target, Users, DollarSign, Lightbulb, Minus } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
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
    { id: "cover", title: "Cover Page" },
    { id: "toc", title: "Table of Contents" },
    { id: "overview", title: "Overview", subsections: [
      { id: "executive-summary", title: "Executive Summary" },
      { id: "mission", title: "Mission & Vision" },
    ]},
    { id: "swot", title: "SWOT Analysis" },
    { id: "business-model", title: "Business Model Viability" },
    { id: "market", title: "Market Research", subsections: [
      { id: "industry-overview", title: "Industry Overview" },
      { id: "target-audience", title: "Target Audience" },
      { id: "market-size", title: "Market Size & Trends" },
    ]},
    { id: "competitive", title: "Competitor Analysis", subsections: [
      { id: "competitive-landscape", title: "Competitive Landscape" },
      { id: "competitive-positioning", title: "Competitive Positioning" },
    ]},
    { id: "strategy", title: "Go-to-Market Strategy" },
    { id: "financials", title: "Financial Projections" },
    { id: "implementation", title: "Implementation Roadmap" },
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
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 80;

    // Cover Page
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text(idea.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;
    doc.setFontSize(24);
    doc.text("BUSINESS RESEARCH REPORT", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" });
    doc.text(`Consensus Score: ${consensusScore}%`, pageWidth / 2, yPosition + 10, { align: "center" });

    // New page for content
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    yPosition = 20;

    // Table of Contents
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", 20, yPosition);
    yPosition += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const tocItems = [
      "Executive Summary",
      "SWOT Analysis", 
      "Market Research",
      "Competitive Analysis",
      "Implementation Roadmap"
    ];
    tocItems.forEach((item, i) => {
      doc.text(`${i + 1}. ${item}`, 25, yPosition);
      yPosition += 8;
    });

    // Executive Summary
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 20, yPosition);
    yPosition += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryText = `This ${idea.category || "business"} idea has been analyzed by multiple AI agents and received a ${consensusScore}% consensus score. The analysis indicates a ${decision.text} recommendation based on comprehensive market research and competitive analysis.`;
    const splitText = doc.splitTextToSize(summaryText, pageWidth - 40);
    doc.text(splitText, 20, yPosition);
    yPosition += splitText.length * 6 + 10;

    // Key Metrics
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Key Metrics", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Decision: ${decision.text}`, 25, yPosition);
    doc.text(`Consensus: ${consensusScore}%`, 25, yPosition + 6);
    doc.text(`AI Agents: ${validations.length}`, 25, yPosition + 12);

    // SWOT Analysis
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 25;
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SWOT Analysis", 20, yPosition);
    yPosition += 12;

    // Strengths
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Strengths", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    uniqueStrengths.slice(0, 5).forEach((strength) => {
      const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - 45);
      doc.text(lines, 25, yPosition);
      yPosition += lines.length * 5;
    });

    // Concerns
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Concerns", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    uniqueConcerns.slice(0, 5).forEach((concern) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      const lines = doc.splitTextToSize(`• ${concern}`, pageWidth - 45);
      doc.text(lines, 25, yPosition);
      yPosition += lines.length * 5;
    });

    doc.save(`${idea.title.replace(/[^a-z0-9]/gi, "_")}_Research_Report.pdf`);
  };

  const generateWord = async () => {
    const children: any[] = [
      // Cover Page
      new Paragraph({
        text: idea.title.toUpperCase(),
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      }),
      new Paragraph({
        text: "BUSINESS RESEARCH REPORT",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 2000 },
      }),
      new Paragraph({
        text: `Generated: ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: `Consensus Score: ${consensusScore}%`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // Table of Contents
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: "1. Executive Summary",
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: "2. SWOT Analysis",
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: "3. Market Research",
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: "4. Competitive Analysis",
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: "5. Implementation Roadmap",
        spacing: { after: 400 },
      }),

      // Executive Summary
      new Paragraph({
        text: "Executive Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: `This ${idea.category || "business"} idea has been analyzed by multiple AI agents and received a ${consensusScore}% consensus score. The analysis indicates a ${decision.text} recommendation based on comprehensive market research and competitive analysis.`,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: "Key Metrics",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: `Decision: ${decision.text}`,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `Consensus Score: ${consensusScore}%`,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `AI Agents Consulted: ${validations.length}`,
        spacing: { after: 200 },
      }),

      // SWOT Analysis
      new Paragraph({
        text: "SWOT Analysis",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: "Strengths",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 100 },
      }),
      ...uniqueStrengths.map((s: string) => new Paragraph({
        text: `• ${s}`,
        spacing: { after: 100 },
      })),
      new Paragraph({
        text: "Weaknesses/Concerns",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      ...uniqueConcerns.map((c: string) => new Paragraph({
        text: `• ${c}`,
        spacing: { after: 100 },
      })),

      // Recommendations
      new Paragraph({
        text: "Recommendations",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      ...uniqueRecommendations.map((r: string, i: number) => new Paragraph({
        text: `${i + 1}. ${r}`,
        spacing: { after: 100 },
      })),
    ];

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${idea.title.replace(/[^a-z0-9]/gi, "_")}_Research_Report.docx`);
  };

  return (
    <div className="flex h-screen bg-muted/10">
      <ResearchReportSidebar 
        sections={sections}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        {/* Document Container */}
        <div className="max-w-[900px] mx-auto bg-background shadow-2xl my-12 mb-12">
          
          {/* Cover Page */}
          <section id="cover" data-section="cover" className="min-h-[600px] flex flex-col items-center justify-center p-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground scroll-mt-0">
            <div className="text-center space-y-8 max-w-3xl">
              <div className="w-20 h-20 mx-auto bg-background/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-10 h-10" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight leading-tight">
                {idea.title}
              </h1>
              <div className="h-1 w-32 bg-background/30 mx-auto rounded-full" />
              <p className="text-2xl font-light uppercase tracking-widest">
                Business Research Report
              </p>
              <div className="pt-8 space-y-2 text-sm font-medium opacity-90">
                <p>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p>Consensus Score: {consensusScore}%</p>
                <p>Status: {decision.text}</p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-8">
                <Button onClick={generatePDF} variant="secondary" size="lg" className="font-semibold">
                  <FileText className="w-5 h-5 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={generateWord} variant="secondary" size="lg" className="font-semibold">
                  <FileDown className="w-5 h-5 mr-2" />
                  Export Word
                </Button>
              </div>
            </div>
          </section>

          {/* Table of Contents */}
          <section id="toc" data-section="toc" className="min-h-[400px] p-16 border-b scroll-mt-0">
            <h2 className="text-3xl font-bold mb-12 pb-4 border-b-2 border-primary/20">Table of Contents</h2>
            <div className="space-y-4 text-base">
              {sections.slice(2).map((section, idx) => (
                <div key={section.id} className="group">
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center justify-between w-full py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-primary">{idx + 1}</span>
                      <span className="font-medium group-hover:text-primary transition-colors">{section.title}</span>
                    </div>
                  </button>
                  {section.subsections && (
                    <div className="ml-12 mt-2 space-y-2">
                      {section.subsections.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => scrollToSection(sub.id)}
                          className="block w-full text-left py-2 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors"
                        >
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Document Content */}
          <div className="p-16 space-y-16">

            {/* Executive Summary */}
            <section id="executive-summary" data-section="executive-summary" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Executive Summary</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="grid grid-cols-4 gap-4 mb-10">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
                  <DecisionIcon className={`w-10 h-10 ${decision.color} mb-3`} />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Decision</p>
                  <p className={`text-2xl font-bold ${decision.color}`}>{decision.text}</p>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Consensus</p>
                  <p className="text-2xl font-bold text-foreground">{consensusScore}%</p>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Agents</p>
                  <p className="text-2xl font-bold text-foreground">{validations.length}</p>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
                  <p className="text-lg font-bold text-foreground">{idea.category || "N/A"}</p>
                </div>
              </div>

              <div className="bg-muted/20 border-l-4 border-primary p-8 rounded-r-xl">
                <p className="text-base leading-relaxed text-foreground">
                  Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), 
                  this startup idea received a <strong className="text-primary">{consensusScore}% consensus score</strong>. 
                  {consensusScore >= 70 && " The idea shows strong potential with favorable market conditions and clear competitive advantages."}
                  {consensusScore >= 50 && consensusScore < 70 && " The idea has potential but requires refinement in key areas before proceeding."}
                  {consensusScore < 50 && " Significant concerns were identified that require addressing before moving forward."}
                </p>
              </div>
            </section>

            {/* Mission & Vision */}
            <section id="mission" data-section="mission" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Mission & Vision</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Mission Statement</h3>
                  </div>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    To deliver innovative solutions that address real market needs while creating sustainable value for customers and stakeholders through cutting-edge technology and customer-centric approach.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Vision Statement</h3>
                  </div>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    To become a market leader in {idea.category || "our industry"}, recognized for innovation, quality, and customer satisfaction, while maintaining sustainable growth and positive impact on the community.
                  </p>
                </div>
              </div>
            </section>

            {/* SWOT Analysis */}
            <section id="swot" data-section="swot" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">SWOT Analysis</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20 dark:to-background p-8 rounded-xl border-2 border-green-200 dark:border-green-900/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    {uniqueStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg mt-0.5 shrink-0">✓</span>
                        <span className="text-sm leading-relaxed text-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-background dark:from-red-950/20 dark:to-background p-8 rounded-xl border-2 border-red-200 dark:border-red-900/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">Weaknesses</h3>
                  </div>
                  <ul className="space-y-3">
                    {uniqueConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-red-600 dark:text-red-400 font-bold text-lg mt-0.5 shrink-0">⚠</span>
                        <span className="text-sm leading-relaxed text-foreground">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Business Model */}
            <section id="business-model" data-section="business-model" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Business Model Viability</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="bg-muted/20 border-l-4 border-primary p-8 rounded-r-xl mb-8">
                <p className="text-base leading-relaxed text-foreground">
                  The business model has been evaluated across multiple dimensions including revenue potential, 
                  market fit, scalability, and competitive positioning. Based on the {consensusScore}% consensus score, 
                  the model shows {consensusScore >= 70 ? "strong" : consensusScore >= 50 ? "moderate" : "limited"} viability with {consensusScore >= 70 ? "favorable" : "mixed"} prospects for success.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-primary/5 to-background p-6 rounded-xl border border-border">
                  <DollarSign className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">Revenue Model</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Diversified revenue streams with focus on recurring revenue and scalable pricing models.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-background p-6 rounded-xl border border-border">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">Market Fit</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Strong alignment with target customer needs and validated market demand.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-background p-6 rounded-xl border border-border">
                  <TrendingUp className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">Scalability</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Proven ability to scale operations efficiently with manageable cost structure.
                  </p>
                </div>
              </div>
            </section>

            {/* Industry Overview */}
            <section id="industry-overview" data-section="industry-overview" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Industry Overview</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="space-y-6">
                {validations.map((validation, idx) => 
                  validation.marketAnalysis && (
                    <div key={idx} className="bg-muted/20 p-8 rounded-xl border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="secondary" className="text-base px-4 py-1">
                          {validation.agent === "claude" && "🔵"} 
                          {validation.agent === "gemini" && "🟢"} 
                          {validation.agent === "codex" && "🟣"} 
                          {validation.agent.charAt(0).toUpperCase() + validation.agent.slice(1)} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{validation.marketAnalysis}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Target Audience */}
            <section id="target-audience" data-section="target-audience" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Target Audience</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20 dark:to-background p-8 rounded-xl border border-blue-200 dark:border-blue-900/30">
                  <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-400">Primary Segment</h3>
                  <div className="space-y-3 text-sm text-foreground">
                    <p><strong>Demographics:</strong> Early adopters and tech-savvy individuals aged 25-45</p>
                    <p><strong>Psychographics:</strong> Innovation-focused, value quality and convenience</p>
                    <p><strong>Behavior:</strong> Active online presence, willing to pay premium for value</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20 dark:to-background p-8 rounded-xl border border-purple-200 dark:border-purple-900/30">
                  <h3 className="text-xl font-bold mb-4 text-purple-700 dark:text-purple-400">Secondary Segment</h3>
                  <div className="space-y-3 text-sm text-foreground">
                    <p><strong>Demographics:</strong> Growing businesses and enterprises</p>
                    <p><strong>Psychographics:</strong> Efficiency-driven, ROI-focused decision makers</p>
                    <p><strong>Behavior:</strong> Research extensively before purchase, value partnerships</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Market Size & Trends */}
            <section id="market-size" data-section="market-size" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Market Size & Trends</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-4xl font-bold text-primary mb-2">$XXB</p>
                  <p className="text-sm text-muted-foreground font-medium">Total Addressable Market</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-4xl font-bold text-primary mb-2">XX%</p>
                  <p className="text-sm text-muted-foreground font-medium">Annual Growth Rate</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-4xl font-bold text-primary mb-2">$XXM</p>
                  <p className="text-sm text-muted-foreground font-medium">Serviceable Market</p>
                </div>
              </div>

              <div className="bg-muted/20 border-l-4 border-primary p-8 rounded-r-xl">
                <h3 className="font-bold text-lg mb-4">Key Market Trends</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground leading-relaxed">Increasing digital adoption and cloud-based solutions across industries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground leading-relaxed">Growing demand for automation and AI-powered tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground leading-relaxed">Shift towards subscription-based and recurring revenue models</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Competitive Landscape */}
            <section id="competitive-landscape" data-section="competitive-landscape" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Competitive Landscape</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="space-y-6">
                {validations.map((validation, idx) => 
                  validation.competitorInsights && (
                    <div key={idx} className="bg-muted/20 p-8 rounded-xl border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="secondary" className="text-base px-4 py-1">
                          {validation.agent === "claude" && "🔵"} 
                          {validation.agent === "gemini" && "🟢"} 
                          {validation.agent === "codex" && "🟣"} 
                          {validation.agent.charAt(0).toUpperCase() + validation.agent.slice(1)} Analysis
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{validation.competitorInsights}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Competitive Positioning */}
            <section id="competitive-positioning" data-section="competitive-positioning" className="scroll-mt-24">
              <h2 className="text-4xl font-bold mb-3">Competitive Positioning</h2>
              <div className="h-1 w-24 bg-primary rounded-full mb-8" />
              
              <div className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-xl border border-primary/10">
                <h3 className="text-xl font-bold mb-6">Unique Value Proposition</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Our Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      {uniqueStrengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="text-foreground">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Differentiation</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      Focus on innovation, superior customer experience, and data-driven approach sets us apart from traditional competitors.
                    </p>
                  </div>
                </div>
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