import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface ResearchReportProps {
  idea: any;
  validations: any[];
}

export const ResearchReport = ({ idea, validations }: ResearchReportProps) => {
  const consensusScore = idea.consensus_score || 0;
  const avgScore = validations.reduce((sum, v) => sum + (v.score || 0), 0) / validations.length;
  
  // Aggregate all strengths, concerns, recommendations
  const allStrengths = validations.flatMap(v => v.strengths || []);
  const allConcerns = validations.flatMap(v => v.concerns || []);
  const allRecommendations = validations.flatMap(v => v.recommendations || []);

  // Extract unique items
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Cover Page
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Startup Idea Validation", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
    doc.setFontSize(24);
    doc.text("Research Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    doc.setFontSize(18);
    doc.setTextColor(66, 66, 66);
    doc.text(idea.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 30;

    // Decision Box
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`AI DECISION: ${decision.text}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    doc.setFontSize(12);
    doc.text(`Consensus Score: ${consensusScore}%`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 25;

    // New Page - Executive Summary
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("1. Executive Summary", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const execSummary = `Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), this startup idea received a consensus score of ${consensusScore}%. Category: ${idea.category || 'N/A'}. Business Model: ${idea.business_model || 'N/A'}.`;
    const splitExec = doc.splitTextToSize(execSummary, pageWidth - 40);
    doc.text(splitExec, 20, yPosition);
    yPosition += splitExec.length * 6 + 8;

    // Key Findings
    doc.setFont("helvetica", "bold");
    doc.text("Key Findings:", 20, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    uniqueStrengths.slice(0, 3).forEach((strength, idx) => {
      const text = doc.splitTextToSize(`✓ ${strength}`, pageWidth - 45);
      doc.text(text, 25, yPosition);
      yPosition += text.length * 5 + 3;
    });
    yPosition += 5;

    uniqueConcerns.slice(0, 3).forEach((concern, idx) => {
      const text = doc.splitTextToSize(`⚠ ${concern}`, pageWidth - 45);
      doc.text(text, 25, yPosition);
      yPosition += text.length * 5 + 3;
    });

    // Market Opportunity
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("2. Market Opportunity Analysis", 20, yPosition);
    yPosition += 10;

    validations.forEach((validation, idx) => {
      if (validation.marketAnalysis && yPosition < 250) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const marketText = doc.splitTextToSize(validation.marketAnalysis.substring(0, 500) + "...", pageWidth - 40);
        doc.text(marketText, 20, yPosition);
        yPosition += marketText.length * 5 + 10;
      }
    });

    // Competitive Landscape
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("3. Competitive Landscape", 20, yPosition);
    yPosition += 10;

    validations.forEach((validation) => {
      if (validation.competitorInsights && yPosition < 250) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const compText = doc.splitTextToSize(validation.competitorInsights.substring(0, 500) + "...", pageWidth - 40);
        doc.text(compText, 20, yPosition);
        yPosition += compText.length * 5 + 10;
      }
    });

    // Strategic Frameworks
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("4. Strategic Frameworks", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text("SWOT Analysis:", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    uniqueStrengths.slice(0, 3).forEach((s) => {
      const text = doc.splitTextToSize(`• ${s}`, pageWidth - 40);
      doc.text(text, 25, yPosition);
      yPosition += text.length * 5 + 2;
    });

    // Recommendations
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("5. Recommendations", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    uniqueRecommendations.forEach((rec) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      const text = doc.splitTextToSize(`→ ${rec}`, pageWidth - 40);
      doc.text(text, 20, yPosition);
      yPosition += text.length * 5 + 5;
    });

    doc.save(`${idea.title.replace(/[^a-z0-9]/gi, '_')}_Research_Report.pdf`);
  };

  const generateWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Cover Page
          new Paragraph({
            text: "Startup Idea Validation",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Research Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: idea.title,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `AI DECISION: ${decision.text}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Consensus Score: ${consensusScore}%`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // Executive Summary
          new Paragraph({
            text: "1. Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), this startup idea received a consensus score of ${consensusScore}%. Category: ${idea.category || 'N/A'}. Business Model: ${idea.business_model || 'N/A'}.`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Key Findings:",
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          ...uniqueStrengths.slice(0, 5).map(s => new Paragraph({
            text: `✓ ${s}`,
            spacing: { after: 100 },
          })),
          ...uniqueConcerns.slice(0, 5).map(c => new Paragraph({
            text: `⚠ ${c}`,
            spacing: { after: 100 },
          })),

          // Market Opportunity
          new Paragraph({
            text: "2. Market Opportunity Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...validations.flatMap(v => v.marketAnalysis ? [
            new Paragraph({
              text: v.marketAnalysis,
              spacing: { after: 200 },
            })
          ] : []),

          // Competitive Landscape
          new Paragraph({
            text: "3. Competitive Landscape",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...validations.flatMap(v => v.competitorInsights ? [
            new Paragraph({
              text: v.competitorInsights,
              spacing: { after: 200 },
            })
          ] : []),

          // Strategic Frameworks
          new Paragraph({
            text: "4. Strategic Frameworks",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "SWOT Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Strengths:",
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          ...uniqueStrengths.map(s => new Paragraph({
            text: `• ${s}`,
            spacing: { after: 100 },
          })),
          new Paragraph({
            text: "Concerns:",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          ...uniqueConcerns.map(c => new Paragraph({
            text: `• ${c}`,
            spacing: { after: 100 },
          })),

          // Recommendations
          new Paragraph({
            text: "5. Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...uniqueRecommendations.map(r => new Paragraph({
            text: `→ ${r}`,
            spacing: { after: 150 },
          })),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${idea.title.replace(/[^a-z0-9]/gi, '_')}_Research_Report.docx`);
  };

  return (
    <Card className="glass-panel p-8 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">📊 Professional Research Report</h3>
          <p className="text-sm text-muted-foreground">
            Multi-AI validated McKinsey-quality analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={generateWord} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Download Word
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-xl font-bold">1. Executive Summary</h4>
        </div>
        
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

        <div className="bg-muted/30 p-6 rounded-lg mb-4">
          <p className="text-sm">
            Based on comprehensive analysis by three AI agents (Claude, Gemini, Codex), 
            this startup idea received a <span className="font-bold">{consensusScore}% consensus score</span>. 
            {consensusScore >= 70 && " The idea shows strong potential with favorable market conditions and clear competitive advantages."}
            {consensusScore >= 50 && consensusScore < 70 && " The idea has potential but requires refinement in key areas before proceeding."}
            {consensusScore < 50 && " Significant concerns were identified that require addressing before moving forward."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success/10 p-4 rounded-lg">
            <p className="text-sm font-bold text-success mb-3">✓ Key Strengths</p>
            <ul className="text-sm space-y-2">
              {uniqueStrengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm font-bold text-destructive mb-3">⚠ Key Concerns</p>
            <ul className="text-sm space-y-2">
              {uniqueConcerns.slice(0, 3).map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm font-bold text-primary mb-3">→ Top Recommendations</p>
            <ul className="text-sm space-y-2">
              {uniqueRecommendations.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Market Opportunity Analysis */}
      <div className="mb-8">
        <h4 className="text-xl font-bold mb-4">2. Market Opportunity Analysis</h4>
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
                <p className="text-sm whitespace-pre-line">{validation.marketAnalysis}</p>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="mb-8">
        <h4 className="text-xl font-bold mb-4">3. Competitive Landscape</h4>
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
                <p className="text-sm whitespace-pre-line">{validation.competitorInsights}</p>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Strategic Frameworks */}
      <div className="mb-8">
        <h4 className="text-xl font-bold mb-4">4. Strategic Frameworks</h4>
        <div className="space-y-6">
          {/* SWOT Summary */}
          <div>
            <h5 className="text-lg font-semibold mb-3">SWOT Analysis</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-success/5 border-success/30">
                <p className="font-bold text-success mb-2">Strengths</p>
                <ul className="text-sm space-y-1">
                  {uniqueStrengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </Card>
              <Card className="p-4 bg-destructive/5 border-destructive/30">
                <p className="font-bold text-destructive mb-2">Concerns/Weaknesses</p>
                <ul className="text-sm space-y-1">
                  {uniqueConcerns.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* Research Methodologies */}
          <div>
            <h5 className="text-lg font-semibold mb-3">Research Methodologies</h5>
            {validations.map((validation, idx) => 
              validation.researchProcess && (
                <Card key={idx} className="p-4 bg-primary/5 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {validation.agent}
                    </Badge>
                  </div>
                  <p className="text-sm">{validation.researchProcess}</p>
                </Card>
              )
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-8">
        <h4 className="text-xl font-bold mb-4">5. Implementation Recommendations</h4>
        <div className="space-y-3">
          {uniqueRecommendations.map((rec, i) => (
            <Card key={i} className="p-4 bg-muted/20">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold text-lg">{i + 1}.</span>
                <p className="text-sm">{rec}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div>
        <h4 className="text-xl font-bold mb-4">6. Next Steps</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-2 border-primary/50">
            <p className="font-bold mb-2">Phase 1: Validation (0-3 months)</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Complete business validation</li>
              <li>• Define target market</li>
              <li>• Build MVP specs</li>
            </ul>
          </Card>
          <Card className="p-4 border-2 border-primary/30">
            <p className="font-bold mb-2">Phase 2: MVP (3-6 months)</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Develop core features</li>
              <li>• Launch beta testing</li>
              <li>• Gather user feedback</li>
            </ul>
          </Card>
          <Card className="p-4 border-2 border-primary/20">
            <p className="font-bold mb-2">Phase 3: Scale (6-12 months)</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Market expansion</li>
              <li>• Team building</li>
              <li>• Revenue optimization</li>
            </ul>
          </Card>
        </div>
      </div>
    </Card>
  );
};