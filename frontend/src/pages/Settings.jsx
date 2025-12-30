import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2,
  Palette,
  Tags,
  Circle
} from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CategoryIcon, { ICON_OPTIONS } from '@/components/CategoryIcon';

const COLOR_OPTIONS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', 
  '#ef4444', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'
];

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'circle',
    color: '#10b981',
    type: 'expense',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'circle',
      color: '#10b981',
      type: 'expense',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await createCategory(formData);
      toast.success('Category created');
      setDialogOpen(false);
      setDialogKey(prev => prev + 1);
      setFormData({
        name: '',
        icon: 'circle',
        color: '#10b981',
        type: 'expense',
      });
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      toast.error('Cannot delete default categories');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your categories and preferences</p>
      </div>

      {/* Categories Section */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Categories
              </CardTitle>
              <CardDescription>Manage expense and income categories</CardDescription>
            </div>
            <Dialog key={dialogKey} open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
              <DialogTrigger asChild>
                <Button data-testid="add-category-btn" className="btn-primary bg-primary text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      data-testid="category-name-input"
                      placeholder="e.g., Subscriptions"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="category-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Icon */}
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={cn(
                            "p-2 rounded-lg border transition-all",
                            formData.icon === icon 
                              ? "border-primary bg-primary/10" 
                              : "border-transparent hover:bg-secondary"
                          )}
                        >
                          <CategoryIcon name={icon} className="w-5 h-5 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={cn(
                            "w-8 h-8 rounded-full transition-transform",
                            formData.color === color && "ring-2 ring-offset-2 ring-offset-background scale-110"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${formData.color}20` }}
                      >
                        <CategoryIcon 
                          name={formData.icon} 
                          className="w-5 h-5" 
                          style={{ color: formData.color }} 
                        />
                      </div>
                      <span className="font-medium">{formData.name || 'Category Name'}</span>
                    </div>
                  </div>

                  <Button type="submit" data-testid="submit-category-btn" className="w-full btn-primary bg-primary text-primary-foreground">
                    Create Category
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expense Categories */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Expense Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseCategories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  data-testid={`category-${cat.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{cat.name}</span>
                      {cat.is_default && (
                        <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                      )}
                    </div>
                  </div>
                  {!cat.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`delete-category-${cat.id}`}
                      onClick={() => handleDelete(cat.id, cat.is_default)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Income Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomeCategories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  data-testid={`category-${cat.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{cat.name}</span>
                      {cat.is_default && (
                        <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                      )}
                    </div>
                  </div>
                  {!cat.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`delete-category-${cat.id}`}
                      onClick={() => handleDelete(cat.id, cat.is_default)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            About BudgetVault
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              BudgetVault is your personal finance companion designed to help you track expenses, 
              set budgets, and achieve your savings goals.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>Expense</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span>Savings</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
