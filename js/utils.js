// ===================================
// Utility Functions
// ===================================

class Utils {
    // Format currency
    static formatCurrency(amount, currencyCode = 'BDT') {
        const symbols = {
            'BDT': '৳',
            'USD': '$',
            'EUR': '€',
            'INR': '₹'
        };

        const symbol = symbols[currencyCode] || currencyCode;
        const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        return `${symbol}${formattedAmount}`;
    }

    // Format date
    static formatDate(date, format = 'short') {
        const d = new Date(date);

        if (format === 'short') {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (format === 'time') {
            return d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (format === 'input') {
            return d.toISOString().split('T')[0];
        }

        return d.toLocaleDateString();
    }

    // Get today's date range
    static getTodayRange() {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        return { start, end };
    }

    // Get this month's date range
    static getMonthRange(offset = 0) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() + offset, 1, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0, 23, 59, 59);
        return { start, end };
    }

    // Get this week's date range
    static getWeekRange() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    // Get this year's date range
    static getYearRange() {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
        const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        return { start, end };
    }

    // Calculate total from transactions
    static calculateTotal(transactions, type = null) {
        return transactions
            .filter(t => type ? t.type === type : true)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    // Group transactions by category
    static groupByCategory(transactions) {
        const grouped = {};

        transactions.forEach(t => {
            if (!grouped[t.category]) {
                grouped[t.category] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }
            grouped[t.category].total += parseFloat(t.amount);
            grouped[t.category].count++;
            grouped[t.category].transactions.push(t);
        });

        return grouped;
    }

    // Group transactions by date
    static groupByDate(transactions) {
        const grouped = {};

        transactions.forEach(t => {
            const date = this.formatDate(t.date, 'input');
            if (!grouped[date]) {
                grouped[date] = {
                    total: 0,
                    transactions: []
                };
            }
            grouped[date].total += parseFloat(t.amount);
            grouped[date].transactions.push(t);
        });

        return grouped;
    }

    // Show toast notification
    static showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Custom confirm dialog
    static confirm(message, title = 'Confirm Action', okText = 'Delete') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const cancelBtn = document.getElementById('confirm-cancel');
            const okBtn = document.getElementById('confirm-ok');

            titleEl.textContent = title;
            messageEl.textContent = message;
            okBtn.textContent = okText;

            modal.classList.add('active');

            const handleCancel = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(false);
            };

            const handleOk = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(true);
            };

            const cleanup = () => {
                cancelBtn.removeEventListener('click', handleCancel);
                okBtn.removeEventListener('click', handleOk);
            };

            cancelBtn.addEventListener('click', handleCancel);
            okBtn.addEventListener('click', handleOk);
        });
    }

    // Render empty state
    static renderEmptyState(container, icon, message) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Validate transaction form
    static validateTransaction(data) {
        const errors = [];

        if (!data.amount || parseFloat(data.amount) <= 0) {
            errors.push('Amount must be greater than 0');
        }

        if (!data.category) {
            errors.push('Please select a category');
        }

        if (!data.date) {
            errors.push('Please select a date');
        }

        return errors;
    }

    // Get motivational message based on spending
    static getMotivationalMessage(todayExpense, monthExpense, budget) {
        const avgDaily = monthExpense / new Date().getDate();

        if (todayExpense === 0) {
            return lang.translate('motivational.noExpense');
        } else if (todayExpense > avgDaily * 1.5) {
            return lang.translate('motivational.highSpending');
        } else if (todayExpense < avgDaily * 0.5) {
            return lang.translate('motivational.goodSpending');
        } else if (budget && monthExpense < budget * 0.7) {
            return lang.translate('motivational.savingWell');
        } else if (budget && monthExpense > budget) {
            return lang.translate('motivational.overspending');
        } else {
            return lang.translate('motivational.goodSpending');
        }
    }

    // Generate insights
    static generateInsights(currentMonthTransactions, lastMonthTransactions) {
        const insights = [];

        // Calculate totals
        const currentTotal = this.calculateTotal(currentMonthTransactions, 'expense');
        const lastTotal = this.calculateTotal(lastMonthTransactions, 'expense');

        // Overall spending comparison
        if (lastTotal > 0) {
            const percentChange = ((currentTotal - lastTotal) / lastTotal * 100).toFixed(1);
            const changeType = currentTotal > lastTotal ? 'negative' : 'positive';
            const changeWord = currentTotal > lastTotal ?
                lang.translate('insightIncrease') :
                lang.translate('insightDecrease');

            insights.push({
                type: changeType,
                text: `${lang.translate('expense')} ${changeWord} ${Math.abs(percentChange)}% ${lang.translate('insightComparedToLast')}`
            });
        }

        // Category-wise comparison
        const currentByCategory = this.groupByCategory(currentMonthTransactions.filter(t => t.type === 'expense'));
        const lastByCategory = this.groupByCategory(lastMonthTransactions.filter(t => t.type === 'expense'));

        for (const category in currentByCategory) {
            if (lastByCategory[category]) {
                const currentCatTotal = currentByCategory[category].total;
                const lastCatTotal = lastByCategory[category].total;
                const percentChange = ((currentCatTotal - lastCatTotal) / lastCatTotal * 100).toFixed(1);

                if (Math.abs(percentChange) > 20) {
                    const changeType = currentCatTotal > lastCatTotal ? 'warning' : 'positive';
                    const changeWord = currentCatTotal > lastCatTotal ?
                        lang.translate('insightIncrease') :
                        lang.translate('insightDecrease');

                    insights.push({
                        type: changeType,
                        text: `${lang.translate(category.toLowerCase())} ${changeWord} ${Math.abs(percentChange)}% ${lang.translate('insightThisMonth')}`
                    });
                }
            }
        }

        // Limit to 5 insights
        return insights.slice(0, 5);
    }

    // Export to CSV
    static exportToCSV(transactions) {
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Note'];
        const rows = transactions.map(t => [
            this.formatDate(t.date),
            t.type,
            t.category,
            t.amount,
            t.paymentMethod,
            t.note || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    // Download file
    static downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const modals = document.querySelectorAll('.modal');

    function lockBodyScroll() {
        document.body.classList.add('modal-open');
    }

    function unlockBodyScroll() {
        const hasActiveModal = document.querySelector('.modal.active');
        if (!hasActiveModal) {
            document.body.classList.remove('modal-open');
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('modal')) {
                    if (target.classList.contains('active')) {
                        lockBodyScroll();
                    } else {
                        unlockBodyScroll();
                    }
                }
            }
        });
    });

    modals.forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                unlockBodyScroll();
            }
        });
    });
});
