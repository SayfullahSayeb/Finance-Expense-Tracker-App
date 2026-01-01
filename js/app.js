// ===================================
// Main Application Controller
// ===================================

class App {
    constructor() {
        // Navigation is now handled by navigationManager
    }

    async init() {
        try {
            // Initialize profile manager first (before database)
            await profileManager.init();

            // Migrate existing data to personal profile if needed
            await profileManager.migrateExistingData();

            // Initialize database with profile-specific name
            await db.init();

            // Apply saved theme immediately to prevent browser override
            await this.initializeTheme();

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
            await notificationsManager.init();

            // Setup profile manager event listeners
            profileManager.setupEventListeners();

            // Initialize navigation manager (must be after all other managers)
            navigationManager.init();

            // Hide loading screen after everything is initialized
            if (typeof loadingScreen !== 'undefined') {
                loadingScreen.hide();
            }

        } catch (error) {
            console.error('Initialization error:', error);
            // Hide loading screen even on error
            if (typeof loadingScreen !== 'undefined') {
                loadingScreen.hide();
            }
            alert('Failed to initialize the app. Please refresh the page.');
        }
    }

    async initializeTheme() {
        const savedTheme = await db.getSetting('theme') || 'light';

        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (savedTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
