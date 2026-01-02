import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CalendarIcon
} from 'lucide-react';
import { getSpendingTrends, getDashboardSummary, getCategories } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthOptions } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import CategoryIcon from '@/components/CategoryIcon';

const CHART_COLORS = [
  'hsl(166, 70%, 40%)',
  'hsl(84, 70%, 50%)',
  'hsl(45, 90%, 55%)',
  'hsl(190, 80%, 40%)',
  'hsl(280, 60%, 60%)',
  'hsl(12, 85%, 55%)',
];

export default function Analytics() {
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [monthsRange, setMonthsRange] = useState('6');

  const monthOptions = getMonthOptions();

  useEffect(() => {
    fetchData();
  }, [selectedMonth, monthsRange]);

  const fetchData = async () => {
    try {
      const [trendsRes, summaryRes, categoriesRes] = await Promise.all([
        getSpendingTrends(parseInt(monthsRange)),
        getDashboardSummary(selectedMonth),
        getCategories()
      ]);
      setTrends(trendsRes.data);
      setSummary(summaryRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  // Format trends for chart
  const formattedTrends = trends.map(t => ({
    ...t,
    monthLabel: new Date(t.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
  }));

  // Calculate insights
  const avgIncome = trends.length > 0 
    ? trends.reduce((sum, t) => sum + t.income, 0) / trends.length 
    : 0;
  const avgExpenses = trends.length > 0 
    ? trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length 
    : 0;
  const avgSavings = avgIncome - avgExpenses;

  // Category spending for pie chart
  const categorySpending = summary?.spending_breakdown?.slice(0, 6).map((item, index) => ({
    name: item.category_name,
    value: item.amount,
    color: item.category_color || CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="analytics-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights into your spending habits</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger data-testid="analytics-month-filter" className="w-[180px]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthsRange} onValueChange={setMonthsRange}>
            <SelectTrigger data-testid="analytics-range-filter" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Monthly Income</p>
                  <p data-testid="avg-income" className="font-mono text-xl font-semibold text-primary">
                    {formatCurrency(avgIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Monthly Expenses</p>
                  <p data-testid="avg-expenses" className="font-mono text-xl font-semibold">
                    {formatCurrency(avgExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <PiggyBank className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Monthly Savings</p>
                  <p data-testid="avg-savings" className="font-mono text-xl font-semibold text-accent">
                    {formatCurrency(avgSavings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {formattedTrends.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedTrends}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(166, 70%, 40%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(166, 70%, 40%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(12, 85%, 55%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(12, 85%, 55%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        name="Income"
                        stroke="hsl(166, 70%, 40%)" 
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        name="Expenses"
                        stroke="hsl(12, 85%, 55%)" 
                        fillOpacity={1} 
                        fill="url(#colorExpenses)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Savings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Savings</CardTitle>
            </CardHeader>
            <CardContent>
              {formattedTrends.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="savings" 
                        name="Savings"
                        fill="hsl(84, 70%, 50%)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No savings data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySpending.length > 0 ? (
                <div className="h-[300px] flex">
                  {/* Pie Chart */}
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySpending}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categorySpending.map((entry, index) => (
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
                  {/* Custom Legend */}
                  <div className="w-40 flex flex-col justify-center space-y-2 pl-2">
                    {categorySpending.map((entry, index) => {
                      const total = categorySpending.reduce((sum, e) => sum + e.value, 0);
                      const percent = ((entry.value / total) * 100).toFixed(0);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: entry.color }} 
                          />
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {entry.name}
                          </span>
                          <span className="text-xs font-mono font-medium">
                            {percent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No spending data for this month
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Spending Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.spending_breakdown?.length > 0 ? (
                <div className="space-y-4">
                  {summary.spending_breakdown.slice(0, 6).map((item, index) => {
                    const total = summary.total_expenses || 1;
                    const percentage = (item.amount / total * 100).toFixed(1);
                    
                    return (
                      <div key={item.category_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="p-1.5 rounded"
                              style={{ backgroundColor: `${item.category_color}20` }}
                            >
                              <CategoryIcon 
                                name={item.category_icon} 
                                className="w-4 h-4" 
                                style={{ color: item.category_color }} 
                              />
                            </div>
                            <span className="text-sm font-medium">{item.category_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-sm">{formatCurrency(item.amount)}</span>
                            <span className="text-xs text-muted-foreground ml-2">{percentage}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: item.category_color 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No spending data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
