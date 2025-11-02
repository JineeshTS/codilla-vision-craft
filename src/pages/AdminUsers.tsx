import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Coins, Mail, Calendar, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  total_tokens: number;
  tokens_used: number;
  created_at: string;
  role?: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");

  useAuthGuard();

  useEffect(() => {
    checkAdminRole();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles.map((profile) => ({
        ...profile,
        role: roles.find((r) => r.user_id === profile.id)?.role || "user",
      }));

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddTokens = async () => {
    if (!selectedUser || !tokenAmount) return;

    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update user's total tokens
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ total_tokens: selectedUser.total_tokens + amount })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("token_transactions")
        .insert({
          user_id: selectedUser.id,
          transaction_type: "bonus",
          amount: amount,
          balance_after: selectedUser.total_tokens + amount,
          description: "Admin bonus tokens",
          metadata: { admin_action: true },
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Tokens Added",
        description: `Successfully added ${amount} tokens to ${selectedUser.email}`,
      });

      setTokenAmount("");
      setDialogOpen(false);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error adding tokens:", error);
      toast({
        title: "Error",
        description: "Failed to add tokens.",
        variant: "destructive",
      });
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    const newRole = user.role === "admin" ? "user" : "admin";

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `${user.email} is now ${newRole === "admin" ? "an admin" : "a regular user"}.`,
      });

      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage all users and their accounts</p>
        </div>

        {/* Search Bar */}
        <Card className="glass-panel p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="glass-panel p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </Card>
          <Card className="glass-panel p-4">
            <p className="text-sm text-muted-foreground">Admin Users</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
          </Card>
          <Card className="glass-panel p-4">
            <p className="text-sm text-muted-foreground">Regular Users</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === "user").length}</p>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No users found matching your search." : "No users found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/10">
                      <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? (
                            <Shield className="w-3 h-3 mr-1 inline" />
                          ) : null}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-primary" />
                          <span>{(user.total_tokens - user.tokens_used).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">
                            / {user.total_tokens.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageUser(user)}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* User Management Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-panel">
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
              <DialogDescription>
                Manage {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <span className="font-medium">{selectedUser.full_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Role</span>
                    <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available Tokens</span>
                    <span className="font-medium">
                      {(selectedUser.total_tokens - selectedUser.tokens_used).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Add Tokens */}
                <div className="space-y-2">
                  <Label htmlFor="tokenAmount">Add Bonus Tokens</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tokenAmount"
                      type="number"
                      placeholder="Amount"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      min="1"
                    />
                    <Button onClick={handleAddTokens} disabled={!tokenAmount}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Toggle Role */}
                <div className="pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleToggleRole(selectedUser)}
                  >
                    {selectedUser.role === "admin" ? "Demote to User" : "Promote to Admin"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
