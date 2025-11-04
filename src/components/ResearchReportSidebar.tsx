import { useState, useEffect } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface ResearchReportSidebarProps {
  sections: SidebarSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export const ResearchReportSidebar = ({ 
  sections, 
  activeSection, 
  onSectionClick 
}: ResearchReportSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "overview", "market", "competitive", "strategic"
  ]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="w-64 border-r border-border bg-card h-full sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Research Report</h3>
        </div>
        <p className="text-xs text-muted-foreground">Navigate sections</p>
      </div>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm font-medium px-2 py-1.5 h-auto",
                  activeSection === section.id && "bg-muted text-primary"
                )}
                onClick={() => {
                  if (section.subsections) {
                    toggleSection(section.id);
                  } else {
                    onSectionClick(section.id);
                  }
                }}
              >
                {section.subsections && (
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 mr-1 transition-transform",
                      expandedSections.includes(section.id) && "rotate-90"
                    )}
                  />
                )}
                <span className="truncate">{section.title}</span>
              </Button>

              {section.subsections && expandedSections.includes(section.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.subsections.map((subsection) => (
                    <Button
                      key={subsection.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm px-2 py-1 h-auto",
                        activeSection === subsection.id && "bg-muted text-primary font-medium"
                      )}
                      onClick={() => onSectionClick(subsection.id)}
                    >
                      <span className="truncate">{subsection.title}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};