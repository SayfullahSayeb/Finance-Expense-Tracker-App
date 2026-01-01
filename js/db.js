const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 4;

class Database {
    constructor() {
        this.db = null;
        this.currentDBName = DB_NAME;
    }

    // Initialize database with optional custom name for profiles
    async init(dbName = null) {
        // Use provided dbName or fall back to default
        // If profileManager exists and is initialized, use profile-specific DB
        if (!dbName && typeof profileManager !== 'undefined' && profileManager.getActiveProfileDB) {
            dbName = profileManager.getActiveProfileDB();
        }

        this.currentDBName = dbName || DB_NAME;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.currentDBName, DB_VERSION);

            request.onerror = () => {
                reject('Database failed to open');
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };


            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create transactions store - delete old one if exists
                if (db.objectStoreNames.contains('transactions')) {
                    db.deleteObjectStore('transactions');
                }
                const transactionStore = db.createObjectStore('transactions', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                transactionStore.createIndex('type', 'type', { unique: false });
                transactionStore.createIndex('category', 'category', { unique: false });
                transactionStore.createIndex('date', 'date', { unique: false });

                // Create categories store - delete old one if exists
                if (db.objectStoreNames.contains('categories')) {
                    db.deleteObjectStore('categories');
                }
                const categoryStore = db.createObjectStore('categories', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                categoryStore.createIndex('name', 'name', { unique: false });
                categoryStore.createIndex('type', 'type', { unique: false });

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Create goals store
                if (!db.objectStoreNames.contains('goals')) {
                    const goalsStore = db.createObjectStore('goals', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    goalsStore.createIndex('status', 'status', { unique: false });
                    goalsStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // Generic method to add data
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to get data by ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to get all data
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to update data
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to delete data
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get transactions by date range
    async getTransactionsByDateRange(startDate, endDate) {
        const allTransactions = await this.getAll('transactions');
        return allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
        });
    }

    // Get transactions by type
    async getTransactionsByType(type) {
        const allTransactions = await this.getAll('transactions');
        return allTransactions.filter(t => t.type === type);
    }

    // Get transactions by category
    async getTransactionsByCategory(category) {
        const allTransactions = await this.getAll('transactions');
        return allTransactions.filter(t => t.category === category);
    }

    // Get setting value
    async getSetting(key) {
        try {
            const setting = await this.get('settings', key);
            return setting ? setting.value : null;
        } catch (error) {
            // Return null if setting doesn't exist yet
            return null;
        }
    }

    // Set setting value
    async setSetting(key, value) {
        try {
            return await this.update('settings', { key, value });
        } catch (error) {
            console.error('Error setting value:', error);
            return null;
        }
    }

    // Delete setting
    async deleteSetting(key) {
        try {
            return await this.delete('settings', key);
        } catch (error) {
            console.error('Error deleting setting:', error);
            return null;
        }
    }

    // Clear all data from a store
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Export all data
    async exportData() {
        const transactions = await this.getAll('transactions');
        const categories = await this.getAll('categories');
        const settings = await this.getAll('settings');
        const goals = await this.getAll('goals');

        return {
            transactions,
            categories,
            settings,
            goals,
            exportDate: new Date().toISOString(),
            version: DB_VERSION
        };
    }

    // Import data
    async importData(data) {
        try {
            // Clear existing data
            await this.clearStore('transactions');
            await this.clearStore('categories');
            await this.clearStore('settings');
            await this.clearStore('goals');

            // Import transactions
            if (data.transactions) {
                for (const transaction of data.transactions) {
                    const { id, ...transactionData } = transaction;
                    await this.add('transactions', transactionData);
                }
            }

            // Import categories
            if (data.categories) {
                for (const category of data.categories) {
                    const { id, ...categoryData } = category;
                    await this.add('categories', categoryData);
                }
            }

            // Import settings
            if (data.settings) {
                for (const setting of data.settings) {
                    await this.update('settings', setting);
                }
            }

            // Import goals
            if (data.goals) {
                for (const goal of data.goals) {
                    const { id, ...goalData } = goal;
                    await this.add('goals', goalData);
                }
            }

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Create global database instance
const db = new Database();
