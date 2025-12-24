import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ClipboardList, User, FileText, CreditCard, Settings, Shield } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const entityIcons: Record<string, any> = {
  user: User,
  idea: FileText,
  project: FileText,
  payment: CreditCard,
  config: Settings,
  role: Shield,
};

const actionColors: Record<string, string> = {
  create: "bg-green-500/20 text-green-400 border-green-500/30",
  update: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delete: "bg-red-500/20 text-red-400 border-red-500/30",
  suspend: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  activate: "bg-green-500/20 text-green-400 border-green-500/30",
};

const AdminAuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", entityFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.entity_id?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <SEOHead title="Audit Logs | Admin | Codilla.ai" description="View admin activity logs" />
      <AdminLayout title="Audit Logs" description="Track all administrative actions for security and compliance">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="config">Config</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="suspend">Suspend</SelectItem>
              <SelectItem value="activate">Activate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLogs?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.map((log) => {
                    const EntityIcon = entityIcons[log.entity_type] || FileText;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={actionColors[log.action] || ""}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EntityIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.entity_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.new_values && (
                            <span className="text-xs text-muted-foreground truncate block">
                              {JSON.stringify(log.new_values).slice(0, 50)}...
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminAuditLogs;