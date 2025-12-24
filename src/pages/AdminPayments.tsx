import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, Edit } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  tokens_purchased: number;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}

const transactionTypeColors: Record<string, string> = {
  purchase: "bg-green-500/20 text-green-400 border-green-500/30",
  consumption: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  refund: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  bonus: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const AdminPayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Fetch token transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-token-transactions", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("token_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") {
        query = query.eq("transaction_type", typeFilter as "purchase" | "consumption" | "refund" | "bonus");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });

  // Fetch payment transactions
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-payment-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });

  // Calculate stats
  const stats = {
    totalRevenue: payments?.filter(p => p.status === "success").reduce((sum, p) => sum + p.amount, 0) || 0,
    totalTokensSold: transactions?.filter(t => t.transaction_type === "purchase").reduce((sum, t) => sum + t.amount, 0) || 0,
    totalTokensConsumed: transactions?.filter(t => t.transaction_type === "consumption").reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0,
    pendingPayments: payments?.filter(p => p.status === "pending").length || 0,
  };

  const filteredTransactions = transactions?.filter((t) => {
    if (!searchQuery) return true;
    return t.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SEOHead title="Payments & Tokens | Admin | Codilla.ai" description="Manage payments and token transactions" />
      <AdminLayout title="Payments & Tokens" description="View transactions, manage token balances, and track revenue">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl text-green-400">₹{(stats.totalRevenue / 100).toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tokens Sold</CardDescription>
              <CardTitle className="text-2xl">{stats.totalTokensSold.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tokens Consumed</CardDescription>
              <CardTitle className="text-2xl">{stats.totalTokensConsumed.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-2xl text-yellow-400">{stats.pendingPayments}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Payment Transactions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Payment Transactions
            </CardTitle>
            <CardDescription>Razorpay payment records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{payment.razorpay_order_id}</TableCell>
                      <TableCell>₹{(payment.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>{payment.tokens_purchased.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "success" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Token Transactions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Token Transactions</CardTitle>
                <CardDescription>All token balance changes</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="consumption">Consumption</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-token-transactions"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={transactionTypeColors[transaction.transaction_type]}>
                          {transaction.amount > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={transaction.amount > 0 ? "text-green-400" : "text-red-400"}>
                        {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.balance_after.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {transaction.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminPayments;