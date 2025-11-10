import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, FileJson, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logError } from "@/lib/errorTracking";

interface ExportData {
  tokenTransactions: any[];
  aiRequests: any[];
  projects: any[];
  profile: any;
}

export default function AnalyticsExport() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchExportData = async (): Promise<ExportData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [profile, transactions, requests, projects] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("token_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("ai_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profile.error) throw profile.error;

      return {
        profile: profile.data,
        tokenTransactions: transactions.data || [],
        aiRequests: requests.data || [],
        projects: projects.data || [],
      };
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error fetching export data'), { context: 'fetchExportData' });
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
      return null;
    }
  };

  const exportToCSV = async () => {
    setLoading(true);
    const data = await fetchExportData();
    if (!data) {
      setLoading(false);
      return;
    }

    // Create CSV content
    let csv = "Analytics Export - " + format(new Date(), "yyyy-MM-dd HH:mm:ss") + "\n\n";

    // Profile Summary
    csv += "Profile Summary\n";
    csv += `Total Tokens,${data.profile.total_tokens}\n`;
    csv += `Tokens Used,${data.profile.tokens_used}\n`;
    csv += `Token Balance,${data.profile.token_balance}\n\n`;

    // Token Transactions
    csv += "Token Transactions\n";
    csv += "Date,Type,Amount,Balance After,Description\n";
    data.tokenTransactions.forEach(t => {
      csv += `${format(new Date(t.created_at), "yyyy-MM-dd HH:mm")},${t.transaction_type},${t.amount},${t.balance_after},"${t.description || ""}"\n`;
    });
    csv += "\n";

    // AI Requests
    csv += "AI Requests\n";
    csv += "Date,Type,Agent,Tokens Used,Success,Error\n";
    data.aiRequests.forEach(r => {
      csv += `${format(new Date(r.created_at), "yyyy-MM-dd HH:mm")},${r.request_type},${r.ai_agent},${r.tokens_used},${r.success},"${r.error_message || ""}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setLoading(false);
    setOpen(false);
    toast({
      title: "Export Complete",
      description: "CSV file downloaded successfully",
    });
  };

  const exportToJSON = async () => {
    setLoading(true);
    const data = await fetchExportData();
    if (!data) {
      setLoading(false);
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: {
        totalTokens: data.profile.total_tokens,
        tokensUsed: data.profile.tokens_used,
        tokenBalance: data.profile.token_balance,
      },
      tokenTransactions: data.tokenTransactions,
      aiRequests: data.aiRequests,
      projects: data.projects.map(p => ({
        id: p.id,
        name: p.name,
        currentPhase: p.current_phase,
        progress: p.progress_percentage,
        createdAt: p.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    setLoading(false);
    setOpen(false);
    toast({
      title: "Export Complete",
      description: "JSON file downloaded successfully",
    });
  };

  const exportToPDF = async () => {
    setLoading(true);
    const data = await fetchExportData();
    if (!data) {
      setLoading(false);
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(20);
    doc.text("Analytics Export Report", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(format(new Date(), "MMMM dd, yyyy HH:mm:ss"), pageWidth / 2, 28, { align: "center" });

    // Profile Summary
    doc.setFontSize(14);
    doc.text("Profile Summary", 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Tokens: ${data.profile.total_tokens.toLocaleString()}`, 14, 48);
    doc.text(`Tokens Used: ${data.profile.tokens_used.toLocaleString()}`, 14, 54);
    doc.text(`Token Balance: ${data.profile.token_balance.toLocaleString()}`, 14, 60);

    // Token Transactions Table
    const transactionRows = data.tokenTransactions.slice(0, 20).map(t => [
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
      t.transaction_type,
      t.amount.toString(),
      t.balance_after.toString(),
      t.description || "",
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Type", "Amount", "Balance", "Description"]],
      body: transactionRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    // AI Requests Table
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(14);
    doc.text("Recent AI Requests", 14, finalY + 15);

    const requestRows = data.aiRequests.slice(0, 15).map(r => [
      format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
      r.request_type,
      r.ai_agent,
      r.tokens_used.toString(),
      r.success ? "Yes" : "No",
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Date", "Type", "Agent", "Tokens", "Success"]],
      body: requestRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`analytics-export-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    setLoading(false);
    setOpen(false);
    toast({
      title: "Export Complete",
      description: "PDF file downloaded successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Analytics Data</DialogTitle>
          <DialogDescription>
            Download your analytics data in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-4"
            onClick={exportToCSV}
            disabled={loading}
          >
            <Table className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold">Export as CSV</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet-friendly format for Excel or Google Sheets
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-4"
            onClick={exportToJSON}
            disabled={loading}
          >
            <FileJson className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold">Export as JSON</div>
              <div className="text-xs text-muted-foreground">
                Machine-readable format for developers and integrations
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-4"
            onClick={exportToPDF}
            disabled={loading}
          >
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold">Export as PDF</div>
              <div className="text-xs text-muted-foreground">
                Professional report format for presentations and archiving
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
