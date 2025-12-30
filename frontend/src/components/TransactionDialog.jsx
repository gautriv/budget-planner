import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { createTransaction, updateTransaction, updateSavingsGoal } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CategoryIcon from '@/components/CategoryIcon';
import SavingsGoalSelector from '@/components/SavingsGoalSelector';
import { format } from 'date-fns';

// Savings category ID
const SAVINGS_CATEGORY_ID = 'cat_savings';

export default function TransactionDialog({ 
  open, 
  onOpenChange, 
  categories, 
  editingTransaction, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category_id: '',
    description: '',
    date: new Date(),
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setFormData({
          amount: editingTransaction.amount.toString(),
          type: editingTransaction.type,
          category_id: editingTransaction.category_id,
          description: editingTransaction.description,
          date: new Date(editingTransaction.date),
        });
      } else {
        setFormData({
          amount: '',
          type: 'expense',
          category_id: '',
          description: '',
          date: new Date(),
        });
      }
    }
  }, [open, editingTransaction]);

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Check if selected category is Savings
  const isSavingsCategory = formData.category_id === SAVINGS_CATEGORY_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast.error('Please fill all required fields');
      return;
    }

    if (isSubmitting) return;

    // If savings category is selected and it's a new transaction, show goal selector
    if (isSavingsCategory && !editingTransaction) {
      setPendingTransaction({
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: formData.category_id,
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd'),
      });
      setShowGoalSelector(true);
      return;
    }

    // Normal transaction flow
    await submitTransaction();
  };

  const submitTransaction = async (goalId = null, goalData = null) => {
    setIsSubmitting(true);

    try {
      const data = pendingTransaction || {
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: formData.category_id,
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd'),
      };

      // Add goal reference to description if a goal is selected
      if (goalId && goalData) {
        data.description = data.description 
          ? `${data.description} [Goal: ${goalData.name}]`
          : `Saving for: ${goalData.name}`;
        data.savings_goal_id = goalId;
      }

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Transaction updated');
      } else {
        await createTransaction(data);
        
        // If goal is selected, update the goal's current_amount
        if (goalId && goalData) {
          const newAmount = goalData.current_amount + data.amount;
          await updateSavingsGoal(goalId, { current_amount: newAmount });
          toast.success(`${formatCurrency(data.amount)} saved to ${goalData.name}! 🎉`, {
            description: `Progress: ${formatCurrency(newAmount)} / ${formatCurrency(goalData.target_amount)}`
          });
        } else if (isSavingsCategory) {
          toast.success('Savings recorded');
        } else {
          toast.success('Transaction added');
        }
      }
      
      // Reset and close
      setPendingTransaction(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSelected = async (goal) => {
    if (goal) {
      await submitTransaction(goal.id, goal);
    } else {
      // General savings - no goal linked
      await submitTransaction();
    }
  };

  const handleGoalSelectorClose = (isOpen) => {
    if (!isOpen) {
      setShowGoalSelector(false);
      setPendingTransaction(null);
    }
  };

  // Format currency for toast
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? 'Modify your transaction details below.' : 'Enter the details for your new transaction.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                data-testid="type-expense-btn"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                className={cn("flex-1", formData.type === 'expense' && "bg-destructive hover:bg-destructive/90")}
                onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Expense
              </Button>
              <Button
                type="button"
                data-testid="type-income-btn"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                className={cn("flex-1", formData.type === 'income' && "bg-primary hover:bg-primary/90")}
                onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Income
              </Button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                data-testid="amount-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="font-mono text-lg"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                        {cat.name}
                        {cat.id === SAVINGS_CATEGORY_ID && (
                          <span className="ml-1 text-xs text-primary">• Links to Goals</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Savings category hint */}
              {isSavingsCategory && formData.amount && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                  <PiggyBank className="w-4 h-4 flex-shrink-0" />
                  <span>You'll be able to link this to a savings goal</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                data-testid="description-input"
                placeholder="What was this for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-testid="date-picker-btn"
                    className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      setFormData({ ...formData, date: date || new Date() });
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              type="submit" 
              data-testid="submit-transaction-btn" 
              className={cn(
                "w-full",
                isSavingsCategory && formData.amount
                  ? "bg-primary text-primary-foreground"
                  : "btn-primary bg-primary text-primary-foreground"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (
                isSavingsCategory && formData.amount && !editingTransaction
                  ? 'Continue → Select Goal'
                  : (editingTransaction ? 'Update Transaction' : 'Add Transaction')
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Savings Goal Selector */}
      <SavingsGoalSelector
        open={showGoalSelector}
        onOpenChange={handleGoalSelectorClose}
        amount={parseFloat(formData.amount) || 0}
        onGoalSelected={handleGoalSelected}
        onSkip={() => submitTransaction()}
      />
    </>
  );
}
