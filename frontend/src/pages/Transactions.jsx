import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { getTransactions, deleteTransaction, getCategories } from '@/lib/api';
import { formatCurrency, formatDate, getCurrentMonth, getMonthOptions, cn } from '@/lib/utils';
import { toast } from 'sonner';
import CategoryIcon from '@/components/CategoryIcon';
import TransactionDialog from '@/components/TransactionDialog';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const monthOptions = getMonthOptions();

  useEffect(() => {
    fetchData();
  }, [selectedMonth, typeFilter]);

  const fetchData = async () => {
    try {
      const params = { month: selectedMonth };
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const [transactionsRes, categoriesRes] = await Promise.all([
        getTransactions(params),
        getCategories()
      ]);
      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const openAddDialog = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const openEditDialog = (txn) => {
    setEditingTransaction(txn);
    setDialogOpen(true);
  };

  const handleDialogClose = (open) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const handleSuccess = () => {
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const totals = transactions.reduce(
    (acc, txn) => {
      if (txn.type === 'income') acc.income += txn.amount;
      else acc.expenses += txn.amount;
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="transactions-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Track your income and expenses</p>
        </div>
        <Button 
          data-testid="add-transaction-btn" 
          onClick={openAddDialog}
          className="btn-primary bg-primary text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        categories={categories}
        editingTransaction={editingTransaction}
        onSuccess={handleSuccess}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger data-testid="month-filter" className="w-full sm:w-[200px]">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger data-testid="type-filter" className="w-full sm:w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p data-testid="total-income" className="font-mono text-xl font-semibold text-primary">
                  +{formatCurrency(totals.income)}
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p data-testid="total-expenses" className="font-mono text-xl font-semibold text-destructive">
                  -{formatCurrency(totals.expenses)}
                </p>
              </div>
              <ArrowDownRight className="w-5 h-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p data-testid="net-amount" className={cn("font-mono text-xl font-semibold", totals.income - totals.expenses >= 0 ? "text-primary" : "text-destructive")}>
                  {formatCurrency(totals.income - totals.expenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">{transactions.length} Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-1">
              <AnimatePresence>
                {transactions.map((txn, index) => {
                  const category = categoryMap[txn.category_id];
                  return (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.02 }}
                      data-testid={`transaction-row-${txn.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          <CategoryIcon name={category?.icon || 'circle'} className="w-5 h-5" style={{ color: category?.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{txn.description || category?.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(txn.date)} • {category?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("font-mono text-lg font-medium", txn.type === 'income' ? "text-primary" : "text-foreground")}>
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`edit-txn-${txn.id}`}
                            onClick={() => openEditDialog(txn)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`delete-txn-${txn.id}`}
                            onClick={() => handleDelete(txn.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ArrowUpRight className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">No transactions found</p>
              <p className="text-sm">Add your first transaction to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
