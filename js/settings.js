// ===================================
// Settings Manager
// ===================================

class SettingsManager {
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        // Load language
        const language = await db.getSetting('language') || 'en';
        document.getElementById('language-select').value = language;

        // Load theme - default to system
        const theme = await db.getSetting('theme') || 'system';
        document.getElementById('theme-select').value = theme;
        this.applyTheme(theme);

        // Load currency
        const currency = await db.getSetting('currency') || 'BDT';
        document.getElementById('currency-select').value = currency;

        // Load and display budget
        await this.loadBudget();

        // Load user name and update header
        const userName = await db.getSetting('userName') || 'Amar Taka';
        const headerName = document.getElementById('settings-display-name');
        if (headerName) {
            headerName.textContent = userName;
        }

        // Load demo mode state
        const demoMode = localStorage.getItem('demoMode') === 'true';
        document.getElementById('demo-mode-toggle').checked = demoMode;
    }

    setupEventListeners() {
        // Name modal interactions
        const nameModal = document.getElementById('name-modal');
        const nameForm = document.getElementById('name-form');
        const nameInput = document.getElementById('name-input');

        // Open modal
        document.getElementById('set-name-card').addEventListener('click', async () => {
            const userName = await db.getSetting('userName') || '';
            nameInput.value = userName;
            nameModal.classList.add('active');
            nameInput.focus();
        });

        // Close modal
        const closeNameModal = () => {
            nameModal.classList.remove('active');
        };

        document.getElementById('close-name-modal').addEventListener('click', closeNameModal);
        document.getElementById('cancel-name-btn').addEventListener('click', closeNameModal);

        // Save name
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userName = nameInput.value.trim();

            if (userName) {
                await db.setSetting('userName', userName);

                // Update settings header
                const headerName = document.getElementById('settings-display-name');
                if (headerName) {
                    headerName.textContent = userName;
                }

                Utils.showToast('Name saved successfully!');
                closeNameModal();

                // Update home page header
                if (document.getElementById('home-page').classList.contains('active')) {
                    await homeManager.render();
                }
            } else {
                Utils.showToast('Please enter a name');
            }
        });

        // Language change
        document.getElementById('language-select').addEventListener('change', async (e) => {
            await lang.setLanguage(e.target.value);
            Utils.showToast('Language updated');

            // Refresh all pages
            if (document.getElementById('home-page').classList.contains('active')) {
                await homeManager.render();
            }
            if (document.getElementById('transactions-page').classList.contains('active')) {
                await transactionsManager.render();
            }
            if (document.getElementById('analysis-page').classList.contains('active')) {
                await analysisManager.render();
            }
        });

        // Theme change
        document.getElementById('theme-select').addEventListener('change', async (e) => {
            const theme = e.target.value;
            await db.setSetting('theme', theme);
            this.applyTheme(theme);
            Utils.showToast('Theme updated');
        });

        // Currency change
        document.getElementById('currency-select').addEventListener('change', async (e) => {
            const currency = e.target.value;
            await db.setSetting('currency', currency);
            Utils.showToast('Currency updated');

            // Update all managers
            homeManager.currency = currency;
            transactionsManager.currency = currency;
            analysisManager.currency = currency;
            budgetManager.currency = currency;

            // Refresh current page
            if (document.getElementById('home-page').classList.contains('active')) {
                await homeManager.render();
            }
            if (document.getElementById('transactions-page').classList.contains('active')) {
                await transactionsManager.render();
            }
            if (document.getElementById('analysis-page').classList.contains('active')) {
                await analysisManager.render();
            }

            // Refresh budget display in settings
            if (document.getElementById('settings-page').classList.contains('active')) {
                await this.loadBudget();
            }
        });

        // Manage categories
        document.getElementById('manage-categories-btn').addEventListener('click', () => {
            this.openCategoriesModal();
        });

        document.getElementById('close-categories-modal').addEventListener('click', () => {
            this.closeCategoriesModal();
        });

        // Reset data
        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.resetData();
        });

        // Clear cache and update
        document.getElementById('clear-cache-btn').addEventListener('click', () => {
            this.clearCacheAndUpdate();
        });

        // Demo Mode toggle
        document.getElementById('demo-mode-toggle').addEventListener('change', async (e) => {
            if (e.target.checked) {
                await demoModeManager.enableDemoMode();
            } else {
                await demoModeManager.disableDemoMode();
            }
        });
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // System theme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    async loadBudget() {
        const budget = await db.getSetting('monthlyBudget');
        const budgetDisplay = document.getElementById('budget-amount-display');

        if (budget && budgetDisplay) {
            const currency = await db.getSetting('currency') || 'BDT';
            budgetDisplay.textContent = Utils.formatCurrency(budget, currency);
            budgetDisplay.removeAttribute('data-lang');
        } else if (budgetDisplay) {
            budgetDisplay.setAttribute('data-lang', 'noBudgetSet');
            budgetDisplay.textContent = lang.translate('noBudgetSet');
        }
    }

    async openCategoriesModal() {
        const modal = document.getElementById('categories-modal');
        await categoriesManager.renderCategoriesList();
        modal.classList.add('active');
    }

    closeCategoriesModal() {
        const modal = document.getElementById('categories-modal');
        modal.classList.remove('active');
    }

    async resetData() {
        const confirmMessage = lang.translate('dataResetConfirm');
        const confirmed = await Utils.confirm(confirmMessage, 'Reset All Data', 'Reset');
        if (confirmed) {
            try {
                // Disable demo mode if active
                if (demoModeManager.isActive()) {
                    demoModeManager.isDemoMode = false;
                    localStorage.removeItem('demoMode');
                    localStorage.removeItem('originalData');
                    console.log('Demo mode disabled');
                }

                // Clear transactions
                await db.clearStore('transactions');
                console.log('Transactions cleared');

                // Clear categories
                await db.clearStore('categories');
                console.log('Categories cleared');

                // Clear settings completely
                await db.clearStore('settings');
                console.log('Settings cleared');

                // Clear localStorage onboarding flag
                localStorage.removeItem('onboardingCompleted');
                console.log('localStorage cleared');

                // Reinitialize categories with defaults
                await categoriesManager.init();
                console.log('Categories reinitialized');

                Utils.showToast('Successfully Removed All Data!');

                // Redirect to onboarding after a short delay
                setTimeout(() => {
                    window.location.href = 'onboarding.html';
                }, 1500);
            } catch (error) {
                console.error('Reset error:', error);
                Utils.showToast('Error resetting data: ' + error.message);
                alert('Failed to reset data. Please try again or clear your browser data manually.');
            }
        }
    }

    async clearCacheAndUpdate() {
        const confirmed = await Utils.confirm(
            'This will clear all app cache and reload to show the latest updates. Your data (transactions, settings) will be preserved. Continue?',
            'Clear Cache & Update',
            'Clear & Reload'
        );

        if (confirmed) {
            try {
                Utils.showToast('Clearing cache...');

                // Check if running on a secure context (https:// or localhost)
                const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                const isFileProtocol = window.location.protocol === 'file:';

                // 1. Clear Cache API (only works in secure contexts)
                if ('caches' in window && isSecureContext) {
                    try {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(cacheName => caches.delete(cacheName))
                        );
                        console.log('✓ Cache API cleared');
                    } catch (error) {
                        console.log('Cache API not available:', error.message);
                    }
                }

                // 2. Unregister service workers (only works in secure contexts, not on file://)
                if ('serviceWorker' in navigator && !isFileProtocol && isSecureContext) {
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(
                            registrations.map(registration => registration.unregister())
                        );
                        console.log('✓ Service workers unregistered');
                    } catch (error) {
                        console.log('Service Worker not available:', error.message);
                    }
                }

                // 3. Clear sessionStorage (works everywhere)
                try {
                    sessionStorage.clear();
                    console.log('✓ Session storage cleared');
                } catch (error) {
                    console.log('Session storage error:', error.message);
                }

                // 4. Clear specific localStorage cache keys (preserve user data)
                try {
                    const preserveKeys = ['onboardingCompleted', 'privacyMode'];
                    const keysToRemove = Object.keys(localStorage).filter(key =>
                        !preserveKeys.includes(key) &&
                        (key.includes('cache') || key.includes('version') || key.includes('temp'))
                    );
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    console.log('✓ localStorage cache cleared');
                } catch (error) {
                    console.log('localStorage error:', error.message);
                }

                // 5. Clear browser memory cache (if supported)
                if (window.performance && window.performance.clearResourceTimings) {
                    try {
                        window.performance.clearResourceTimings();
                        console.log('✓ Performance cache cleared');
                    } catch (error) {
                        console.log('Performance cache error:', error.message);
                    }
                }

                Utils.showToast('Cache cleared! Reloading...');

                // 6. Force hard reload with cache-busting
                setTimeout(() => {
                    // Modern way to force hard reload: add timestamp to URL
                    const url = new URL(window.location.href);
                    // Remove any existing timestamp parameter
                    url.searchParams.delete('_t');
                    // Add new timestamp
                    url.searchParams.set('_t', Date.now());
                    window.location.href = url.toString();
                }, 800);

            } catch (error) {
                console.error('Clear cache error:', error);
                Utils.showToast('Cache cleared partially. Reloading...');

                // Fallback: force reload with cache-busting
                setTimeout(() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('_t');
                    url.searchParams.set('_t', Date.now());
                    window.location.href = url.toString();
                }, 1000);
            }
        }
    }
}

// Create global settings manager instance
const settingsManager = new SettingsManager();
