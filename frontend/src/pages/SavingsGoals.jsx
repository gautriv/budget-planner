import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Trash2, 
  Edit2,
  CalendarIcon,
  Target,
  TrendingUp,
  Sparkles,
  PiggyBank,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, getTransactions } from '@/lib/api';
import { formatCurrency, calculatePercentage, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SAVINGS_CATEGORY_ID = 'cat_savings';

const GOAL_IMAGES = [
  { label: 'Vacation', url: 'https://images.unsplash.com/photo-1673964566152-2aee6bc89929?w=400&h=200&fit=crop' },
  { label: 'Car', url: 'https://images.unsplash.com/photo-1583921481494-76508502ef48?w=400&h=200&fit=crop' },
  { label: 'House', url: 'https://images.unsplash.com/photo-1720442617080-c25f9955194c?w=400&h=200&fit=crop' },
  { label: 'Emergency', url: 'https://images.unsplash.com/photo-1755369355222-8146801ccf90?w=400&h=200&fit=crop' },
];

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [savingsTransactions, setSavingsTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [addAmountDialogKey, setAddAmountDialogKey] = useState(0);
  const [editingGoal, setEditingGoal] = useState(null);
  const [addAmountDialogOpen, setAddAmountDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: null,
    color: '#10b981',
    image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, transactionsRes] = await Promise.all([
        getSavingsGoals(),
        getTransactions()
      ]);
      setGoals(goalsRes.data);
      
      // Filter savings transactions
      const savings = transactionsRes.data.filter(t => t.category_id === SAVINGS_CATEGORY_ID);
      setSavingsTransactions(savings);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch savings data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total savings from transactions
  const totalSavingsFromTransactions = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate savings already in goals
  const totalInGoals = goals.reduce((sum, g) => sum + g.current_amount, 0);

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: null,
      color: '#10b981',
      image_url: '',
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      color: goal.color,
      image_url: goal.image_url || '',
    });
    setDialogOpen(true);
  };

  const openAddAmountDialog = (goal) => {
    setSelectedGoal(goal);
    setAddAmount('');
    setAddAmountDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const data = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : null,
        color: formData.color,
        image_url: formData.image_url,
      };

      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, data);
        toast.success('Goal updated');
      } else {
        await createSavingsGoal(data);
        toast.success('Goal created');
      }
      
      setDatePickerOpen(false);
      setDialogOpen(false);
      setDialogKey(prev => prev + 1);
      setEditingGoal(null);
      setFormData({
        name: '',
        target_amount: '',
        current_amount: '',
        deadline: null,
        color: '#10b981',
        image_url: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const handleAddAmount = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const newAmount = selectedGoal.current_amount + parseFloat(addAmount);
      await updateSavingsGoal(selectedGoal.id, { current_amount: newAmount });
      toast.success(`Added ${formatCurrency(parseFloat(addAmount))} to ${selectedGoal.name}`);
      setAddAmountDialogOpen(false);
      setAddAmountDialogKey(prev => prev + 1);
      setAddAmount('');
      setSelectedGoal(null);
      fetchData();
    } catch (error) {
      console.error('Error adding amount:', error);
      toast.error('Failed to add amount');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    
    try {
      await deleteSavingsGoal(id);
      toast.success('Goal deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = calculatePercentage(totalSaved, totalTarget);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="savings-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track progress towards your dreams</p>
        </div>
        <Dialog key={dialogKey} open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
          <DialogTrigger asChild>
            <Button data-testid="add-goal-btn" className="btn-primary bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  data-testid="goal-name-input"
                  placeholder="e.g., Dream Vacation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <Input
                  id="target"
                  data-testid="goal-target-input"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="font-mono"
                  required
                />
              </div>

              {/* Current Amount */}
              <div className="space-y-2">
                <Label htmlFor="current">Current Amount</Label>
                <Input
                  id="current"
                  data-testid="goal-current-input"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="font-mono"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Target Date (Optional)</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-testid="goal-deadline-btn"
                      className={cn("w-full justify-start text-left font-normal", !formData.deadline && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => {
                        setFormData({ ...formData, deadline: date });
                        setDatePickerOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Image Selection */}
              <div className="space-y-2">
                <Label>Goal Image (Optional)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: img.url })}
                      className={cn(
                        "aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        formData.image_url === img.url ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
                      )}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        formData.color === color && "ring-2 ring-offset-2 ring-offset-background scale-110"
                      )}
                      style={{ backgroundColor: color, boxShadow: formData.color === color ? `0 0 0 2px ${color}40` : 'none' }}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" data-testid="submit-goal-btn" className="w-full btn-primary bg-primary text-primary-foreground">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Savings Summary - Always show if there are savings transactions */}
      {totalSavingsFromTransactions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/20">
                    <PiggyBank className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Savings (from transactions)</p>
                    <p className="font-mono text-4xl font-bold text-primary">{formatCurrency(totalSavingsFromTransactions)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {savingsTransactions.length} saving{savingsTransactions.length !== 1 ? 's' : ''} recorded
                    </p>
                  </div>
                </div>
                {goals.length === 0 && (
                  <div className="sm:text-right">
                    <p className="text-sm text-muted-foreground mb-2">Create goals to track your progress</p>
                    <Button 
                      onClick={() => {
                        resetForm();
                        setTimeout(() => setDialogOpen(true), 0);
                      }}
                      className="bg-primary text-primary-foreground gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Create First Goal
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Recent savings transactions */}
              {savingsTransactions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-primary/10">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                    <Wallet className="w-3 h-3" />
                    Recent Savings
                  </p>
                  <div className="space-y-2">
                    {savingsTransactions.slice(0, 3).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{txn.description || 'Savings'}</span>
                          <span className="text-xs text-muted-foreground/60">
                            {format(new Date(txn.date), 'MMM d')}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-primary">
                          +{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    ))}
                    {savingsTransactions.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{savingsTransactions.length - 3} more transactions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <Sparkles className="absolute right-4 top-4 w-32 h-32 text-primary/5" />
          </Card>
        </motion.div>
      )}

      {/* Overall Progress - Goals */}
      {goals.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Goals Progress</p>
                <p className="font-mono text-3xl font-semibold">{formatCurrency(totalSaved)}</p>
                <p className="text-sm text-muted-foreground">of {formatCurrency(totalTarget)} target</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-mono text-2xl font-semibold">{overallProgress}%</span>
                </div>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => {
            const progress = calculatePercentage(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  data-testid={`goal-card-${goal.id}`}
                  className="glass-card overflow-hidden group"
                >
                  {goal.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={goal.image_url} 
                        alt={goal.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardContent className={cn("p-6", !goal.image_url && "pt-6")}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${goal.color}20` }}
                        >
                          <Target className="w-5 h-5" style={{ color: goal.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">
                              Target: {format(new Date(goal.deadline), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`edit-goal-${goal.id}`}
                          onClick={() => openEditDialog(goal)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`delete-goal-${goal.id}`}
                          onClick={() => handleDelete(goal.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="font-mono text-2xl font-semibold">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-muted-foreground text-sm">of {formatCurrency(goal.target_amount)}</span>
                      </div>
                      
                      <Progress 
                        value={progress} 
                        className="h-3"
                        style={{ 
                          '--progress-background': `${goal.color}20`,
                          '--progress-foreground': goal.color 
                        }}
                      />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {remaining > 0 ? `${formatCurrency(remaining)} to go` : 'Goal reached!'}
                        </span>
                        <span className="font-medium" style={{ color: goal.color }}>
                          {progress}%
                        </span>
                      </div>

                      {progress < 100 && (
                        <Button
                          variant="outline"
                          data-testid={`add-to-goal-${goal.id}`}
                          onClick={() => openAddAmountDialog(goal)}
                          className="w-full mt-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Money
                        </Button>
                      )}

                      {progress >= 100 && (
                        <div className="flex items-center justify-center gap-2 py-2 text-primary">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">Congratulations!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        totalSavingsFromTransactions === 0 && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Target className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">No savings goals yet</p>
              <p className="text-sm">Start saving towards your dreams</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Add Amount Dialog */}
      <Dialog key={addAmountDialogKey} open={addAmountDialogOpen} onOpenChange={setAddAmountDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Add to {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="addAmount">Amount to Add</Label>
              <Input
                id="addAmount"
                data-testid="add-amount-input"
                type="number"
                step="0.01"
                placeholder="100"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="font-mono text-lg"
              />
            </div>
            <Button 
              onClick={handleAddAmount} 
              data-testid="confirm-add-amount-btn"
              className="w-full btn-primary bg-primary text-primary-foreground"
            >
              Add {addAmount && formatCurrency(parseFloat(addAmount) || 0)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
