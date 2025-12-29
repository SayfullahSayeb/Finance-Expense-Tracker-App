// ===================================
// Settings Manager
// ===================================

class SettingsManager {
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.initCustomSelects();
    }

    async loadSettings() {
        // Load language
        const language = await db.getSetting('language') || 'en';
        document.getElementById('language-select').value = language;

        // Load theme - default to light
        const theme = await db.getSetting('theme') || 'light';
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

        // Update app version display
        const appVersionElement = document.getElementById('app-version');
        if (appVersionElement && typeof APP_VERSION !== 'undefined') {
            appVersionElement.textContent = APP_VERSION;
        }

        // Update profile manager UI (secondary profile toggle and switch button)
        if (typeof profileManager !== 'undefined') {
            profileManager.updateSettingsUI();
        }
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
        // Check if secondary profile is enabled
        const hasSecondaryProfile = typeof profileManager !== 'undefined' && profileManager.isSecondaryProfileEnabled();

        // Prepare warning message
        let warningText = 'Your data will be permanently deleted and cannot be recovered.';
        if (hasSecondaryProfile) {
            warningText = 'All your data including your secondary profile will be permanently deleted and cannot be recovered.';
        }

        // Create modern modal
        const modalHTML = `
            <div id="reset-warning-modal" class="modal active">
                <div class="modal-content reset-modal-content">
                    <div class="reset-modal-icon">
                        <div class="trash-icon-wrapper">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <div class="sparkles">
                            <span class="sparkle" style="top: 10%; left: 20%;"></span>
                            <span class="sparkle" style="top: 20%; right: 25%;"></span>
                            <span class="sparkle" style="bottom: 30%; left: 15%;"></span>
                            <span class="sparkle" style="bottom: 20%; right: 20%;"></span>
                        </div>
                    </div>
                    
                    <h2 class="reset-modal-title">Reset All Data?</h2>
                    
                    <p class="reset-modal-text">${warningText}</p>
                    
                    <p class="reset-countdown-text" id="countdown-text">
                        Please wait <span id="countdown-number">5</span> seconds...
                    </p>
                    
                    <div class="reset-modal-buttons">
                        <button type="button" class="btn-reset-cancel" id="cancel-reset-btn">Cancel</button>
                        <button type="button" class="btn-reset-delete" id="confirm-reset-btn" disabled>
                            <span id="reset-btn-text">Wait (<span id="reset-countdown">5</span>s)</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('reset-warning-modal');
        const confirmBtn = document.getElementById('confirm-reset-btn');
        const cancelBtn = document.getElementById('cancel-reset-btn');
        const countdownNumber = document.getElementById('countdown-number');
        const resetCountdown = document.getElementById('reset-countdown');
        const countdownText = document.getElementById('countdown-text');
        const resetBtnText = document.getElementById('reset-btn-text');

        let countdown = 5;

        // Countdown interval
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownNumber.textContent = countdown;
            resetCountdown.textContent = countdown;

            if (countdown === 0) {
                clearInterval(countdownInterval);
                // Enable button
                confirmBtn.disabled = false;
                confirmBtn.classList.add('enabled');
                resetBtnText.innerHTML = 'Delete';
                countdownText.style.display = 'none';
            }
        }, 1000);

        // Handle cancel
        const closeModal = () => {
            clearInterval(countdownInterval);
            modal.remove();
        };

        cancelBtn.addEventListener('click', closeModal);

        // Handle confirm (only works after countdown)
        confirmBtn.addEventListener('click', async () => {
            if (confirmBtn.disabled) return;

            closeModal();

            // Show processing overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-size: 24px;
                font-weight: bold;
            `;
            overlay.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i><br>Resetting data...</div>';
            document.body.appendChild(overlay);

            try {
                // Disable demo mode if active
                if (demoModeManager.isActive()) {
                    demoModeManager.isDemoMode = false;
                    localStorage.removeItem('demoMode');
                    localStorage.removeItem('originalData');
                }

                // Clear current profile data
                await db.clearStore('transactions');
                await db.clearStore('categories');
                await db.clearStore('settings');

                // Clear localStorage
                localStorage.removeItem('onboardingCompleted');
                localStorage.removeItem('appLockSettings');

                // If secondary profile exists, delete it
                if (hasSecondaryProfile && typeof profileManager !== 'undefined') {
                    await profileManager.eraseSecondaryProfileData();
                    profileManager.profiles.secondary.enabled = false;
                    profileManager.profiles.secondary.name = null;
                    profileManager.saveProfileSettings();
                }

                // Reinitialize categories
                await categoriesManager.init();

                overlay.innerHTML = '<div style="text-align: center;"><i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px; color: var(--success-color);"></i><br>Data reset complete!</div>';

                await new Promise(resolve => setTimeout(resolve, 1500));
                document.body.removeChild(overlay);

                Utils.showToast('All data has been reset');

                // Redirect to onboarding
                setTimeout(() => {
                    window.location.href = 'pages/onboarding.html';
                }, 500);
            } catch (error) {
                console.error('Reset error:', error);
                document.body.removeChild(overlay);
                Utils.showToast('Error resetting data. Please try again.');
            }
        });
    }

    // Custom Select Dropdown for Settings
    initCustomSelects() {
        const selects = document.querySelectorAll('.setting-select');
        selects.forEach(select => this.createCustomSelect(select));
    }

    createCustomSelect(selectElement) {
        const selectedValue = selectElement.value;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';

        // Create selected display
        const selected = document.createElement('div');
        selected.className = 'custom-select-selected';

        const selectedText = document.createElement('span');
        selectedText.className = 'custom-select-text';
        selectedText.textContent = selectElement.options[selectElement.selectedIndex].textContent;

        const arrow = document.createElement('i');
        arrow.className = 'fas fa-chevron-down custom-select-arrow';

        selected.appendChild(selectedText);
        selected.appendChild(arrow);

        // Create options list
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-select-options';

        Array.from(selectElement.options).forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.textContent = option.textContent;
            optionDiv.dataset.value = option.value;

            if (option.value === selectedValue) {
                optionDiv.classList.add('selected');
            }

            optionsList.appendChild(optionDiv);
        });

        wrapper.appendChild(selected);
        wrapper.appendChild(optionsList);

        // Insert after original select
        selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
        selectElement.style.display = 'none';

        // Event listeners
        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });

        optionsList.querySelectorAll('.custom-select-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent;

                selectedText.textContent = text;
                selectElement.value = value;

                // Trigger change event
                const event = new Event('change', { bubbles: true });
                selectElement.dispatchEvent(event);

                // Update selected class
                optionsList.querySelectorAll('.custom-select-option').forEach(opt => {
                    opt.classList.remove('selected');
                    if (opt.dataset.value === value) {
                        opt.classList.add('selected');
                    }
                });

                wrapper.classList.remove('open');
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            wrapper.classList.remove('open');
        });
    }
}

// Create global settings manager instance
const settingsManager = new SettingsManager();
