// ===================================
// Main Application Controller
// ===================================

class App {
    constructor() {
        this.currentPage = 'home';
    }

    async init() {
        try {
            // Initialize profile manager first (before database)
            await profileManager.init();

            // Migrate existing data to personal profile if needed
            await profileManager.migrateExistingData();

            // Initialize database with profile-specific name
            await db.init();

            // Initialize language system
            await lang.init();

            // Initialize categories
            await categoriesManager.init();

            // Initialize demo mode
            await demoModeManager.init();

            // Initialize all managers
            await homeManager.init();
            await transactionsManager.init();
            await analysisManager.init();
            await budgetManager.init();
            await goalsManager.init();
            await exportManager.init();
            await settingsManager.init();

            // Setup profile manager event listeners
            profileManager.setupEventListeners();

            // Setup navigation
            this.setupNavigation();

            // Navigate to the page based on URL hash, or default to home
            const initialHash = window.location.hash.slice(1);
            const initialPage = (initialHash && ['home', 'transactions', 'analysis', 'goals', 'settings'].includes(initialHash))
                ? initialHash
                : 'home';
            this.navigateTo(initialPage, false);

        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize the app. Please refresh the page.');
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = e.currentTarget.dataset.page;

                // Only navigate if the item has a data-page attribute
                if (page) {
                    // Close all modals before navigating
                    this.closeAllModals();
                    this.navigateTo(page);
                }
            });
        });

        // Listen for hash changes (browser back/forward buttons)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1); // Remove the '#'
            const page = hash || 'home';

            // Close all modals when navigating
            this.closeAllModals();

            this.navigateTo(page, false); // Don't update hash again
        });

        // Setup page navigation buttons (Transactions <-> Analysis)
        const gotoAnalysisBtn = document.getElementById('goto-analysis-btn');
        if (gotoAnalysisBtn) {
            gotoAnalysisBtn.addEventListener('click', () => {
                window.location.hash = 'analysis';
            });
        }

        const gotoTransactionsBtn = document.getElementById('goto-transactions-btn');
        if (gotoTransactionsBtn) {
            gotoTransactionsBtn.addEventListener('click', () => {
                window.location.hash = 'transactions';
            });
        }
    }

    async navigateTo(pageName, updateHash = true) {
        // Scroll to top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Update URL hash if needed
        if (updateHash) {
            window.location.hash = pageName;
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const selectedPage = document.getElementById(`${pageName}-page`);
        if (selectedPage) {
            selectedPage.classList.add('active');
            // Also scroll the page content to top
            selectedPage.scrollTop = 0;
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // Update page content
        this.currentPage = pageName;

        switch (pageName) {
            case 'home':
                await homeManager.render();
                break;
            case 'transactions':
                await transactionsManager.render();
                break;
            case 'analysis':
                await analysisManager.render();
                break;
            case 'goals':
                await goalsManager.loadGoals();
                break;
            case 'settings':
                // Settings are already loaded
                break;
        }
    }

    closeAllModals() {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });

        // Remove any modal backdrops that might be lingering
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.remove();
        });

        // Reset body overflow (in case a modal locked scrolling)
        document.body.style.overflow = '';

        // Clear any active confirm/alert dialogs
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal) {
            confirmModal.classList.remove('active');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
