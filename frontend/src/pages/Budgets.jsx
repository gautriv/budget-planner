import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit2,
  CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  PiggyBank
} from 'lucide-react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getCategories, getDashboardSummary } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthOptions, calculatePercentage, getProgressColor, cn } from '@/lib/utils';
import { toast } from 'sonner';
import CategoryIcon from '@/components/CategoryIcon';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    limit: '',
  });

  const monthOptions = getMonthOptions();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes, summaryRes] = await Promise.all([
        getBudgets({ month: selectedMonth }),
        getCategories(),
        getDashboardSummary(selectedMonth)
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
      
      const spendingMap = {};
      summaryRes.data.spending_breakdown?.forEach(item => {
        spendingMap[item.category_id] = item.amount;
      });
      setSpending(spendingMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const budgetedCategoryIds = new Set(budgets.map(b => b.category_id));
  const availableCategories = expenseCategories.filter(cat => !budgetedCategoryIds.has(cat.id) || editingBudget?.category_id === cat.id);

  const resetForm = () => {
    setFormData({ category_id: '', limit: '' });
    setEditingBudget(null);
  };

  const openEditDialog = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      limit: budget.limit.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.limit) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const data = {
        category_id: formData.category_id,
        limit: parseFloat(formData.limit),
        month: selectedMonth,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, { limit: data.limit });
        toast.success('Budget updated');
      } else {
        await createBudget(data);
        toast.success('Budget created');
      }
      
      setDialogOpen(false);
      setEditingBudget(null);
      setFormData({ category_id: '', limit: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await deleteBudget(id);
      toast.success('Budget deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const budgetsWithProgress = budgets.map(budget => {
    const spent = spending[budget.category_id] || 0;
    const percentage = calculatePercentage(spent, budget.limit);
    const remaining = budget.limit - spent;
    const category = categoryMap[budget.category_id];
    return { ...budget, spent, percentage, remaining, category };
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0);
  const onTrackCount = budgetsWithProgress.filter(b => b.percentage < 80).length;
  const warningCount = budgetsWithProgress.filter(b => b.percentage >= 80 && b.percentage < 100).length;
  const exceededCount = budgetsWithProgress.filter(b => b.percentage >= 100).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="budgets-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set limits and track your spending</p>
        </div>
        <Button 
          data-testid="add-budget-btn" 
          onClick={() => { setEditingBudget(null); setFormData({ category_id: '', limit: '' }); setDialogOpen(true); }}
          className="btn-primary bg-primary text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
              <DialogDescription>Set a spending limit for a category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  disabled={!!editingBudget}
                >
                  <SelectTrigger data-testid="budget-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">Monthly Limit</Label>
                <Input
                  id="limit"
                  data-testid="budget-limit-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="font-mono text-lg"
                  required
                />
              </div>

              <Button type="submit" data-testid="submit-budget-btn" className="w-full btn-primary bg-primary text-primary-foreground">
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Selector */}
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger data-testid="budget-month-filter" className="w-full sm:w-[200px]">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Budgeted</p>
            <p data-testid="total-budgeted" className="font-mono text-xl font-semibold">{formatCurrency(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p data-testid="total-spent" className="font-mono text-xl font-semibold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">On Track</p>
              <p className="font-mono text-xl font-semibold">{onTrackCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="font-mono text-xl font-semibold">{warningCount + exceededCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Grid */}
      {budgetsWithProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsWithProgress.map((budget, index) => (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                data-testid={`budget-card-${budget.id}`}
                className={cn(
                  "glass-card overflow-hidden",
                  budget.percentage >= 100 && "border-destructive/50",
                  budget.percentage >= 80 && budget.percentage < 100 && "border-amber-500/50"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${budget.category?.color}20` }}
                      >
                        <CategoryIcon 
                          name={budget.category?.icon || 'circle'} 
                          className="w-5 h-5" 
                          style={{ color: budget.category?.color }} 
                        />
                      </div>
                      <div>
                        <p className="font-medium">{budget.category?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {budget.percentage >= 100 ? 'Exceeded' : budget.percentage >= 80 ? 'Warning' : 'On Track'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`edit-budget-${budget.id}`}
                        onClick={() => openEditDialog(budget)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`delete-budget-${budget.id}`}
                        onClick={() => handleDelete(budget.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="font-mono text-2xl font-semibold">{formatCurrency(budget.spent)}</span>
                      <span className="text-muted-foreground text-sm">of {formatCurrency(budget.limit)}</span>
                    </div>
                    
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className={cn("h-3", getProgressColor(budget.percentage))}
                    />
                    
                    <div className="flex justify-between text-sm">
                      <span className={cn(
                        budget.remaining >= 0 ? "text-muted-foreground" : "text-destructive"
                      )}>
                        {budget.remaining >= 0 
                          ? `${formatCurrency(budget.remaining)} remaining`
                          : `${formatCurrency(Math.abs(budget.remaining))} over budget`
                        }
                      </span>
                      <span className={cn(
                        "font-medium",
                        budget.percentage >= 100 ? "text-destructive" : budget.percentage >= 80 ? "text-amber-500" : "text-primary"
                      )}>
                        {budget.percentage}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PiggyBank className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No budgets set</p>
            <p className="text-sm">Create budgets to track your spending limits</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
