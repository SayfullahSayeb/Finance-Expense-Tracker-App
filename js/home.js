// ===================================
// Home Page Manager
// ===================================

class HomeManager {
    constructor() {
        this.currency = 'BDT';
        // Load privacy preference from localStorage
        this.privacyMode = localStorage.getItem('privacyMode') === 'true';
    }

    async init() {
        // Load currency preference
        const savedCurrency = await db.getSetting('currency');
        if (savedCurrency) {
            this.currency = savedCurrency;
        }

        await this.render();
        // Set initial icon state based on saved preference
        this.updatePrivacyIcon();
    }

    async render() {
        await this.updateGreeting();
        await this.updateHeaderCard();
        await this.renderTransactionsHistory();
        await this.updateExpenseOverview();
        await this.updateSavings();
        await this.updateBudget();
    }

    togglePrivacy() {
        this.privacyMode = !this.privacyMode;
        // Save preference to localStorage
        localStorage.setItem('privacyMode', this.privacyMode.toString());
        this.updatePrivacyIcon();

        // Re-render to update amounts
        this.updateHeaderCard();
    }

    updatePrivacyIcon() {
        const icon = document.getElementById('privacy-icon');
        if (!icon) return;

        if (this.privacyMode) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    formatAmount(amount) {
        if (this.privacyMode) {
            return '****';
        }
        return Utils.formatCurrency(amount, this.currency);
    }

    async updateGreeting() {
        const hour = new Date().getHours();
        let greeting;

        if (hour >= 6 && hour < 12) {
            greeting = lang.translate('goodMorning');
        } else if (hour >= 12 && hour < 15) {
            greeting = lang.translate('goodAfternoon');
        } else if (hour >= 15 && hour < 20) {
            greeting = lang.translate('goodEvening');
        } else {
            greeting = lang.translate('goodNight');
        }

        document.getElementById('greeting-time').textContent = greeting;

        // Update user name
        const userName = await db.getSetting('userName') || lang.translate('yourName');
        document.getElementById('user-name').textContent = userName;
    }

    async updateHeaderCard() {
        // Get ALL transactions for current balance (cumulative)
        const allTransactions = await db.getAll('transactions');
        const allIncome = Utils.calculateTotal(allTransactions, 'income');
        const allExpense = Utils.calculateTotal(allTransactions, 'expense');
        const currentBalance = allIncome - allExpense;

        // Get THIS MONTH's transactions for display
        const { start, end } = Utils.getMonthRange();
        const monthTransactions = await db.getTransactionsByDateRange(start, end);
        const monthIncome = Utils.calculateTotal(monthTransactions, 'income');
        const monthExpense = Utils.calculateTotal(monthTransactions, 'expense');

        // Format current balance with proper sign
        const balanceText = currentBalance < 0
            ? '-' + this.formatAmount(Math.abs(currentBalance))
            : this.formatAmount(currentBalance);

        // Update display
        document.getElementById('total-balance').textContent = balanceText;
        document.getElementById('header-income').textContent = this.formatAmount(monthIncome);
        document.getElementById('header-expense').textContent = this.formatAmount(monthExpense);

        // Apply color based on balance
        const balanceElement = document.getElementById('total-balance');
        if (currentBalance < 0) {
            balanceElement.style.color = '#FF3B30'; // Red for negative
        } else {
            balanceElement.style.color = 'white'; // White for positive
        }
    }

    async renderTransactionsHistory() {
        const container = document.getElementById('home-transactions-list');

        try {
            const allTransactions = await db.getAll('transactions');

            if (!allTransactions || allTransactions.length === 0) {
                container.innerHTML = '<p class="no-transactions">No transactions yet</p>';
                return;
            }

            // Sort by creation time (newest added first) and take first 4
            const recentTransactions = allTransactions
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 4);

            // Payment method icons
            const paymentIcons = {
                'cash': 'fa-money-bill-wave',
                'card': 'fa-credit-card',
                'mobile': 'fa-mobile-alt',
                'bank': 'fa-university'
            };

            container.innerHTML = recentTransactions.map(transaction => {
                // Get emoji with fallback
                const emoji = categoriesManager.getCategoryEmoji(transaction.category) || '➕';

                // Format date
                const transDate = new Date(transaction.date);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                let dateStr;
                if (transDate.toDateString() === today.toDateString()) {
                    dateStr = 'Today';
                } else if (transDate.toDateString() === yesterday.toDateString()) {
                    dateStr = 'Yesterday';
                } else {
                    dateStr = transDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                // Get payment method
                const paymentIcon = paymentIcons[transaction.paymentMethod] || 'fa-wallet';
                const paymentMethodName = lang.translate(transaction.paymentMethod || 'cash');

                const amountClass = transaction.type === 'income' ? 'income' : 'expense';
                const amountPrefix = transaction.type === 'income' ? '+ ' : '- ';

                return `
                    <div class="transaction-item ${transaction.type}">
                        <div class="transaction-info">
                            <div class="transaction-icon">
                                <span class="category-icon">${emoji}</span>
                            </div>
                            <div class="transaction-details">
                                <span class="category-name">${transaction.category || 'Unknown'}</span>
                                <span class="transaction-note" style="font-size: var(--font-size-sm); color: var(--text-tertiary); display: flex; align-items: center; gap: 4px;">
                                    <i class="fas ${paymentIcon}" style="font-size: 10px;"></i>
                                    ${paymentMethodName} • ${dateStr}
                                </span>
                            </div>
                        </div>
                        <span class="transaction-amount ${amountClass}">
                            ${amountPrefix}${Utils.formatCurrency(transaction.amount, this.currency)}
                        </span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error rendering transactions history:', error);
            container.innerHTML = '<p class="no-transactions">No transactions yet</p>';
        }
    }

    async updateExpenseOverview() {
        // Today
        const { start: todayStart, end: todayEnd } = Utils.getTodayRange();
        const todayTx = await db.getTransactionsByDateRange(todayStart, todayEnd);
        const todayExpense = Utils.calculateTotal(todayTx, 'expense');

        // Month
        const { start: monthStart, end: monthEnd } = Utils.getMonthRange();
        const monthTx = await db.getTransactionsByDateRange(monthStart, monthEnd);
        const monthExpense = Utils.calculateTotal(monthTx, 'expense');

        // Daily Avg
        const dayOfMonth = Math.max(1, new Date().getDate());
        const avgDaily = monthExpense / dayOfMonth;

        // Generate motivational message based on spending
        let statusMessage = '';
        let statusClass = '';

        if (monthExpense === 0) {
            statusMessage = lang.translate('noExpensesYet');
            statusClass = 'status-info';
        } else if (todayExpense > avgDaily * 1.5) {
            statusMessage = lang.translate('spendingHigher');
            statusClass = 'status-danger';
        } else if (todayExpense < avgDaily * 0.5 && todayExpense > 0) {
            statusMessage = lang.translate('spendingUnderControl');
            statusClass = 'status-success';
        } else if (todayExpense === 0) {
            statusMessage = lang.translate('noExpensesToday');
            statusClass = 'status-success';
        } else {
            statusMessage = lang.translate('spendingStable');
            statusClass = 'status-info';
        }

        const container = document.getElementById('expense-summary-content');
        if (!container) return;

        container.innerHTML = `
            <div class="expense-overview-grid">
                <p class="expense-status-message ${statusClass}">
                    ${statusMessage}
                </p>
                <div class="expense-sub-stats">
                    <div class="expense-stat-sub">
                        <span class="stat-label">${lang.translate('todaysExpenseLabel')}</span>
                        <span class="stat-value">${Utils.formatCurrency(todayExpense, this.currency)}</span>
                    </div>
                    <div class="expense-stat-sub">
                        <span class="stat-label">${lang.translate('dailyAvgExpenseLabel')}</span>
                        <span class="stat-value">${Utils.formatCurrency(avgDaily, this.currency)}</span>
                    </div>
                </div>
            </div>
        `;
    }



    async updateIncomeVsExpense() {
        const { start, end } = Utils.getMonthRange();
        const transactions = await db.getTransactionsByDateRange(start, end);

        const totalIncome = Utils.calculateTotal(transactions, 'income');
        const totalExpense = Utils.calculateTotal(transactions, 'expense');

        document.getElementById('total-income').textContent =
            Utils.formatCurrency(totalIncome, this.currency);
        document.getElementById('total-expense').textContent =
            Utils.formatCurrency(totalExpense, this.currency);
    }

    async updateSavings() {
        const savingsContent = document.getElementById('savings-content');
        if (!savingsContent) return;

        const { start, end } = Utils.getMonthRange();
        const transactions = await db.getTransactionsByDateRange(start, end);

        const totalIncome = Utils.calculateTotal(transactions, 'income');
        const totalExpense = Utils.calculateTotal(transactions, 'expense');
        const savings = totalIncome - totalExpense;

        // Calculate Rate
        let savingRate = 0;
        if (totalIncome > 0) {
            savingRate = (savings / totalIncome) * 100;
        }

        // Colors & Formatting
        let savingsColor = 'var(--success-color)';
        let progressColor = 'var(--success-color)';
        let rateText = `${Math.max(0, savingRate).toFixed(0)}%`;
        let progressWidth = Math.max(0, Math.min(100, savingRate));

        // Motivational message based on savings
        let savingsMessage = '';
        let savingsMessageColor = '';

        if (totalIncome === 0) {
            savingsMessage = lang.translate('addIncomeToTrack');
            savingsMessageColor = 'var(--text-tertiary)';
        } else if (savings < 0) {
            savingsColor = 'var(--danger-color)';
            progressColor = 'var(--danger-color)';
            rateText = "0%";
            savingsMessage = lang.translate('expensesExceedIncome');
            savingsMessageColor = 'var(--danger-color)';
        } else if (savingRate >= 70) {
            savingsMessage = lang.translate('excellentSaving');
            savingsMessageColor = 'var(--success-color)';
        } else if (savingRate >= 40) {
            savingsMessage = lang.translate('goodJobSaving');
            savingsMessageColor = 'var(--success-color)';
        } else if (savingRate >= 20) {
            savingsMessage = lang.translate('roomToImprove');
            savingsMessageColor = 'var(--text-secondary)';
        } else {
            savingsMessage = lang.translate('trySaveMore');
            savingsMessageColor = 'var(--warning-color)';
        }

        const formattedSavings = savings < 0
            ? '-' + Utils.formatCurrency(Math.abs(savings), this.currency)
            : Utils.formatCurrency(savings, this.currency);

        // Human-friendly description
        const savingsDescription = savings < 0
            ? lang.translate('youSpentMore')
            : lang.translate('youSavedPercent').replace('{percent}', rateText);

        savingsContent.innerHTML = `
            <div class="budget-overview">
                <div class="budget-stat-row">
                     <div class="budget-stat">
                         <span class="stat-label">Savings</span>
                         <span class="stat-value" style="color: ${savingsColor}">${formattedSavings}</span>
                     </div>
                     <div class="budget-stat align-right">
                         <span class="stat-label">Rate</span>
                         <span class="stat-value">${rateText}</span>
                     </div>
                </div>
                
                <div class="budget-progress-container">
                     <div class="progress-bar-modern">
                          <div class="progress-fill-modern" style="width: ${progressWidth}%; background: ${progressColor}"></div>
                     </div>
                     <span class="progress-text" style="color: ${savingsMessageColor}">
                        ${savingsMessage}
                     </span>
                </div>

                <div class="budget-footer-stat">
                    <div style="display:flex; justify-content: space-between; width: 100%;">
                        <div style="display:flex; gap: 6px; align-items:center;">
                             <div style="width:8px; height:8px; border-radius:50%; background:var(--success-color)"></div>
                             <span class="stat-label">${lang.translate('income') || 'Income'}</span>
                             <span class="stat-value" style="font-size: var(--font-size-md); font-weight: 600;">${Utils.formatCurrency(totalIncome, this.currency)}</span>
                        </div>
                        <div style="display:flex; gap: 6px; align-items:center;">
                             <div style="width:8px; height:8px; border-radius:50%; background:var(--danger-color)"></div>
                             <span class="stat-label">${lang.translate('expense') || 'Expense'}</span>
                             <span class="stat-value" style="font-size: var(--font-size-md); font-weight: 600;">${Utils.formatCurrency(totalExpense, this.currency)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async updateBudget() {
        const budget = await db.getSetting('monthlyBudget');
        const budgetContent = document.getElementById('budget-content');

        if (!budgetContent) return;

        if (!budget) {
            budgetContent.innerHTML = `
                <div class="budget-empty-state">
                    <div class="empty-icon-bg">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <p style="color: var(--text-secondary); margin: 0;">${lang.translate('noBudgetSet') || 'Set a monthly budget to track spending.'}</p>
                    <button class="btn-set-budget" onclick="budgetManager.openBudgetModal()">
                        ${lang.translate('setMonthlyBudget') || 'Set Budget'}
                    </button>
                </div>
            `;
            return;
        }

        const { start, end } = Utils.getMonthRange();
        const transactions = await db.getTransactionsByDateRange(start, end);
        const monthExpense = Utils.calculateTotal(transactions, 'expense');
        const remaining = budget - monthExpense;
        const percentage = (monthExpense / budget) * 100;

        // Colors with proper thresholds (Green 0-60%, Yellow 60-90%, Red 90-100%+)
        let progressColor = 'var(--success-color)';
        if (percentage > 90) progressColor = 'var(--danger-color)';
        else if (percentage > 60) progressColor = 'var(--warning-color)';

        // Motivational message based on budget usage
        let budgetMessage = '';
        let budgetMessageColor = '';

        if (percentage >= 100) {
            budgetMessage = lang.translate('budgetExceededMsg');
            budgetMessageColor = 'var(--danger-color)';
        } else if (percentage >= 90) {
            budgetMessage = lang.translate('almostAtLimit');
            budgetMessageColor = 'var(--danger-color)';
        } else if (percentage >= 60) {
            budgetMessage = lang.translate('spendingIncreasing');
            budgetMessageColor = 'var(--warning-color)';
        } else if (percentage >= 30) {
            budgetMessage = lang.translate('managingWell');
            budgetMessageColor = 'var(--success-color)';
        } else {
            budgetMessage = lang.translate('spendingWellControlled');
            budgetMessageColor = 'var(--success-color)';
        }

        const remainingColor = remaining < 0 ? 'var(--danger-color)' : 'var(--success-color)';
        const remainingText = remaining < 0
            ? '-' + Utils.formatCurrency(Math.abs(remaining), this.currency)
            : Utils.formatCurrency(remaining, this.currency);

        // Subtitle description
        const budgetSubtitle = remaining < 0
            ? lang.translate('budgetExceededSub')
            : lang.translate('trackSpendingSub');

        budgetContent.innerHTML = `
            <div class="budget-overview">
                <div class="budget-stat-row">
                     <div class="budget-stat">
                         <span class="stat-label">Budget</span>
                         <span class="stat-value">${Utils.formatCurrency(budget, this.currency)}</span>
                     </div>
                     <div class="budget-stat align-right">
                         <span class="stat-label">${lang.translate('remaining') || 'Remaining'}</span>
                         <span class="stat-value" style="color: ${remainingColor}">${remainingText}</span>
                     </div>
                </div>
                
                <div class="budget-progress-container">
                     <div class="progress-bar-modern">
                          <div class="progress-fill-modern" style="width: ${Math.min(100, Math.max(0, (remaining / budget) * 100))}%; background: ${progressColor}"></div>
                     </div>
                     <span class="progress-text" style="color: ${budgetMessageColor}">${budgetMessage}</span>
                </div>

                <div class="budget-footer-stat">
                    <span class="stat-label">Spent</span>
                    <span class="stat-value" style="font-size: var(--font-size-md);">${Utils.formatCurrency(monthExpense, this.currency)}</span>
                </div>
            </div>
        `;
    }

    async updateMotivationalMessage() {
        const { start: todayStart, end: todayEnd } = Utils.getTodayRange();
        const { start: monthStart, end: monthEnd } = Utils.getMonthRange();

        const todayTransactions = await db.getTransactionsByDateRange(todayStart, todayEnd);
        const monthTransactions = await db.getTransactionsByDateRange(monthStart, monthEnd);

        const todayExpense = Utils.calculateTotal(todayTransactions, 'expense');
        const monthExpense = Utils.calculateTotal(monthTransactions, 'expense');
        const budget = await db.getSetting('monthlyBudget');

        const message = Utils.getMotivationalMessage(todayExpense, monthExpense, budget);
        document.getElementById('motivational-message').textContent = message;

        // Set background color based on expense level
        const card = document.getElementById('motivational-card');
        if (card) {
            const avgDaily = monthExpense / Math.max(1, new Date().getDate());
            let bgColor, textColor;

            if (todayExpense === 0) {
                bgColor = '#d4edda'; // Green
                textColor = '#155724';
            } else if (todayExpense > avgDaily * 1.5) {
                bgColor = '#f8d7da'; // Red
                textColor = '#721c24';
            } else if (budget && monthExpense > budget) {
                bgColor = '#f8d7da'; // Red
                textColor = '#721c24';
            } else if (todayExpense < avgDaily * 0.5) {
                bgColor = '#d1ecf1'; // Light Blue
                textColor = '#0c5460';
            } else if (budget && monthExpense < budget * 0.7) {
                bgColor = '#d1ecf1'; // Light Blue
                textColor = '#0c5460';
            } else {
                bgColor = '#fff3cd'; // Yellow
                textColor = '#856404';
            }

            card.style.background = 'none'; // Clear gradient
            card.style.backgroundColor = bgColor;
            card.style.color = textColor;
        }
    }
}

// Create global home manager instance
const homeManager = new HomeManager();
