import axios from 'axios';
import { 
  initDB,
  localTransactions, 
  localCategories, 
  localBudgets, 
  localSavingsGoals,
  addToSyncQueue,
  getSyncQueue,
  removeSyncItem,
  setMeta,
  getMeta
} from './localDB';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Track online status
let isOnline = navigator.onLine;
let syncInProgress = false;
let onSyncStatusChange = null;

// Initialize DB on load
initDB();

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  syncWithServer();
});

window.addEventListener('offline', () => {
  isOnline = false;
  if (onSyncStatusChange) onSyncStatusChange({ isOnline: false, syncing: false });
});

// Set callback for sync status changes
export const setSyncStatusCallback = (callback) => {
  onSyncStatusChange = callback;
};

// Check if server is reachable
const checkServerHealth = async () => {
  try {
    await API.get('/', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

// Generate unique ID
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Sync local changes with server
 */
export const syncWithServer = async () => {
  if (syncInProgress || !isOnline) return;
  
  syncInProgress = true;
  if (onSyncStatusChange) onSyncStatusChange({ isOnline, syncing: true });

  try {
    const serverAvailable = await checkServerHealth();
    if (!serverAvailable) {
      syncInProgress = false;
      if (onSyncStatusChange) onSyncStatusChange({ isOnline: false, syncing: false });
      return;
    }

    // Process sync queue
    const queue = await getSyncQueue();
    for (const item of queue) {
      try {
        switch (item.action) {
          case 'CREATE_TRANSACTION':
            await API.post('/transactions', item.data);
            break;
          case 'UPDATE_TRANSACTION':
            await API.put(`/transactions/${item.id}`, item.data);
            break;
          case 'DELETE_TRANSACTION':
            await API.delete(`/transactions/${item.id}`);
            break;
          case 'CREATE_CATEGORY':
            await API.post('/categories', item.data);
            break;
          case 'DELETE_CATEGORY':
            await API.delete(`/categories/${item.id}`);
            break;
          case 'CREATE_BUDGET':
            await API.post('/budgets', item.data);
            break;
          case 'UPDATE_BUDGET':
            await API.put(`/budgets/${item.id}`, item.data);
            break;
          case 'DELETE_BUDGET':
            await API.delete(`/budgets/${item.id}`);
            break;
          case 'CREATE_SAVINGS_GOAL':
            await API.post('/savings-goals', item.data);
            break;
          case 'UPDATE_SAVINGS_GOAL':
            await API.put(`/savings-goals/${item.id}`, item.data);
            break;
          case 'DELETE_SAVINGS_GOAL':
            await API.delete(`/savings-goals/${item.id}`);
            break;
          default:
            break;
        }
        await removeSyncItem(item.id);
      } catch (error) {
        console.error('Sync error for item:', item, error);
        // Keep in queue for retry
      }
    }

    // Fetch latest data from server and update local
    await refreshLocalData();
    await setMeta('lastSync', Date.now());
    
    if (onSyncStatusChange) onSyncStatusChange({ isOnline: true, syncing: false, lastSync: Date.now() });
  } catch (error) {
    console.error('Sync failed:', error);
    if (onSyncStatusChange) onSyncStatusChange({ isOnline: false, syncing: false });
  } finally {
    syncInProgress = false;
  }
};

/**
 * Refresh local data from server
 */
const refreshLocalData = async () => {
  try {
    // Fetch and store categories
    const categoriesRes = await API.get('/categories');
    await localCategories.saveAll(categoriesRes.data);

    // Fetch and store transactions
    const transactionsRes = await API.get('/transactions');
    await localTransactions.saveAll(transactionsRes.data);

    // Fetch and store budgets
    const budgetsRes = await API.get('/budgets');
    await localBudgets.saveAll(budgetsRes.data);

    // Fetch and store savings goals
    const goalsRes = await API.get('/savings-goals');
    await localSavingsGoals.saveAll(goalsRes.data);
  } catch (error) {
    console.error('Failed to refresh local data:', error);
  }
};

// Default categories for offline initialization
const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'utensils', color: '#10b981', type: 'expense', is_default: true },
  { id: 'cat_transport', name: 'Transportation', icon: 'car', color: '#3b82f6', type: 'expense', is_default: true },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'gamepad-2', color: '#8b5cf6', type: 'expense', is_default: true },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'receipt', color: '#f59e0b', type: 'expense', is_default: true },
  { id: 'cat_shopping', name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense', is_default: true },
  { id: 'cat_health', name: 'Health', icon: 'heart-pulse', color: '#ef4444', type: 'expense', is_default: true },
  { id: 'cat_housing', name: 'Housing', icon: 'home', color: '#06b6d4', type: 'expense', is_default: true },
  { id: 'cat_savings', name: 'Savings', icon: 'piggy-bank', color: '#22c55e', type: 'expense', is_default: true },
  { id: 'cat_salary', name: 'Salary', icon: 'briefcase', color: '#10b981', type: 'income', is_default: true },
  { id: 'cat_freelance', name: 'Freelance', icon: 'laptop', color: '#6366f1', type: 'income', is_default: true },
  { id: 'cat_investment', name: 'Investments', icon: 'trending-up', color: '#14b8a6', type: 'income', is_default: true },
  { id: 'cat_other_income', name: 'Other Income', icon: 'wallet', color: '#84cc16', type: 'income', is_default: true },
];

/**
 * OFFLINE-FIRST API METHODS
 */

// Categories
export const getCategories = async () => {
  try {
    // Try server first
    const response = await API.get('/categories');
    await localCategories.saveAll(response.data);
    return response;
  } catch {
    // Fallback to local
    let data = await localCategories.getAll();
    if (data.length === 0) {
      // Initialize with defaults
      await localCategories.saveAll(DEFAULT_CATEGORIES);
      data = DEFAULT_CATEGORIES;
    }
    return { data };
  }
};

export const createCategory = async (categoryData) => {
  const category = {
    ...categoryData,
    id: generateId('cat'),
    is_default: false
  };
  
  // Save locally first
  await localCategories.save(category);
  
  try {
    const response = await API.post('/categories', categoryData);
    // Update with server response (may have different ID)
    await localCategories.save(response.data);
    return response;
  } catch {
    // Queue for sync
    await addToSyncQueue({ action: 'CREATE_CATEGORY', data: category });
    return { data: category };
  }
};

export const deleteCategory = async (id) => {
  // Delete locally first
  await localCategories.delete(id);
  
  try {
    return await API.delete(`/categories/${id}`);
  } catch {
    await addToSyncQueue({ action: 'DELETE_CATEGORY', id });
    return { data: { message: 'Deleted locally' } };
  }
};

// Transactions
export const getTransactions = async (params) => {
  try {
    const response = await API.get('/transactions', { params });
    await localTransactions.saveAll(response.data);
    return response;
  } catch {
    let data = await localTransactions.getAll();
    if (params?.month) {
      data = data.filter(t => t.date.startsWith(params.month));
    }
    if (params?.type) {
      data = data.filter(t => t.type === params.type);
    }
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { data };
  }
};

export const createTransaction = async (transactionData) => {
  const transaction = {
    ...transactionData,
    id: generateId('txn'),
    created_at: new Date().toISOString()
  };
  
  // Save locally first
  await localTransactions.save(transaction);
  
  try {
    const response = await API.post('/transactions', transactionData);
    await localTransactions.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'CREATE_TRANSACTION', data: transaction });
    return { data: transaction };
  }
};

export const updateTransaction = async (id, transactionData) => {
  const existing = await localTransactions.getAll();
  const transaction = existing.find(t => t.id === id);
  const updated = { ...transaction, ...transactionData };
  
  // Update locally first
  await localTransactions.save(updated);
  
  try {
    const response = await API.put(`/transactions/${id}`, transactionData);
    await localTransactions.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'UPDATE_TRANSACTION', id, data: transactionData });
    return { data: updated };
  }
};

export const deleteTransaction = async (id) => {
  // Delete locally first
  await localTransactions.delete(id);
  
  try {
    return await API.delete(`/transactions/${id}`);
  } catch {
    await addToSyncQueue({ action: 'DELETE_TRANSACTION', id });
    return { data: { message: 'Deleted locally' } };
  }
};

// Budgets
export const getBudgets = async (params) => {
  try {
    const response = await API.get('/budgets', { params });
    await localBudgets.saveAll(response.data);
    return response;
  } catch {
    let data = await localBudgets.getAll();
    if (params?.month) {
      data = data.filter(b => b.month === params.month);
    }
    return { data };
  }
};

export const createBudget = async (budgetData) => {
  const budget = {
    ...budgetData,
    id: generateId('bgt'),
    created_at: new Date().toISOString()
  };
  
  // Save locally first
  await localBudgets.save(budget);
  
  try {
    const response = await API.post('/budgets', budgetData);
    await localBudgets.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'CREATE_BUDGET', data: budget });
    return { data: budget };
  }
};

export const updateBudget = async (id, budgetData) => {
  const existing = await localBudgets.getAll();
  const budget = existing.find(b => b.id === id);
  const updated = { ...budget, ...budgetData };
  
  await localBudgets.save(updated);
  
  try {
    const response = await API.put(`/budgets/${id}`, budgetData);
    await localBudgets.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'UPDATE_BUDGET', id, data: budgetData });
    return { data: updated };
  }
};

export const deleteBudget = async (id) => {
  await localBudgets.delete(id);
  
  try {
    return await API.delete(`/budgets/${id}`);
  } catch {
    await addToSyncQueue({ action: 'DELETE_BUDGET', id });
    return { data: { message: 'Deleted locally' } };
  }
};

// Savings Goals
export const getSavingsGoals = async () => {
  try {
    const response = await API.get('/savings-goals');
    await localSavingsGoals.saveAll(response.data);
    return response;
  } catch {
    const data = await localSavingsGoals.getAll();
    return { data };
  }
};

export const createSavingsGoal = async (goalData) => {
  const goal = {
    ...goalData,
    id: generateId('goal'),
    created_at: new Date().toISOString()
  };
  
  await localSavingsGoals.save(goal);
  
  try {
    const response = await API.post('/savings-goals', goalData);
    await localSavingsGoals.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'CREATE_SAVINGS_GOAL', data: goal });
    return { data: goal };
  }
};

export const updateSavingsGoal = async (id, goalData) => {
  const existing = await localSavingsGoals.getAll();
  const goal = existing.find(g => g.id === id);
  const updated = { ...goal, ...goalData };
  
  await localSavingsGoals.save(updated);
  
  try {
    const response = await API.put(`/savings-goals/${id}`, goalData);
    await localSavingsGoals.save(response.data);
    return response;
  } catch {
    await addToSyncQueue({ action: 'UPDATE_SAVINGS_GOAL', id, data: goalData });
    return { data: updated };
  }
};

export const deleteSavingsGoal = async (id) => {
  await localSavingsGoals.delete(id);
  
  try {
    return await API.delete(`/savings-goals/${id}`);
  } catch {
    await addToSyncQueue({ action: 'DELETE_SAVINGS_GOAL', id });
    return { data: { message: 'Deleted locally' } };
  }
};

// Dashboard & Analytics (computed locally when offline)
export const getDashboardSummary = async (month) => {
  try {
    const response = await API.get('/dashboard/summary', { params: { month } });
    return response;
  } catch {
    // Compute locally
    const transactions = await localTransactions.getByMonth(month);
    const budgets = await localBudgets.getAll();
    const categories = await localCategories.getAll();
    
    const monthBudgets = budgets.filter(b => b.month === month);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Spending by category
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const spendingByCategory = {};
    expenseTransactions.forEach(t => {
      spendingByCategory[t.category_id] = (spendingByCategory[t.category_id] || 0) + t.amount;
    });
    
    // Category map
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });
    
    // Spending breakdown
    const spendingBreakdown = Object.entries(spendingByCategory).map(([catId, amount]) => {
      const cat = categoryMap[catId] || {};
      return {
        category_id: catId,
        category_name: cat.name || 'Unknown',
        category_color: cat.color || '#6b7280',
        category_icon: cat.icon || 'circle',
        amount
      };
    }).sort((a, b) => b.amount - a.amount);
    
    // Alerts
    const alerts = monthBudgets
      .map(budget => {
        const spent = spendingByCategory[budget.category_id] || 0;
        const percentage = budget.limit > 0 ? (spent / budget.limit * 100) : 0;
        if (percentage >= 80) {
          return {
            category_id: budget.category_id,
            spent,
            limit: budget.limit,
            percentage,
            status: percentage >= 100 ? 'exceeded' : 'warning'
          };
        }
        return null;
      })
      .filter(Boolean);
    
    return {
      data: {
        month,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance,
        savings_rate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0,
        spending_breakdown: spendingBreakdown,
        alerts,
        transaction_count: transactions.length
      }
    };
  }
};

export const getSpendingTrends = async (months = 6) => {
  try {
    const response = await API.get('/analytics/trends', { params: { months } });
    return response;
  } catch {
    // Compute locally
    const allTransactions = await localTransactions.getAll();
    const trends = [];
    
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = targetDate.toISOString().slice(0, 7);
      
      const monthTransactions = allTransactions.filter(t => t.date.startsWith(monthStr));
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: monthStr,
        income,
        expenses,
        savings: income - expenses
      });
    }
    
    return { data: trends };
  }
};

// Export sync function and status
export { getMeta };
export default API;
