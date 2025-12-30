import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { 
  Target, 
  Plus, 
  Sparkles, 
  PiggyBank,
  ArrowRight,
  Check,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { getSavingsGoals, createSavingsGoal } from '@/lib/api';
import { formatCurrency, calculatePercentage, cn } from '@/lib/utils';

const QUICK_GOAL_PRESETS = [
  { name: 'Emergency Fund', color: '#ef4444', icon: '🛡️' },
  { name: 'Vacation', color: '#3b82f6', icon: '✈️' },
  { name: 'New Phone', color: '#8b5cf6', icon: '📱' },
  { name: 'Car', color: '#f59e0b', icon: '🚗' },
];

export default function SavingsGoalSelector({ 
  open, 
  onOpenChange, 
  amount,
  onGoalSelected,
  onSkip 
}) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#10b981');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGoals();
      setSelectedGoalId(null);
      setShowNewGoalForm(false);
    }
  }, [open]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await getSavingsGoals();
      setGoals(res.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoal = (goalId) => {
    setSelectedGoalId(goalId);
  };

  const handleConfirm = () => {
    const selectedGoal = goals.find(g => g.id === selectedGoalId);
    onGoalSelected(selectedGoal);
    onOpenChange(false);
  };

  const handleCreateQuickGoal = async (preset) => {
    setIsCreating(true);
    try {
      const goalData = {
        name: preset.name,
        target_amount: amount * 10, // Default target: 10x the current amount
        current_amount: 0,
        color: preset.color,
      };
      const res = await createSavingsGoal(goalData);
      await fetchGoals();
      setSelectedGoalId(res.data.id);
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    
    setIsCreating(true);
    try {
      const goalData = {
        name: newGoalName,
        target_amount: parseFloat(newGoalTarget),
        current_amount: 0,
        color: newGoalColor,
      };
      const res = await createSavingsGoal(goalData);
      await fetchGoals();
      setSelectedGoalId(res.data.id);
      setShowNewGoalForm(false);
      setNewGoalName('');
      setNewGoalTarget('');
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGeneralSavings = () => {
    onGoalSelected(null); // null means general savings
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Where are you saving?</SheetTitle>
              <SheetDescription>
                Link this {formatCurrency(amount)} to a savings goal
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)] pb-4">
          {/* Amount being saved */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
          >
            <div className="relative z-10">
              <p className="text-sm text-muted-foreground mb-1">Amount to save</p>
              <p className="font-mono text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
            </div>
            <Sparkles className="absolute right-4 top-4 w-24 h-24 text-primary/10" />
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading goals...</div>
            </div>
          ) : (
            <>
              {/* Existing Goals */}
              {goals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Your Savings Goals
                  </h3>
                  <div className="grid gap-3">
                    {goals.map((goal, index) => {
                      const progress = calculatePercentage(goal.current_amount, goal.target_amount);
                      const isSelected = selectedGoalId === goal.id;
                      const newProgress = calculatePercentage(goal.current_amount + amount, goal.target_amount);
                      
                      return (
                        <motion.button
                          key={goal.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectGoal(goal.id)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                              : "border-border hover:border-primary/50 hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${goal.color}20` }}
                              >
                                <Target className="w-5 h-5" style={{ color: goal.color }} />
                              </div>
                              <div>
                                <p className="font-medium">{goal.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Current: {progress}%</span>
                              {isSelected && (
                                <motion.span 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-primary font-medium"
                                >
                                  After: {Math.min(newProgress, 100)}%
                                </motion.span>
                              )}
                            </div>
                            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${progress}%`,
                                  backgroundColor: goal.color 
                                }}
                              />
                              {isSelected && (
                                <motion.div 
                                  initial={{ width: `${progress}%` }}
                                  animate={{ width: `${Math.min(newProgress, 100)}%` }}
                                  className="absolute inset-y-0 left-0 rounded-full"
                                  style={{ 
                                    backgroundColor: goal.color,
                                    opacity: 0.5
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {isSelected && newProgress >= 100 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 flex items-center gap-2 text-primary text-sm"
                            >
                              <Sparkles className="w-4 h-4" />
                              This will complete your goal! 🎉
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Create Goals */}
              {!showNewGoalForm && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Goal
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_GOAL_PRESETS.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        className="h-auto py-3 justify-start gap-2"
                        onClick={() => handleCreateQuickGoal(preset)}
                        disabled={isCreating}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <span className="text-sm">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full text-primary"
                    onClick={() => setShowNewGoalForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Custom Goal
                  </Button>
                </div>
              )}

              {/* Custom Goal Form */}
              <AnimatePresence>
                {showNewGoalForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border bg-card space-y-4">
                      <div className="space-y-2">
                        <Label>Goal Name</Label>
                        <Input
                          placeholder="e.g., New Laptop"
                          value={newGoalName}
                          onChange={(e) => setNewGoalName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Target Amount</Label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={newGoalTarget}
                          onChange={(e) => setNewGoalTarget(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewGoalColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full transition-transform",
                                newGoalColor === color && "ring-2 ring-offset-2 ring-offset-background scale-110"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowNewGoalForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-primary text-primary-foreground"
                          onClick={handleCreateNewGoal}
                          disabled={isCreating || !newGoalName || !newGoalTarget}
                        >
                          Create Goal
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* General Savings Option */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                  onClick={handleGeneralSavings}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">General Savings</p>
                      <p className="text-xs text-muted-foreground">Don't link to any goal</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <Button
            className="w-full h-12 text-base bg-primary text-primary-foreground gap-2"
            disabled={!selectedGoalId}
            onClick={handleConfirm}
          >
            {selectedGoalId ? (
              <>
                <TrendingUp className="w-5 h-5" />
                Save to Goal
              </>
            ) : (
              'Select a goal'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

