import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, User, Mail, Calendar, Coins, 
  MoreHorizontal, Ban, UserCheck, Minus, Plus 
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  token_balance: number;
  tokens_used: number;
  created_at: string;
  last_active_at: string | null;
  status: string;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 20;

  const { data: users = [], isLoading: usersLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, email, full_name, token_balance, tokens_used, created_at, last_active_at, status")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        toast.error("Failed to load users");
        throw error;
      }
      return data as UserProfile[];
    },
  });

  const handleAdjustTokens = async () => {
    if (!selectedUser || !tokenAmount) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-adjust-tokens', {
        body: {
          targetUserId: selectedUser.id,
          amount: parseInt(tokenAmount),
          reason: tokenReason || undefined,
        },
      });

      if (response.error) throw response.error;
      
      toast.success(`Tokens adjusted for ${selectedUser.email}`);
      setTokenDialogOpen(false);
      setTokenAmount("");
      setTokenReason("");
      setSelectedUser(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedUser || !newStatus) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-suspend-user', {
        body: {
          targetUserId: selectedUser.id,
          status: newStatus,
        },
      });

      if (response.error) throw response.error;
      
      toast.success(`User status changed to ${newStatus}`);
      setStatusDialogOpen(false);
      setNewStatus("");
      setSelectedUser(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to change user status");
    } finally {
      setIsLoading(false);
    }
  };

  const openTokenDialog = (user: UserProfile, action: 'add' | 'subtract') => {
    setSelectedUser(user);
    setTokenAmount(action === 'subtract' ? '-' : '');
    setTokenDialogOpen(true);
  };

  const openStatusDialog = (user: UserProfile, status: string) => {
    setSelectedUser(user);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'suspended':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">Suspended</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="default" className="bg-green-500/10 text-green-500">Active</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <SEOHead title="User Management | Admin | Codilla.ai" description="Manage platform users" />
      <AdminLayout title="User Management" description="View and manage platform users">
        <Card className="p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || "Unnamed"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span>{user.token_balance.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm">
                          ({user.tokens_used.toLocaleString()} used)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.last_active_at &&
                          new Date(user.last_active_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {formatDate(user.last_active_at)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openTokenDialog(user, 'add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tokens
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTokenDialog(user, 'subtract')}>
                            <Minus className="h-4 w-4 mr-2" />
                            Subtract Tokens
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'active' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(user, 'active')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(user, 'suspended')}>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'banned' && (
                            <DropdownMenuItem 
                              onClick={() => openStatusDialog(user, 'banned')}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {users.length >= pageSize && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={users.length < pageSize}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Token Adjustment Dialog */}
        <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Tokens</DialogTitle>
              <DialogDescription>
                Adjust token balance for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (use negative for subtraction)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="e.g., 1000 or -500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  placeholder="e.g., Bonus for early adopter"
                />
              </div>
              {selectedUser && (
                <p className="text-sm text-muted-foreground">
                  Current balance: {selectedUser.token_balance.toLocaleString()} tokens
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdjustTokens} disabled={isLoading || !tokenAmount}>
                {isLoading ? "Processing..." : "Adjust Tokens"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newStatus === 'banned' ? 'Ban User' : newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
              </DialogTitle>
              <DialogDescription>
                {newStatus === 'banned' 
                  ? `Are you sure you want to permanently ban ${selectedUser?.email}?`
                  : newStatus === 'suspended'
                  ? `Are you sure you want to suspend ${selectedUser?.email}?`
                  : `Are you sure you want to reactivate ${selectedUser?.email}?`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleChangeStatus} 
                disabled={isLoading}
                variant={newStatus === 'banned' ? 'destructive' : 'default'}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
