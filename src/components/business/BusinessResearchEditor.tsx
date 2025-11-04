import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { ResearchReportSidebar } from '@/components/ResearchReportSidebar';
import { EditableSection } from './EditableSection';
import SWOTAnalysis from './SWOTAnalysis';
import BusinessModelCanvas from './BusinessModelCanvas';
import LeanCanvas from './LeanCanvas';
import ValuePropositionCanvas from './ValuePropositionCanvas';
import PortersFiveForces from './PortersFiveForces';
import BlueOceanCanvas from './BlueOceanCanvas';
import GTMStrategy from './GTMStrategy';
import UnitEconomics from './UnitEconomics';
import RiskMatrix from './RiskMatrix';
import { useBusinessResearch } from '@/hooks/useBusinessResearch';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface BusinessResearchEditorProps {
  ideaId: string;
  ideaTitle: string;
  ideaDescription: string;
}

export const BusinessResearchEditor = ({
  ideaId,
  ideaTitle,
  ideaDescription
}: BusinessResearchEditorProps) => {
  const { data, loading, saving, saveData } = useBusinessResearch(ideaId);
  const [activeSection, setActiveSection] = useState('cover');
  const [exporting, setExporting] = useState(false);

  const sections = [
    { id: 'cover', title: 'Cover Page' },
    { id: 'toc', title: 'Table of Contents' },
    { id: 'executive-summary', title: 'Executive Summary' },
    { id: 'swot', title: 'SWOT Analysis' },
    { id: 'business-model-canvas', title: 'Business Model Canvas' },
    { id: 'lean-canvas', title: 'Lean Canvas' },
    { id: 'value-proposition', title: 'Value Proposition Canvas' },
    { id: 'porters', title: "Porter's Five Forces" },
    { id: 'blue-ocean', title: 'Blue Ocean Strategy' },
    { id: 'market-research', title: 'Market Research' },
    { id: 'competitive-analysis', title: 'Competitive Analysis' },
    { id: 'gtm-strategy', title: 'Go-to-Market Strategy' },
    { id: 'unit-economics', title: 'Unit Economics' },
    { id: 'risk-matrix', title: 'Risk Assessment' },
  ];

  const generatePDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 40;

      // Cover Page
      doc.setFontSize(24);
      doc.text('Business Research Document', 105, yPos, { align: 'center' });
      yPos += 20;
      doc.setFontSize(18);
      doc.text(ideaTitle, 105, yPos, { align: 'center' });
      yPos += 15;
      doc.setFontSize(12);
      doc.text(new Date().toLocaleDateString(), 105, yPos, { align: 'center' });

      doc.addPage();
      yPos = 20;

      // Executive Summary
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const summary = data.executive_summary?.content || 'No content yet';
      const summaryLines = doc.splitTextToSize(summary, 170);
      doc.text(summaryLines, 20, yPos);

      doc.save(`${ideaTitle.replace(/\s+/g, '_')}_Business_Research.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateWord = async () => {
    setExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'Business Research Document',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: ideaTitle,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: new Date().toLocaleDateString(),
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 }
            }),
            new Paragraph({
              text: 'Executive Summary',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: data.executive_summary?.content || 'No content yet',
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: 'SWOT Analysis',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: `Strengths: ${data.swot?.strengths || 'Not filled'}`,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Weaknesses: ${data.swot?.weaknesses || 'Not filled'}`,
              spacing: { after: 200 }
            }),
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${ideaTitle.replace(/\s+/g, '_')}_Business_Research.docx`);
    } catch (error) {
      console.error('Error generating Word document:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background">
      <ResearchReportSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionClick={setActiveSection}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[850px] mx-auto bg-background shadow-lg my-8 min-h-screen">
          {/* Cover Page */}
          <div id="cover" className="p-16 border-b bg-gradient-to-br from-primary/5 to-primary/10">
            <h1 className="text-5xl font-bold mb-6">{ideaTitle}</h1>
            <p className="text-xl text-muted-foreground mb-8">{ideaDescription}</p>
            <div className="flex gap-4 mt-12">
              <Button onClick={generatePDF} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export PDF
              </Button>
              <Button onClick={generateWord} variant="outline" disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Export Word
              </Button>
            </div>
          </div>

          {/* Table of Contents */}
          <div id="toc" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Table of Contents</h2>
            <div className="space-y-2">
              {sections.slice(2).map((section, idx) => (
                <div key={section.id} className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground/80">{idx + 1}. {section.title}</span>
                  <span className="text-muted-foreground">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div id="executive-summary" className="p-12 border-b">
            <EditableSection
              title="Executive Summary"
              content={data.executive_summary?.content || ''}
              isEdited={data.executive_summary?.edited_by_user}
              onSave={(content) => saveData({ executive_summary: { content, edited_by_user: true } })}
              placeholder="Provide a comprehensive overview of your business idea..."
            />
          </div>

          {/* SWOT Analysis */}
          <div id="swot" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">SWOT Analysis</h2>
            <SWOTAnalysis
              data={data.swot}
              onChange={(swotData) => saveData({ swot: swotData })}
            />
          </div>

          {/* Business Model Canvas */}
          <div id="business-model-canvas" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Business Model Canvas</h2>
            <BusinessModelCanvas
              data={data.business_model_canvas}
              onChange={(canvasData) => saveData({ business_model_canvas: canvasData })}
            />
          </div>

          {/* Lean Canvas */}
          <div id="lean-canvas" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Lean Canvas</h2>
            <LeanCanvas
              data={data.lean_canvas}
              onChange={(leanData) => saveData({ lean_canvas: leanData })}
            />
          </div>

          {/* Value Proposition Canvas */}
          <div id="value-proposition" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Value Proposition Canvas</h2>
            <ValuePropositionCanvas
              data={data.value_proposition_canvas}
              onChange={(vpData) => saveData({ value_proposition_canvas: vpData })}
            />
          </div>

          {/* Porter's Five Forces */}
          <div id="porters" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Porter's Five Forces</h2>
            <PortersFiveForces
              data={data.porters_five_forces}
              onChange={(portersData) => saveData({ porters_five_forces: portersData })}
            />
          </div>

          {/* Blue Ocean Strategy */}
          <div id="blue-ocean" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Blue Ocean Strategy</h2>
            <BlueOceanCanvas
              data={data.blue_ocean_canvas}
              onChange={(blueOceanData) => saveData({ blue_ocean_canvas: blueOceanData })}
            />
          </div>

          {/* Market Research */}
          <div id="market-research" className="p-12 border-b">
            <EditableSection
              title="Market Research"
              content={data.market_research?.content || ''}
              isEdited={data.market_research?.edited_by_user}
              onSave={(content) => saveData({ market_research: { content, edited_by_user: true } })}
              placeholder="Describe your market size, trends, and opportunities..."
            />
          </div>

          {/* Competitive Analysis */}
          <div id="competitive-analysis" className="p-12 border-b">
            <EditableSection
              title="Competitive Analysis"
              content={data.competitive_analysis?.content || ''}
              isEdited={data.competitive_analysis?.edited_by_user}
              onSave={(content) => saveData({ competitive_analysis: { content, edited_by_user: true } })}
              placeholder="Analyze your competitors and competitive landscape..."
            />
          </div>

          {/* Go-to-Market Strategy */}
          <div id="gtm-strategy" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Go-to-Market Strategy</h2>
            <GTMStrategy
              data={data.gtm_strategy}
              onChange={(gtmData) => saveData({ gtm_strategy: gtmData })}
            />
          </div>

          {/* Unit Economics */}
          <div id="unit-economics" className="p-12 border-b">
            <h2 className="text-3xl font-bold mb-6">Unit Economics</h2>
            <UnitEconomics
              data={data.unit_economics}
              onChange={(ueData) => saveData({ unit_economics: ueData })}
            />
          </div>

          {/* Risk Assessment */}
          <div id="risk-matrix" className="p-12">
            <h2 className="text-3xl font-bold mb-6">Risk Assessment</h2>
            <RiskMatrix
              data={data.risk_matrix}
              onChange={(riskData) => saveData({ risk_matrix: riskData })}
            />
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};
