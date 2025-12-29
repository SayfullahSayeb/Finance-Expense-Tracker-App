// ===================================
// Transactions Manager
// ===================================

class TransactionsManager {
    constructor() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.sortOrder = 'newest';
        this.editingId = null;
        this.currency = 'BDT';
    }

    async init() {
        // Load currency preference
        const savedCurrency = await db.getSetting('currency');
        if (savedCurrency) {
            this.currency = savedCurrency;
        }

        this.setupEventListeners();

        // Initialize custom select for sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect && typeof settingsManager !== 'undefined' && settingsManager.createCustomSelect) {
            settingsManager.createCustomSelect(sortSelect);
        }

        await this.render();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        }, 300));

        // Filter buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        sortSelect.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.render();
        });

        // Transaction form
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Type toggle buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const type = e.currentTarget.dataset.type;
                this.updateCategoryOptions(type);
            });
        });


        // Modal controls - only nav button now
        document.getElementById('nav-add-transaction-btn').addEventListener('click', () => {
            if (demoModeManager.isActive()) {
                demoModeManager.showDemoModeWarning();
                return;
            }
            this.openModal();
        });

        document.getElementById('close-transaction-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-transaction-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Delete button in modal
        document.getElementById('delete-transaction-btn').addEventListener('click', async () => {
            if (this.editingId) {
                await this.deleteTransaction(this.editingId);
            }
        });

        // Event delegation for edit button only
        document.getElementById('transaction-list').addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');

            if (editBtn) {
                if (demoModeManager.isActive()) {
                    demoModeManager.showDemoModeWarning();
                    return;
                }
                const id = parseInt(editBtn.dataset.id);
                await this.editTransaction(id);
            }
        });
    }

    async render() {
        const container = document.getElementById('transaction-list');
        let transactions = await db.getAll('transactions');

        // Apply filters
        if (this.currentFilter !== 'all') {
            transactions = transactions.filter(t => t.type === this.currentFilter);
        }

        // Apply search
        if (this.searchQuery) {
            transactions = transactions.filter(t =>
                t.category.toLowerCase().includes(this.searchQuery) ||
                (t.note && t.note.toLowerCase().includes(this.searchQuery)) ||
                t.amount.toString().includes(this.searchQuery)
            );
        }

        // Apply sorting - always newest first by default
        switch (this.sortOrder) {
            case 'newest':
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'highest':
                transactions.sort((a, b) => b.amount - a.amount);
                break;
            case 'lowest':
                transactions.sort((a, b) => a.amount - b.amount);
                break;
            default:
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        if (transactions.length === 0) {
            Utils.renderEmptyState(
                container,
                'wallet',
                lang.translate('noTransactions')
            );
            return;
        }

        // Group transactions by date
        const groupedTransactions = {};
        transactions.forEach(t => {
            const dateKey = t.date;
            if (!groupedTransactions[dateKey]) {
                groupedTransactions[dateKey] = [];
            }
            groupedTransactions[dateKey].push(t);
        });

        // Sort transactions within each date group by createdAt (newest first)
        Object.keys(groupedTransactions).forEach(date => {
            groupedTransactions[date].sort((a, b) => {
                const timeA = new Date(a.createdAt || a.date).getTime();
                const timeB = new Date(b.createdAt || b.date).getTime();
                return timeB - timeA; // Newest first
            });
        });

        // Render grouped transactions
        let html = '';
        Object.keys(groupedTransactions).forEach(date => {
            // Format date header
            const dateObj = new Date(date);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel;
            if (dateObj.toDateString() === today.toDateString()) {
                dateLabel = 'Today';
            } else if (dateObj.toDateString() === yesterday.toDateString()) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            html += `<div class="transaction-date-header">${dateLabel}</div>`;

            // Render transactions for this date
            groupedTransactions[date].forEach(t => {
                html += this.renderTransaction(t);
            });
        });

        container.innerHTML = html;
    }

    renderTransaction(transaction) {
        const emoji = categoriesManager.getCategoryEmoji(transaction.category);
        const categoryName = lang.translate(transaction.category.toLowerCase());

        // Get payment method icon
        const paymentIcons = {
            'cash': 'fa-money-bill-wave',
            'card': 'fa-credit-card',
            'mobile': 'fa-mobile-alt',
            'bank': 'fa-university'
        };
        const paymentIcon = paymentIcons[transaction.paymentMethod] || 'fa-wallet';
        const paymentMethodName = lang.translate(transaction.paymentMethod || 'cash');

        return `
            <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-icon">
                        <span class="category-icon">${emoji}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="category-name">${categoryName} <span style="font-size: 13px; font-weight: 400; color: var(--text-tertiary);"><i class="fas ${paymentIcon}" style="font-size: 10px;"></i> ${paymentMethodName}</span></span>
                        ${transaction.note ? `<span class="transaction-note" style="font-size: var(--font-size-sm); color: var(--text-tertiary);">${transaction.note}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : ''}${Utils.formatCurrency(transaction.amount, this.currency)}
                    </span>
                    <button class="btn-action btn-edit" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async openModal(transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const modalTitle = document.getElementById('modal-title');
        const deleteBtn = document.getElementById('delete-transaction-btn');

        if (transaction) {
            // Edit mode
            this.editingId = transaction.id;
            modalTitle.setAttribute('data-lang', 'editTransaction');
            modalTitle.textContent = lang.translate('editTransaction');

            // Show delete button in edit mode
            deleteBtn.style.display = 'flex';

            // Set type first
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === transaction.type);
            });

            // Update category options based on type (MUST await this!)
            await this.updateCategoryOptions(transaction.type);

            // Populate form AFTER category options are updated
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category').value = transaction.category;
            document.getElementById('payment-method').value = transaction.paymentMethod || 'cash';
            document.getElementById('date').value = Utils.formatDate(transaction.date, 'input');
            document.getElementById('note').value = transaction.note || '';
            document.getElementById('transaction-id').value = transaction.id;
        } else {
            // Add mode
            this.editingId = null;
            modalTitle.setAttribute('data-lang', 'addTransaction');
            modalTitle.textContent = lang.translate('addTransaction');

            // Hide delete button in add mode
            deleteBtn.style.display = 'none';

            form.reset();

            // Set today's date
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            document.getElementById('date').value = dateStr;
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === 'expense');
            });

            await this.updateCategoryOptions('expense');
        }

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('transaction-modal');
        modal.classList.remove('active');
        this.editingId = null;
    }

    async updateCategoryOptions(type) {
        const categorySelect = document.getElementById('category');

        // Remove existing custom select wrapper if it exists
        const existingWrapper = categorySelect.nextSibling;
        if (existingWrapper && existingWrapper.classList && existingWrapper.classList.contains('custom-select-wrapper')) {
            existingWrapper.remove();
        }

        // Show the original select temporarily
        categorySelect.style.display = '';

        // Populate with new categories
        await categoriesManager.populateCategorySelect(categorySelect, type);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const activeTypeBtn = document.querySelector('.type-btn.active');
        const transactionData = {
            type: activeTypeBtn.dataset.type,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            paymentMethod: document.getElementById('payment-method').value,
            date: document.getElementById('date').value,
            note: document.getElementById('note').value,
            createdAt: new Date().toISOString()
        };

        // Validate
        const errors = Utils.validateTransaction(transactionData);
        if (errors.length > 0) {
            Utils.showToast(errors[0]);
            return;
        }

        try {
            if (this.editingId) {
                // Update existing transaction
                transactionData.id = this.editingId;
                await db.update('transactions', transactionData);
                Utils.showToast(lang.translate('transactionUpdated'));
            } else {
                // Add new transaction
                await db.add('transactions', transactionData);
                Utils.showToast(lang.translate('transactionAdded'));
            }

            this.closeModal();
            await this.render();

            // Always update home page to refresh transactions history
            await homeManager.render();

            // Navigate to transactions page after adding (not editing)
            if (!this.editingId) {
                // Get reference to app instance
                const appElement = document.querySelector('.app-container');
                if (appElement && window.location.hash !== '#transactions') {
                    window.location.hash = 'transactions';
                }
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            Utils.showToast('Error saving transaction');
        }
    }

    async editTransaction(id) {
        const transaction = await db.get('transactions', id);
        if (transaction) {
            this.openModal(transaction);
        }
    }

    async deleteTransaction(id) {
        const confirmed = await Utils.confirm(
            'Are you sure you want to delete this transaction?',
            'Delete Transaction',
            'Delete'
        );

        if (confirmed) {
            try {
                await db.delete('transactions', id);
                Utils.showToast(lang.translate('transactionDeleted'));

                // Close the modal
                this.closeModal();

                await this.render();

                // Update home page if visible
                if (document.getElementById('home-page').classList.contains('active')) {
                    await homeManager.render();
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                Utils.showToast('Error deleting transaction');
            }
        }
    }
}

// Create global transactions manager instance
const transactionsManager = new TransactionsManager();
