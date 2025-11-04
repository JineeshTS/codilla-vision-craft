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
    <div className="w-72 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base">Research Report</h3>
            <p className="text-xs text-muted-foreground">Table of Contents</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {sections.map((section, idx) => (
            <div key={section.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm font-medium px-3 py-2 h-auto rounded-md",
                  activeSection === section.id && "bg-primary/10 text-primary hover:bg-primary/15",
                  !activeSection.includes(section.id) && "hover:bg-muted"
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
                      "w-4 h-4 mr-2 transition-transform shrink-0",
                      expandedSections.includes(section.id) && "rotate-90"
                    )}
                  />
                )}
                <span className="truncate text-left flex-1">{section.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{idx + 1}</span>
              </Button>

              {section.subsections && expandedSections.includes(section.id) && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
                  {section.subsections.map((subsection) => (
                    <Button
                      key={subsection.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-xs px-3 py-1.5 h-auto rounded-md",
                        activeSection === subsection.id && "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                        activeSection !== subsection.id && "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => onSectionClick(subsection.id)}
                    >
                      <span className="truncate text-left">{subsection.title}</span>
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