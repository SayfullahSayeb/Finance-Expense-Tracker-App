// ===================================
// Savings Goals Manager
// ===================================

class GoalsManager {
    constructor() {
        this.goals = [];
        this.currentGoal = null;
        this.currentTransactionIndex = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Setup event listeners first (doesn't require database)
            this.setupEventListeners();

            // Try to load goals, but don't fail if store doesn't exist yet
            await this.loadGoals();

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize goals manager:', error);
            // Mark as initialized anyway to prevent blocking the app
            this.initialized = true;
        }
    }

    setupEventListeners() {
        // Add goal button
        const addGoalBtn = document.getElementById('add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.openGoalModal());
        }

        // Goal form submit
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }

        // Close modal buttons
        const closeGoalModal = document.getElementById('close-goal-modal');
        if (closeGoalModal) {
            closeGoalModal.addEventListener('click', () => this.closeGoalModal());
        }

        const cancelGoalBtn = document.getElementById('cancel-goal-btn');
        if (cancelGoalBtn) {
            cancelGoalBtn.addEventListener('click', () => this.closeGoalModal());
        }

        // Delete goal button
        const deleteGoalBtn = document.getElementById('delete-goal-btn');
        if (deleteGoalBtn) {
            deleteGoalBtn.addEventListener('click', () => this.handleDeleteGoal());
        }

        // Add money modal
        const closeAddMoneyModal = document.getElementById('close-add-money-modal');
        if (closeAddMoneyModal) {
            closeAddMoneyModal.addEventListener('click', () => this.closeAddMoneyModal());
        }

        const cancelAddMoneyBtn = document.getElementById('cancel-add-money-btn');
        if (cancelAddMoneyBtn) {
            cancelAddMoneyBtn.addEventListener('click', () => this.closeAddMoneyModal());
        }

        const addMoneyForm = document.getElementById('add-money-form');
        if (addMoneyForm) {
            addMoneyForm.addEventListener('submit', (e) => this.handleAddMoney(e));
        }

        // History modal
        const closeHistoryModal = document.getElementById('close-history-modal');
        if (closeHistoryModal) {
            closeHistoryModal.addEventListener('click', () => this.closeHistoryModal());
        }


        // Edit transaction modal
        const closeEditTransactionModal = document.getElementById('close-edit-transaction-modal');
        if (closeEditTransactionModal) {
            closeEditTransactionModal.addEventListener('click', () => this.closeEditTransactionModal());
        }

        const editTransactionForm = document.getElementById('edit-transaction-form');
        if (editTransactionForm) {
            editTransactionForm.addEventListener('submit', (e) => this.handleEditTransactionSubmit(e));
        }

        const deleteTransactionBtn = document.getElementById('delete-transaction-btn');
        if (deleteTransactionBtn) {
            deleteTransactionBtn.addEventListener('click', () => this.handleDeleteTransactionClick());
        }

        const cancelEditTransactionBtn = document.getElementById('cancel-edit-transaction-btn');
        if (cancelEditTransactionBtn) {
            cancelEditTransactionBtn.addEventListener('click', () => this.closeEditTransactionModal());
        }
    }

    async loadGoals() {
        try {
            this.goals = await db.getAll('goals');
            this.renderGoals();
        } catch (error) {
            console.error('Failed to load goals:', error);
            this.goals = [];
        }
    }

    renderGoals() {
        const goalsContainer = document.getElementById('goals-list');
        if (!goalsContainer) return;

        if (this.goals.length === 0) {
            goalsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>No savings goals yet</p>
                    <p class="empty-state-subtitle">Create your first goal to start saving!</p>
                </div>
            `;
            return;
        }

        // Sort goals: active first, then by creation date
        const sortedGoals = [...this.goals].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        goalsContainer.innerHTML = sortedGoals.map(goal => this.renderGoalCard(goal)).join('');

        // Add event listeners to goal cards
        sortedGoals.forEach(goal => {
            const card = document.getElementById(`goal-${goal.id}`);
            if (card) {
                const editBtn = card.querySelector('.goal-edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openGoalModal(goal);
                    });
                }

                const addMoneyBtn = card.querySelector('.add-money-btn');
                if (addMoneyBtn) {
                    addMoneyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openAddMoneyModal(goal);
                    });
                }

                const viewHistoryBtn = card.querySelector('.view-history-btn');
                if (viewHistoryBtn) {
                    viewHistoryBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openHistoryModal(goal);
                    });
                }
            }
        });
    }

    renderGoalCard(goal) {
        const progress = (goal.saved / goal.target) * 100;
        const remaining = goal.target - goal.saved;
        const isCompleted = goal.status === 'completed';

        let deadlineHtml = '';
        if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const today = new Date();
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

            let deadlineClass = 'goal-deadline';
            if (daysLeft < 0) {
                deadlineClass += ' overdue';
            } else if (daysLeft <= 7) {
                deadlineClass += ' urgent';
            }

            deadlineHtml = `
                <div class="${deadlineClass}">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}</span>
                </div>
            `;
        }

        return `
            <div class="goal-card ${isCompleted ? 'completed' : ''}" id="goal-${goal.id}">
                ${isCompleted ? '<div class="goal-completed-badge"><i class="fas fa-check-circle"></i> Completed</div>' : ''}
                
                <div class="goal-header">
                    <div class="goal-info">
                        <h3 class="goal-name">${this.escapeHtml(goal.name)}</h3>
                        ${deadlineHtml}
                    </div>
                    <button class="goal-edit-btn goal-action-btn" title="Edit Goal">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>

                <div class="goal-amounts">
                    <div class="goal-amount-item">
                        <span class="goal-amount-label">Saved</span>
                        <span class="goal-amount-value saved">${Utils.formatCurrency(goal.saved, goal.currency || 'BDT')}</span>
                    </div>
                    <div class="goal-amount-item">
                        <span class="goal-amount-label">Target</span>
                        <span class="goal-amount-value">${Utils.formatCurrency(goal.target, goal.currency || 'BDT')}</span>
                    </div>
                    <div class="goal-amount-item">
                        <span class="goal-amount-label">Remaining</span>
                        <span class="goal-amount-value remaining">${Utils.formatCurrency(remaining, goal.currency || 'BDT')}</span>
                    </div>
                </div>

                <div class="goal-progress-section">
                    <div class="goal-progress-header">
                        <span class="goal-progress-label">Progress</span>
                        <span class="goal-progress-percentage">${Math.min(progress, 100).toFixed(1)}%</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                </div>

                ${!isCompleted ? `
                    <div class="goal-actions-row">
                        ${goal.transactions && goal.transactions.length > 0 ? `
                            <button class="btn btn-secondary view-history-btn goal-action-btn">
                                <i class="fas fa-history"></i>
                                Recent Additions (${goal.transactions.length})
                            </button>
                        ` : ''}
                        <button class="btn btn-primary add-money-btn goal-action-btn">
                            <i class="fas fa-plus"></i>
                            Add Money
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openGoalModal(goal = null) {
        this.currentGoal = goal;
        const modal = document.getElementById('goal-modal');
        const modalTitle = document.getElementById('goal-modal-title');
        const deleteBtn = document.getElementById('delete-goal-btn');
        const form = document.getElementById('goal-form');

        if (goal) {
            modalTitle.textContent = 'Edit Goal';
            deleteBtn.style.display = 'block';

            document.getElementById('goal-name').value = goal.name;
            document.getElementById('goal-target').value = goal.target;
            document.getElementById('goal-deadline').value = goal.deadline || '';

        } else {
            modalTitle.textContent = 'Create New Goal';
            deleteBtn.style.display = 'none';
            form.reset();
        }

        modal.classList.add('active');
    }

    closeGoalModal() {
        const modal = document.getElementById('goal-modal');
        modal.classList.remove('active');
        this.currentGoal = null;
    }

    async handleGoalSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('goal-name').value.trim();
        const target = parseFloat(document.getElementById('goal-target').value);
        const deadline = document.getElementById('goal-deadline').value;

        // Validation
        if (!name) {
            Utils.showToast('Please enter a goal name');
            return;
        }

        if (!target || target <= 0) {
            Utils.showToast('Target amount must be greater than 0');
            return;
        }

        if (deadline) {
            const deadlineDate = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (deadlineDate < today) {
                Utils.showToast('Deadline cannot be in the past');
                return;
            }
        }

        try {
            const currency = await db.getSetting('currency') || 'BDT';

            if (this.currentGoal) {
                // Update existing goal
                const updatedGoal = {
                    ...this.currentGoal,
                    name,
                    target,
                    deadline: deadline || null
                };

                // Check if goal should be marked as completed
                if (updatedGoal.saved >= updatedGoal.target && updatedGoal.status !== 'completed') {
                    updatedGoal.status = 'completed';
                }

                await db.update('goals', updatedGoal);
                Utils.showToast('Goal updated successfully!');
            } else {
                // Create new goal
                const newGoal = {
                    name,
                    target,
                    saved: 0,
                    deadline: deadline || null,
                    status: 'active',
                    currency,
                    transactions: [],
                    createdAt: new Date().toISOString()
                };

                await db.add('goals', newGoal);
                Utils.showToast('Goal created successfully!');
            }

            await this.loadGoals();
            this.closeGoalModal();
        } catch (error) {
            console.error('Failed to save goal:', error);
            Utils.showToast('Failed to save goal. Please try again.');
        }
    }

    async handleDeleteGoal() {
        if (!this.currentGoal) return;

        const confirmed = await Utils.confirm(
            `Are you sure you want to delete "${this.currentGoal.name}"? This action cannot be undone.`,
            'Delete Goal',
            'Delete'
        );

        if (confirmed) {
            try {
                await db.delete('goals', this.currentGoal.id);
                Utils.showToast('Goal deleted successfully');
                await this.loadGoals();
                this.closeGoalModal();
            } catch (error) {
                console.error('Failed to delete goal:', error);
                Utils.showToast('Failed to delete goal. Please try again.');
            }
        }
    }

    openAddMoneyModal(goal) {
        this.currentGoal = goal;
        const modal = document.getElementById('add-money-modal');
        const form = document.getElementById('add-money-form');

        form.reset();
        document.getElementById('add-money-goal-name').textContent = goal.name;

        const remaining = goal.target - goal.saved;
        document.getElementById('add-money-amount').setAttribute('max', remaining);

        modal.classList.add('active');
    }

    closeAddMoneyModal() {
        const modal = document.getElementById('add-money-modal');
        modal.classList.remove('active');
        this.currentGoal = null;
    }

    async handleAddMoney(e) {
        e.preventDefault();

        if (!this.currentGoal) return;

        const amount = parseFloat(document.getElementById('add-money-amount').value);

        if (!amount || amount <= 0) {
            Utils.showToast('Please enter a valid amount');
            return;
        }

        const remaining = this.currentGoal.target - this.currentGoal.saved;
        if (amount > remaining) {
            Utils.showToast(`Amount cannot exceed remaining target (${Utils.formatCurrency(remaining, this.currentGoal.currency)})`);
            return;
        }

        try {
            // Initialize transactions array if it doesn't exist
            if (!this.currentGoal.transactions) {
                this.currentGoal.transactions = [];
            }

            // Add new transaction
            const transaction = {
                amount: amount,
                date: new Date().toISOString()
            };

            const updatedGoal = {
                ...this.currentGoal,
                saved: this.currentGoal.saved + amount,
                transactions: [...this.currentGoal.transactions, transaction]
            };

            // Check if goal is now completed
            if (updatedGoal.saved >= updatedGoal.target) {
                updatedGoal.status = 'completed';
            }

            await db.update('goals', updatedGoal);

            if (updatedGoal.status === 'completed') {
                Utils.showToast('🎉 Congratulations! Goal completed!');
            } else {
                Utils.showToast('Money added successfully!');
            }

            await this.loadGoals();
            this.closeAddMoneyModal();
        } catch (error) {
            console.error('Failed to add money:', error);
            Utils.showToast('Failed to add money. Please try again.');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // History Modal Functions
    openHistoryModal(goal) {
        this.currentGoal = goal;
        const modal = document.getElementById('history-modal');
        const listEl = document.getElementById('history-transactions-list');

        if (!goal.transactions || goal.transactions.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">No transactions yet</p>';
        } else {
            // Show all transactions, newest first
            const sortedTransactions = [...goal.transactions].reverse();
            listEl.innerHTML = sortedTransactions.map((tx, index) => {
                const originalIndex = goal.transactions.length - 1 - index;
                return `
                    <div class="history-transaction-item">
                        <div class="history-transaction-info">
                            <div class="history-transaction-header">
                                <i class="fas fa-plus-circle" style="color: var(--success-color);"></i>
                                <span class="history-transaction-date">${Utils.formatDate(tx.date, 'long')}</span>
                            </div>
                            <span class="history-transaction-amount">${Utils.formatCurrency(tx.amount, goal.currency || 'BDT')}</span>
                        </div>
                        <div class="history-transaction-actions">
                            <button class="btn-icon-small edit-transaction-btn" data-index="${originalIndex}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners for edit buttons
            const editBtns = listEl.querySelectorAll('.edit-transaction-btn');
            editBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    this.editTransaction(index);
                });
            });
        }

        modal.classList.add('active');
    }

    closeHistoryModal() {
        const modal = document.getElementById('history-modal');
        modal.classList.remove('active');
        this.currentGoal = null;
    }

    async editTransaction(index) {
        if (!this.currentGoal || !this.currentGoal.transactions[index]) return;

        this.currentTransactionIndex = index;
        const transaction = this.currentGoal.transactions[index];

        // Open edit modal
        const modal = document.getElementById('edit-transaction-modal');
        const dateEl = document.getElementById('edit-transaction-date');
        const amountInput = document.getElementById('edit-transaction-amount');

        dateEl.textContent = `Date: ${Utils.formatDate(transaction.date, 'long')}`;
        amountInput.value = transaction.amount;

        modal.classList.add('active');
        amountInput.focus();
    }

    closeEditTransactionModal() {
        const modal = document.getElementById('edit-transaction-modal');
        modal.classList.remove('active');
        this.currentTransactionIndex = null;
    }

    async handleEditTransactionSubmit(e) {
        e.preventDefault();

        if (this.currentTransactionIndex === null || !this.currentGoal) return;

        const amount = parseFloat(document.getElementById('edit-transaction-amount').value);

        if (!amount || amount <= 0) {
            Utils.showToast('Please enter a valid amount');
            return;
        }

        try {
            const transaction = this.currentGoal.transactions[this.currentTransactionIndex];
            const oldAmount = transaction.amount;
            const updatedTransactions = [...this.currentGoal.transactions];
            updatedTransactions[this.currentTransactionIndex] = { ...transaction, amount };

            const updatedGoal = {
                ...this.currentGoal,
                transactions: updatedTransactions,
                saved: this.currentGoal.saved - oldAmount + amount
            };

            // Check if goal status should change
            if (updatedGoal.saved >= updatedGoal.target) {
                updatedGoal.status = 'completed';
            } else if (updatedGoal.status === 'completed') {
                updatedGoal.status = 'active';
            }

            await db.update('goals', updatedGoal);
            Utils.showToast('Transaction updated successfully');

            await this.loadGoals();
            this.closeEditTransactionModal();
            this.closeHistoryModal();

            // Reopen history modal to show updated list
            const updatedGoalData = this.goals.find(g => g.id === updatedGoal.id);
            if (updatedGoalData) {
                this.openHistoryModal(updatedGoalData);
            }
        } catch (error) {
            console.error('Failed to edit transaction:', error);
            Utils.showToast('Failed to edit transaction');
        }
    }

    async handleDeleteTransactionClick() {
        if (this.currentTransactionIndex === null || !this.currentGoal) return;

        const transaction = this.currentGoal.transactions[this.currentTransactionIndex];
        const confirmed = await Utils.confirm(
            `Delete this transaction of ${Utils.formatCurrency(transaction.amount, this.currentGoal.currency)}?`,
            'Delete Transaction',
            'Delete'
        );

        if (!confirmed) return;

        try {
            const updatedTransactions = this.currentGoal.transactions.filter((_, i) => i !== this.currentTransactionIndex);
            const updatedGoal = {
                ...this.currentGoal,
                transactions: updatedTransactions,
                saved: this.currentGoal.saved - transaction.amount
            };

            // Check if goal status should change
            if (updatedGoal.saved < updatedGoal.target && updatedGoal.status === 'completed') {
                updatedGoal.status = 'active';
            }

            await db.update('goals', updatedGoal);
            Utils.showToast('Transaction deleted successfully');

            await this.loadGoals();
            this.closeEditTransactionModal();
            this.closeHistoryModal();

            // Reopen history modal to show updated list
            const updatedGoalData = this.goals.find(g => g.id === updatedGoal.id);
            if (updatedGoalData) {
                this.openHistoryModal(updatedGoalData);
            }
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            Utils.showToast('Failed to delete transaction');
        }
    }

    async deleteTransaction(index) {
        if (!this.currentGoal || !this.currentGoal.transactions[index]) return;

        const transaction = this.currentGoal.transactions[index];
        const confirmed = await Utils.confirm(
            `Delete this transaction of ${Utils.formatCurrency(transaction.amount, this.currentGoal.currency)}?`,
            'Delete Transaction',
            'Delete'
        );

        if (!confirmed) return;

        try {
            const updatedTransactions = this.currentGoal.transactions.filter((_, i) => i !== index);
            const updatedGoal = {
                ...this.currentGoal,
                transactions: updatedTransactions,
                saved: this.currentGoal.saved - transaction.amount
            };

            // Check if goal status should change
            if (updatedGoal.saved < updatedGoal.target && updatedGoal.status === 'completed') {
                updatedGoal.status = 'active';
            }

            await db.update('goals', updatedGoal);
            Utils.showToast('Transaction deleted successfully');

            await this.loadGoals();
            this.closeHistoryModal();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            Utils.showToast('Failed to delete transaction');
        }
    }

    // Get goals summary for home page
    async getGoalsSummary() {
        try {
            const goals = await db.getAll('goals');
            const activeGoals = goals.filter(g => g.status === 'active');
            const completedGoals = goals.filter(g => g.status === 'completed');

            const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
            const totalTarget = activeGoals.reduce((sum, g) => sum + g.target, 0);

            return {
                totalGoals: goals.length,
                activeGoals: activeGoals.length,
                completedGoals: completedGoals.length,
                totalSaved,
                totalTarget,
                progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
            };
        } catch (error) {
            console.error('Failed to get goals summary:', error);
            return {
                totalGoals: 0,
                activeGoals: 0,
                completedGoals: 0,
                totalSaved: 0,
                totalTarget: 0,
                progress: 0
            };
        }
    }
}

// Create global instance
const goalsManager = new GoalsManager();
