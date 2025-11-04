import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface ResearchReportProps {
  idea: any;
  validations: any[];
}

export const ResearchReport = ({ idea, validations }: ResearchReportProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("AI Research & Analysis Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Idea Title
    doc.setFontSize(18);
    doc.setTextColor(66, 66, 66);
    doc.text(idea.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Executive Summary", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryText = `Consensus Score: ${idea.consensus_score}%\nStatus: ${idea.status}\nCategory: ${idea.category || 'N/A'}\nBusiness Model: ${idea.business_model || 'N/A'}`;
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 40);
    doc.text(splitSummary, 20, yPosition);
    yPosition += splitSummary.length * 6 + 10;

    // AI Agent Analysis
    validations.forEach((validation, idx) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${validation.agent.toUpperCase()} AI Analysis`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Score: ${validation.score}%`, 20, yPosition);
      yPosition += 8;

      if (validation.marketAnalysis) {
        doc.setFont("helvetica", "bold");
        doc.text("Market Analysis:", 20, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        const marketText = doc.splitTextToSize(validation.marketAnalysis, pageWidth - 40);
        doc.text(marketText, 20, yPosition);
        yPosition += marketText.length * 5 + 5;
      }

      if (validation.competitorInsights) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Competitor Insights:", 20, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        const compText = doc.splitTextToSize(validation.competitorInsights, pageWidth - 40);
        doc.text(compText, 20, yPosition);
        yPosition += compText.length * 5 + 10;
      }
    });

    doc.save(`${idea.title.replace(/[^a-z0-9]/gi, '_')}_Research_Report.pdf`);
  };

  const generateWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "AI Research & Analysis Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: idea.title,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Executive Summary
          new Paragraph({
            text: "Executive Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Consensus Score: ", bold: true }),
              new TextRun(`${idea.consensus_score}%`),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Status: ", bold: true }),
              new TextRun(`${idea.status}`),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Category: ", bold: true }),
              new TextRun(`${idea.category || 'N/A'}`),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Business Model: ", bold: true }),
              new TextRun(`${idea.business_model || 'N/A'}`),
            ],
            spacing: { after: 400 },
          }),

          // AI Agent Analysis Sections
          ...validations.flatMap((validation) => [
            new Paragraph({
              text: `${validation.agent.toUpperCase()} AI Analysis`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Score: ", bold: true }),
                new TextRun(`${validation.score}%`),
              ],
              spacing: { after: 200 },
            }),
            ...(validation.researchProcess ? [
              new Paragraph({
                text: "Research Methodology:",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: validation.researchProcess,
                spacing: { after: 200 },
              }),
            ] : []),
            ...(validation.marketAnalysis ? [
              new Paragraph({
                text: "Market Analysis:",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: validation.marketAnalysis,
                spacing: { after: 200 },
              }),
            ] : []),
            ...(validation.competitorInsights ? [
              new Paragraph({
                text: "Competitor Insights:",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: validation.competitorInsights,
                spacing: { after: 200 },
              }),
            ] : []),
            ...(validation.feedback ? [
              new Paragraph({
                text: "Overall Feedback:",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: validation.feedback,
                spacing: { after: 300 },
              }),
            ] : []),
          ]),
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
          <h3 className="text-2xl font-bold mb-2">📊 Comprehensive Research Report</h3>
          <p className="text-sm text-muted-foreground">
            Multi-AI validated analysis combining Claude, Gemini, and Codex insights
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

      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-6 py-3">
          <h4 className="font-bold text-lg mb-2">Executive Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Consensus Score</p>
              <p className="text-2xl font-bold text-primary">{idea.consensus_score}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">AI Agents</p>
              <p className="text-xl font-bold">{validations.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{idea.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{idea.status}</p>
            </div>
          </div>
        </div>

        {validations.map((validation, idx) => (
          <div key={idx} className="border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold capitalize">
                {validation.agent === 'claude' && '🔵'} 
                {validation.agent === 'gemini' && '🟢'} 
                {validation.agent === 'codex' && '🟣'} 
                {validation.agent} AI Research
              </h4>
              <div className="text-2xl font-bold text-primary">{validation.score}%</div>
            </div>

            {validation.researchProcess && (
              <div className="mb-4 bg-primary/5 p-4 rounded">
                <p className="text-sm font-bold text-primary mb-2">Research Methodology</p>
                <p className="text-sm whitespace-pre-line">{validation.researchProcess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validation.marketAnalysis && (
                <div className="bg-muted/30 p-4 rounded">
                  <p className="text-sm font-bold mb-2">🎯 Market Analysis</p>
                  <p className="text-sm whitespace-pre-line">{validation.marketAnalysis}</p>
                </div>
              )}

              {validation.competitorInsights && (
                <div className="bg-muted/30 p-4 rounded">
                  <p className="text-sm font-bold mb-2">⚔️ Competitor Insights</p>
                  <p className="text-sm whitespace-pre-line">{validation.competitorInsights}</p>
                </div>
              )}
            </div>

            {validation.feedback && (
              <div className="mt-4 bg-muted/20 p-4 rounded">
                <p className="text-sm font-bold mb-2">💬 Overall Feedback</p>
                <p className="text-sm whitespace-pre-line">{validation.feedback}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {validation.strengths?.length > 0 && (
                <div className="bg-success/10 p-3 rounded">
                  <p className="text-sm font-bold text-success mb-2">✓ Strengths</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validation.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.concerns?.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded">
                  <p className="text-sm font-bold text-destructive mb-2">⚠ Concerns</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validation.concerns.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.recommendations?.length > 0 && (
                <div className="bg-primary/10 p-3 rounded">
                  <p className="text-sm font-bold text-primary mb-2">→ Recommendations</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validation.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};