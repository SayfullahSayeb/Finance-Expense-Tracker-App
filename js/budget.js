class BudgetManager {
    constructor() {
        this.currency = 'BDT';
    }

    async init() {
        // Load currency preference
        const savedCurrency = await db.getSetting('currency');
        if (savedCurrency) {
            this.currency = savedCurrency;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Set budget button
        document.getElementById('set-budget-btn').addEventListener('click', () => {
            this.openBudgetModal();
        });

        // Budget form
        document.getElementById('budget-form').addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Modal controls
        document.getElementById('close-budget-modal').addEventListener('click', () => {
            this.closeBudgetModal();
        });

        document.getElementById('cancel-budget-btn').addEventListener('click', () => {
            this.closeBudgetModal();
        });
    }

    async openBudgetModal() {
        const modal = document.getElementById('budget-modal');
        const currentBudget = await db.getSetting('monthlyBudget');

        if (currentBudget) {
            document.getElementById('budget-amount').value = currentBudget;
        } else {
            document.getElementById('budget-amount').value = '';
        }

        modal.classList.add('active');
    }

    closeBudgetModal() {
        const modal = document.getElementById('budget-modal');
        modal.classList.remove('active');
    }

    async handleSubmit(e) {
        e.preventDefault();

        const budgetAmount = parseFloat(document.getElementById('budget-amount').value);

        if (budgetAmount <= 0) {
            Utils.showToast('Budget amount must be greater than 0');
            return;
        }

        try {
            await db.setSetting('monthlyBudget', budgetAmount);
            Utils.showToast(lang.translate('budgetSet'));
            this.closeBudgetModal();

            // Update settings page budget display
            if (document.getElementById('settings-page').classList.contains('active')) {
                await settingsManager.loadBudget();
            }

            // Update home page budget display
            if (document.getElementById('home-page').classList.contains('active')) {
                await homeManager.updateBudget();
            }
        } catch (error) {
            console.error('Error setting budget:', error);
            Utils.showToast('Error setting budget');
        }
    }
}

// Create global budget manager instance
const budgetManager = new BudgetManager();
