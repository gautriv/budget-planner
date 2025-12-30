/**
 * Local Database using IndexedDB
 * Enables offline-first functionality for the Budget App
 */

const DB_NAME = 'BudgetVaultDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  transactions: 'transactions',
  categories: 'categories',
  budgets: 'budgets',
  savingsGoals: 'savings_goals',
  syncQueue: 'sync_queue',
  meta: 'meta'
};

let db = null;

/**
 * Initialize the IndexedDB database
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Transactions store
      if (!database.objectStoreNames.contains(STORES.transactions)) {
        const txnStore = database.createObjectStore(STORES.transactions, { keyPath: 'id' });
        txnStore.createIndex('date', 'date', { unique: false });
        txnStore.createIndex('type', 'type', { unique: false });
        txnStore.createIndex('category_id', 'category_id', { unique: false });
      }

      // Categories store
      if (!database.objectStoreNames.contains(STORES.categories)) {
        database.createObjectStore(STORES.categories, { keyPath: 'id' });
      }

      // Budgets store
      if (!database.objectStoreNames.contains(STORES.budgets)) {
        const budgetStore = database.createObjectStore(STORES.budgets, { keyPath: 'id' });
        budgetStore.createIndex('month', 'month', { unique: false });
        budgetStore.createIndex('category_id', 'category_id', { unique: false });
      }

      // Savings Goals store
      if (!database.objectStoreNames.contains(STORES.savingsGoals)) {
        database.createObjectStore(STORES.savingsGoals, { keyPath: 'id' });
      }

      // Sync Queue - stores pending changes to sync with server
      if (!database.objectStoreNames.contains(STORES.syncQueue)) {
        const syncStore = database.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Meta store for sync status
      if (!database.objectStoreNames.contains(STORES.meta)) {
        database.createObjectStore(STORES.meta, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Generic CRUD operations
 */
const getStore = (storeName, mode = 'readonly') => {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// Get all items from a store
export const getAll = async (storeName) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Get item by ID
export const getById = async (storeName, id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Add or update item
export const put = async (storeName, item) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

// Add multiple items
export const putAll = async (storeName, items) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    transaction.oncomplete = () => resolve(items);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Delete item by ID
export const remove = async (storeName, id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Clear all items in a store
export const clear = async (storeName) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Get items by index
export const getByIndex = async (storeName, indexName, value) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const store = getStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Sync Queue Operations
 */
export const addToSyncQueue = async (action) => {
  await initDB();
  const queueItem = {
    ...action,
    timestamp: Date.now(),
    synced: false
  };
  return put(STORES.syncQueue, queueItem);
};

export const getSyncQueue = async () => {
  return getAll(STORES.syncQueue);
};

export const clearSyncQueue = async () => {
  return clear(STORES.syncQueue);
};

export const removeSyncItem = async (id) => {
  return remove(STORES.syncQueue, id);
};

/**
 * Meta operations
 */
export const setMeta = async (key, value) => {
  return put(STORES.meta, { key, value, updatedAt: Date.now() });
};

export const getMeta = async (key) => {
  const result = await getById(STORES.meta, key);
  return result?.value;
};

/**
 * Store-specific helpers
 */

// Transactions
export const localTransactions = {
  getAll: () => getAll(STORES.transactions),
  getByMonth: async (month) => {
    const all = await getAll(STORES.transactions);
    return all.filter(t => t.date.startsWith(month)).sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  getByType: async (type) => getByIndex(STORES.transactions, 'type', type),
  save: (transaction) => put(STORES.transactions, transaction),
  saveAll: (transactions) => putAll(STORES.transactions, transactions),
  delete: (id) => remove(STORES.transactions, id),
  clear: () => clear(STORES.transactions)
};

// Categories
export const localCategories = {
  getAll: () => getAll(STORES.categories),
  save: (category) => put(STORES.categories, category),
  saveAll: (categories) => putAll(STORES.categories, categories),
  delete: (id) => remove(STORES.categories, id),
  clear: () => clear(STORES.categories)
};

// Budgets
export const localBudgets = {
  getAll: () => getAll(STORES.budgets),
  getByMonth: (month) => getByIndex(STORES.budgets, 'month', month),
  save: (budget) => put(STORES.budgets, budget),
  saveAll: (budgets) => putAll(STORES.budgets, budgets),
  delete: (id) => remove(STORES.budgets, id),
  clear: () => clear(STORES.budgets)
};

// Savings Goals
export const localSavingsGoals = {
  getAll: () => getAll(STORES.savingsGoals),
  save: (goal) => put(STORES.savingsGoals, goal),
  saveAll: (goals) => putAll(STORES.savingsGoals, goals),
  delete: (id) => remove(STORES.savingsGoals, id),
  clear: () => clear(STORES.savingsGoals)
};

export { STORES };

