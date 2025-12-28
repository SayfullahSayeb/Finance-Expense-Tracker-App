// ===================================
// Main Application Controller
// ===================================

class App {
    constructor() {
        this.currentPage = 'home';
    }

    async init() {
        try {
            // Initialize database
            await db.init();

            // Initialize language system
            await lang.init();

            // Initialize categories
            await categoriesManager.init();

            // Initialize all managers
            await homeManager.init();
            await transactionsManager.init();
            await analysisManager.init();
            await budgetManager.init();
            await exportManager.init();
            await settingsManager.init();

            // Setup navigation
            this.setupNavigation();

            // Navigate to the page based on URL hash, or default to home
            const initialHash = window.location.hash.slice(1);
            const initialPage = (initialHash && ['home', 'transactions', 'analysis', 'settings'].includes(initialHash))
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
                const page = e.currentTarget.dataset.page;

                // Only navigate if the item has a data-page attribute
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Listen for hash changes (browser back/forward buttons)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1); // Remove the '#'
            const page = hash || 'home';

            // Close all modals when navigating
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });

            this.navigateTo(page, false); // Don't update hash again
        });
    }

    async navigateTo(pageName, updateHash = true) {
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
            case 'settings':
                // Settings are already loaded
                break;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
