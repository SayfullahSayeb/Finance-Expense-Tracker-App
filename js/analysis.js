// ===================================
// Analysis Manager
// ===================================

class AnalysisManager {
    constructor() {
        this.currentPeriod = 'month'; // week, month, year
        this.expenseChart = null;
        this.categoryChart = null;
        this.currency = 'BDT';
    }

    async init() {
        // Load currency preference
        const savedCurrency = await db.getSetting('currency');
        if (savedCurrency) {
            this.currency = savedCurrency;
        }

        this.setupEventListeners();
        await this.render();
    }

    setupEventListeners() {
        // Period selectors
        document.querySelectorAll('.btn-period').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.render();
            });
        });
    }

    async render() {
        await this.renderHealthCard();
        await this.renderCategoryChart();
        await this.renderStats();
    }

    async renderHealthCard() {
        const container = document.getElementById('analysis-health-card');
        if (!container) return;

        // Calculate data
        const range = this.currentPeriod === 'month' ? Utils.getMonthRange() :
            (this.currentPeriod === 'week' ? Utils.getWeekRange() : Utils.getYearRange());

        const transactions = await db.getTransactionsByDateRange(range.start, range.end);
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpense = Utils.calculateTotal(expenses);

        // Get budget
        let budget = 0;
        let budgetPeriod = 'Monthly';

        if (this.currentPeriod === 'month') {
            budget = await db.getSetting('monthlyBudget') || 0;
            budgetPeriod = lang.translate('monthly');
        } else if (this.currentPeriod === 'week') {
            const monthlyBudget = await db.getSetting('monthlyBudget') || 0;
            budget = monthlyBudget / 4; // Approx weekly budget
            budgetPeriod = lang.translate('weekly');
        } else {
            const monthlyBudget = await db.getSetting('monthlyBudget') || 0;
            budget = monthlyBudget * 12;
            budgetPeriod = lang.translate('yearly');
        }

        let statusText = '';
        let statusColor = '';
        let progressPercent = 0;
        let adviceText = '';

        let safeDailySpend = 0;
        let showSafeDaily = false;

        if (budget > 0) {
            progressPercent = (totalExpense / budget) * 100;
            const remaining = Math.max(0, budget - totalExpense);

            // Calculate safe daily spend if monthly view
            if (this.currentPeriod === 'month') {
                const today = new Date();
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                const daysLeft = Math.max(1, daysInMonth - today.getDate());
                safeDailySpend = remaining / daysLeft;
                showSafeDaily = true;
            }

            if (progressPercent > 100) {
                statusText = lang.translate('statusDanger');
                statusColor = 'var(--danger-color)';
                adviceText = lang.translate('adviceBudget');
            } else if (progressPercent > 90) {
                statusText = lang.translate('statusWarning');
                statusColor = '#ff9800'; // Orange
                adviceText = lang.translate('adviceSave');
            } else if (progressPercent > 70) {
                statusText = lang.translate('statusGood');
                statusColor = 'var(--primary-color)';
                adviceText = lang.translate('adviceGreat');
            } else {
                statusText = lang.translate('statusGreat');
                statusColor = 'var(--success-color)';
                adviceText = lang.translate('adviceGreat');
            }
        } else {
            statusText = lang.translate('financialHealth');
            statusColor = 'var(--primary-color)';
            progressPercent = 0;
            adviceText = lang.translate('setMonthlyBudget');
        }

        container.innerHTML = `
            <div class="card health-card">
                <div class="card-header">
                    <h3 style="color: ${statusColor}">${statusText}</h3>
                    <i class="fas fa-heartbeat card-icon" style="color: ${statusColor}"></i>
                </div>
                
                <div class="card-body">
                    <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">${adviceText}</p>
                    
                    <div class="budget-overview">
                        <div class="budget-stat-row">
                            <div class="budget-stat">
                                <span class="stat-label">${lang.translate('totalSpent')}</span>
                                <span class="stat-value" style="color: var(--text-primary);">${Utils.formatCurrency(totalExpense, this.currency)}</span>
                            </div>
                            <div class="budget-stat align-right">
                                <span class="stat-label">${budgetPeriod} Budget</span>
                                <span class="stat-value">${Utils.formatCurrency(budget, this.currency)}</span>
                            </div>
                        </div>

                        ${budget > 0 ? `
                            <div class="budget-progress-container">
                                <div class="progress-bar-modern">
                                    <div class="progress-fill-modern" style="width: ${Math.min(progressPercent, 100)}%; background: ${statusColor}"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                                    <span class="progress-text" style="color: var(--text-secondary);">${Math.round(progressPercent)}% used</span>
                                    <span class="progress-text" style="color: ${statusColor};">${Utils.formatCurrency(Math.max(0, budget - totalExpense), this.currency)} left</span>
                                </div>
                            </div>
                            
                            ${showSafeDaily && safeDailySpend > 0 ? `
                                <div style="background: rgba(var(--primary-rgb, 67, 136, 131), 0.08); padding: 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                                    <div>
                                        <span style="display: block; font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${lang.translate('safeDaily')}</span>
                                        <span style="font-size: 1.1rem; font-weight: bold; color: var(--primary-color);">${Utils.formatCurrency(safeDailySpend, this.currency)}<span style="font-size: 0.8rem; font-weight: normal; color: var(--text-tertiary); margin-left: 4px;">/${lang.translate('day')}</span></span>
                                    </div>
                                    <i class="fas fa-shield-halved" style="color: var(--primary-color); opacity: 0.5; font-size: 1.4rem;"></i>
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async renderStats() {
        let range;

        if (this.currentPeriod === 'week') {
            range = Utils.getWeekRange();
        } else if (this.currentPeriod === 'month') {
            range = Utils.getMonthRange();
        } else {
            range = Utils.getYearRange();
        }

        const transactions = await db.getTransactionsByDateRange(range.start, range.end);
        const expenses = transactions.filter(t => t.type === 'expense');

        // =========================
        // Time References
        // =========================
        const today = new Date();
        const dayMs = 1000 * 60 * 60 * 24;

        let effectiveToday = today;
        if (today < range.start) effectiveToday = range.start;
        if (today > range.end)   effectiveToday = range.end;

        let daysPassed = Math.floor((effectiveToday - range.start) / dayMs) + 1;
        if (daysPassed < 1) daysPassed = 1;

        let daysRemaining = Math.ceil((range.end - effectiveToday) / dayMs) + 1;
        if (daysRemaining < 1) daysRemaining = 1;

        const totalExpense = Utils.calculateTotal(expenses);

        // =========================
        // Avg Daily Spend
        // =========================
        const avgDaily = totalExpense > 0 ? (totalExpense / daysPassed) : 0;
        document.getElementById('avg-daily').textContent = 
            Utils.formatCurrency(avgDaily, this.currency);

        // =========================
        // Budget
        // =========================
        const monthlyBudget = await db.getSetting('monthlyBudget');
        const budgetLabel = document.querySelector('.stat-item .stat-label[data-lang="monthlyBudget"]');
        const budgetElement = document.getElementById('analysis-budget');
        const remainingElement = document.getElementById('budget-remaining');
        const suggestedElement = document.getElementById('suggested-daily');

        if (!monthlyBudget) {
            if (budgetLabel) budgetLabel.textContent = lang.translate('monthly') + ' Budget';
            budgetElement.textContent = '-';
            remainingElement.textContent = '-';
            remainingElement.style.color = 'var(--primary-color)';
            if (suggestedElement) suggestedElement.textContent = '-';
            return;
        }

        const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dailyBudget = monthlyBudget / daysInCurrentMonth;

        let calculatedBudget = 0;

        if (this.currentPeriod === 'week') {
            calculatedBudget = dailyBudget * 7;
            if (budgetLabel) budgetLabel.textContent = lang.translate('weekly') + ' Budget';
        } 
        else if (this.currentPeriod === 'year') {
            calculatedBudget = monthlyBudget * 12;
            if (budgetLabel) budgetLabel.textContent = lang.translate('yearly') + ' Budget';
        } 
        else {
            calculatedBudget = monthlyBudget;
            if (budgetLabel) budgetLabel.textContent = lang.translate('monthly') + ' Budget';
        }

        // Show budget
        budgetElement.textContent = Utils.formatCurrency(calculatedBudget, this.currency);

        // Remaining
        const remaining = calculatedBudget - totalExpense;

        if (remaining < 0) {
            remainingElement.style.color = 'var(--danger-color)';
            remainingElement.textContent = '-' + Utils.formatCurrency(Math.abs(remaining), this.currency);
        } else {
            remainingElement.style.color = 'var(--success-color)';
            remainingElement.textContent = Utils.formatCurrency(remaining, this.currency);
        }

        // =========================
        // Suggested Daily
        // =========================
        let suggestedDaily = 0;

        if (this.currentPeriod === 'month') {
            suggestedDaily = monthlyBudget / daysInCurrentMonth;
        }
        else if (this.currentPeriod === 'week') {
            suggestedDaily = calculatedBudget / 7;
        }
        else {
            const daysInYear =
                (new Date(today.getFullYear(), 11, 31) -
                new Date(today.getFullYear(), 0, 1)) / dayMs + 1;

            suggestedDaily = calculatedBudget / daysInYear;
        }

    if (suggestedElement)
    suggestedElement.textContent = Utils.formatCurrency(suggestedDaily, this.currency);

    }


    async renderCategoryChart() {
        const canvas = document.getElementById('category-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const { labels, data, colors } = await this.getCategoryData();

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async getCategoryData() {
        let range;

        if (this.currentPeriod === 'week') {
            range = Utils.getWeekRange();
        } else if (this.currentPeriod === 'month') {
            range = Utils.getMonthRange();
        } else {
            range = Utils.getYearRange();
        }

        const transactions = await db.getTransactionsByDateRange(range.start, range.end);
        const expenses = transactions.filter(t => t.type === 'expense');
        const grouped = Utils.groupByCategory(expenses);

        const labels = [];
        const data = [];
        const colors = [];

        for (const category in grouped) {
            labels.push(lang.translate(category.toLowerCase()));
            data.push(grouped[category].total);
            colors.push(categoriesManager.getCategoryColor(category));
        }

        return { labels, data, colors };
    }
}

// Create global analysis manager instance
const analysisManager = new AnalysisManager();
