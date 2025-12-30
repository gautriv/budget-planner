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
import { CalendarIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { createTransaction, updateTransaction } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CategoryIcon from '@/components/CategoryIcon';
import { format } from 'date-fns';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast.error('Please fill all required fields');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const data = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: formData.category_id,
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd'),
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Transaction updated');
      } else {
        await createTransaction(data);
        toast.success('Transaction added');
      }
      
      // Close and notify parent
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className="w-full btn-primary bg-primary text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Add Transaction')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
