import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
} from 'lucide-react';
import { getDashboardSummary, getTransactions, getCategories, getBudgets } from '@/lib/api';
import { formatCurrency, getCurrentMonth, formatMonth, formatDate, calculatePercentage, getProgressColor } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import CategoryIcon from '@/components/CategoryIcon';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentMonth = getCurrentMonth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, transactionsRes, categoriesRes, budgetsRes] = await Promise.all([
        getDashboardSummary(currentMonth),
        getTransactions({ month: currentMonth }),
        getCategories(),
        getBudgets({ month: currentMonth })
      ]);
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data.slice(0, 5));
      setCategories(categoriesRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const pieChartData = summary?.spending_breakdown?.slice(0, 5).map((item) => ({
    name: item.category_name,
    value: item.amount,
    color: item.category_color,
  })) || [];

  const budgetWithSpending = budgets.map(budget => {
    const spent = summary?.spending_breakdown?.find(s => s.category_id === budget.category_id)?.amount || 0;
    const category = categoryMap[budget.category_id];
    return {
      ...budget,
      spent,
      percentage: calculatePercentage(spent, budget.limit),
      category
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground">
            {formatMonth(currentMonth)}
          </h1>
          <p className="text-muted-foreground mt-1">Your financial overview</p>
        </div>
        <Link to="/transactions">
          <Button data-testid="add-transaction-btn" className="btn-primary bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Budget Alerts */}
      {summary?.alerts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {summary.alerts.map((alert) => {
            const category = categoryMap[alert.category_id];
            return (
              <div
                key={alert.category_id}
                data-testid={`budget-alert-${alert.category_id}`}
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  alert.status === 'exceeded' 
                    ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5 alert-pulse" />
                <span className="font-medium">
                  {category?.name}: {alert.status === 'exceeded' ? 'Budget exceeded!' : 'Approaching limit'} 
                  {' '}({formatCurrency(alert.spent)} of {formatCurrency(alert.limit)} - {Math.round(alert.percentage)}%)
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card - Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 lg:col-span-2"
        >
          <Card className="glass-card balance-hero h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Current Balance</p>
                  <p data-testid="balance-amount" className="font-mono text-4xl sm:text-5xl font-semibold text-foreground mt-2 tracking-tight">
                    {formatCurrency(summary?.balance || 0)}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`flex items-center gap-1 text-sm ${(summary?.savings_rate || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {(summary?.savings_rate || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(summary?.savings_rate || 0).toFixed(1)}% savings rate
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Income</p>
                  <p data-testid="income-amount" className="font-mono text-2xl font-semibold text-foreground mt-2">
                    {formatCurrency(summary?.total_income || 0)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass-card h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Expenses</p>
                  <p data-testid="expenses-amount" className="font-mono text-2xl font-semibold text-foreground mt-2">
                    {formatCurrency(summary?.total_expenses || 0)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts & Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Spending Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-mono text-sm">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <PiggyBank className="w-12 h-12 mb-3 opacity-50" />
                  <p>No spending data yet</p>
                  <p className="text-sm">Add expenses to see breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-7"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                <Link to="/transactions">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-1">
                  {recentTransactions.map((txn, index) => {
                    const category = categoryMap[txn.category_id];
                    return (
                      <div
                        key={txn.id}
                        data-testid={`transaction-${txn.id}`}
                        className="transaction-item stagger-item"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category?.color}20` }}
                          >
                            <CategoryIcon name={category?.icon || 'circle'} className="w-4 h-4" style={{ color: category?.color }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{txn.description || category?.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                          </div>
                        </div>
                        <span className={`font-mono text-sm font-medium ${txn.type === 'income' ? 'text-primary' : 'text-foreground'}`}>
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ArrowUpRight className="w-12 h-12 mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start tracking your money</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget Progress */}
      {budgetWithSpending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Budget Progress</CardTitle>
                <Link to="/budgets">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    Manage <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgetWithSpending.slice(0, 6).map((budget) => (
                  <div key={budget.id} data-testid={`budget-progress-${budget.id}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon 
                          name={budget.category?.icon || 'circle'} 
                          className="w-4 h-4" 
                          style={{ color: budget.category?.color }} 
                        />
                        <span className="text-sm font-medium">{budget.category?.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {budget.percentage}%
                      </span>
                    </div>
                    <Progress value={budget.percentage} className={`h-2 ${getProgressColor(budget.percentage)}`} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(budget.spent)}</span>
                      <span>{formatCurrency(budget.limit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
