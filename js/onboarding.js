class OnboardingManager {
    constructor() {
        this.currentScreen = 1;
        this.totalScreens = 5; 
        this.data = {
            userName: '',
            monthlyBudget: null,
            currency: 'BDT',
            theme: 'light',
            pin: ''
        };
    }

    init() {
        this.setupPINInputs();
        this.loadSavedData();
        this.checkOnboardingStatus();
    }

    async checkOnboardingStatus() {
        // First check localStorage for quick check
        const localStorageCheck = localStorage.getItem('onboardingCompleted');
        if (localStorageCheck === 'true') {
            // Already completed, redirect to main app
            window.location.href = '../';
            return;
        }

        // If not in localStorage, check database
        try {
            const completed = await db.getSetting('onboardingCompleted');
            if (completed) {
                // Also set in localStorage for faster future checks
                localStorage.setItem('onboardingCompleted', 'true');
                // Redirect to main app
                window.location.href = '../';
            }
        } catch (error) {
            // If error checking database, assume onboarding not completed
        }
    }

    setupPINInputs() {
        const pinInputs = document.querySelectorAll('.pin-digit');
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Move to next input
                if (value && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                // Move to previous input on backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    pinInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const digits = pastedData.replace(/\D/g, '').split('').slice(0, 4);

                digits.forEach((digit, i) => {
                    if (pinInputs[i]) {
                        pinInputs[i].value = digit;
                    }
                });

                if (digits.length > 0) {
                    const lastIndex = Math.min(digits.length - 1, 3);
                    pinInputs[lastIndex].focus();
                }
            });
        });
    }

    loadSavedData() {
        // Load any previously entered data (in case user refreshes)
        const savedData = sessionStorage.getItem('onboardingData');
        if (savedData) {
            this.data = JSON.parse(savedData);
            this.populateFields();
        }
    }

    populateFields() {
        // Populate fields with saved data
        const nameInput = document.getElementById('user-name');
        const budgetInput = document.getElementById('monthly-budget');
        const currencySelect = document.getElementById('currency-select');

        if (nameInput && this.data.userName) {
            nameInput.value = this.data.userName;
        }
        if (budgetInput && this.data.monthlyBudget) {
            budgetInput.value = this.data.monthlyBudget;
        }
        if (currencySelect && this.data.currency) {
            currencySelect.value = this.data.currency;
        }
    }

    saveCurrentScreenData() {
        switch (this.currentScreen) {
            case 3: // Name screen
                const nameInput = document.getElementById('user-name');
                if (nameInput) {
                    this.data.userName = nameInput.value.trim();
                }
                break;

            case 4: // Budget & Currency screen (combined)
                const budgetInput = document.getElementById('monthly-budget');
                if (budgetInput) {
                    const budget = parseFloat(budgetInput.value);
                    this.data.monthlyBudget = budget > 0 ? budget : null;
                }

                const currencySelect = document.getElementById('currency-select');
                if (currencySelect) {
                    this.data.currency = currencySelect.value;
                }
                break;

            case 5: // PIN screen
                const pinInputs = document.querySelectorAll('.pin-digit');
                const pin = Array.from(pinInputs).map(input => input.value).join('');
                if (pin.length === 4) {
                    this.data.pin = pin;
                }
                break;
        }

        // Save to session storage
        sessionStorage.setItem('onboardingData', JSON.stringify(this.data));
    }

    showError(title, message) {
        const modal = document.getElementById('error-modal');
        const msgEl = document.getElementById('error-message-text');
        const titleEl = document.querySelector('.error-title');

        if (modal && msgEl) {
            if (title && titleEl) titleEl.textContent = title;
            msgEl.textContent = message;
            modal.classList.add('active');
        } else {
            alert(message);
        }
    }

    nextScreen(skipValidation = false) {
        // Validation for Name (Screen 3)
        if (!skipValidation && this.currentScreen === 3) {
            const nameInput = document.getElementById('user-name');
            if (nameInput && !nameInput.value.trim()) {
                this.showError('Name Required', 'Please enter your name to continue.');
                return;
            }
        }

        // Validation for Budget (Screen 4)
        if (!skipValidation && this.currentScreen === 4) {
            const budgetInput = document.getElementById('monthly-budget');
            if (budgetInput && !budgetInput.value) {
                this.showError('Budget Required', 'Please enter a monthly budget or click "Skip" if you prefer not to set one.');
                return;
            }
        }

        this.saveCurrentScreenData();

        if (this.currentScreen < this.totalScreens) {
            // Hide current screen
            document.getElementById(`screen-${this.currentScreen}`).classList.remove('active');

            // Show next screen
            this.currentScreen++;
            document.getElementById(`screen-${this.currentScreen}`).classList.add('active');
        }
    }

    selectTheme(theme) {
        this.data.theme = theme;

        // Update UI
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
        });
        const themeBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (themeBtn) {
            themeBtn.classList.add('active');
        }

        // Apply theme preview
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    async finish(skipPIN = false) {
        // If not skipping PIN, validate that PIN is entered
        if (!skipPIN) {
            const pinInputs = document.querySelectorAll('.pin-digit');
            const pin = Array.from(pinInputs).map(input => input.value).join('');

            // Check if PIN is complete (4 digits)
            if (pin.length !== 4) {
                // Show error message
                this.showError('Incomplete PIN', 'Please enter a complete 4-digit PIN or click "Skip PIN" to continue without PIN protection.');
                return; // Don't proceed
            }

            // Save the PIN
            this.data.pin = pin;
        }

        // Save current screen data if not skipping
        if (!skipPIN) {
            this.saveCurrentScreenData();
        }

        try {
            // Initialize database first
            await db.init();

            // Save all settings to database
            if (this.data.userName) {
                await db.setSetting('userName', this.data.userName);
            }

            if (this.data.monthlyBudget) {
                await db.setSetting('monthlyBudget', this.data.monthlyBudget);
            }

            await db.setSetting('currency', this.data.currency);
            await db.setSetting('theme', this.data.theme);

            // Save PIN if provided and not skipping
            if (!skipPIN && this.data.pin && this.data.pin.length === 4) {
                await db.setSetting('appLockEnabled', true);
                await db.setSetting('appLockPIN', this.data.pin);
            } else {
                // Ensure PIN is disabled if skipped
                await db.setSetting('appLockEnabled', false);
            }

            // Mark onboarding as completed - THIS IS CRITICAL
            await db.setSetting('onboardingCompleted', true);

            // Also set in localStorage as a backup
            localStorage.setItem('onboardingCompleted', 'true');

            // Clear session storage
            sessionStorage.removeItem('onboardingData');

            // Apply theme
            if (this.data.theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else if (this.data.theme === 'system') {
                // Apply system theme
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                localStorage.setItem('theme', 'system');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }

            // Wait a bit to ensure database write completes
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect to main app
            window.location.href = '../';

        } catch (error) {
            console.error('Error saving onboarding data:', error);
            alert('Error saving settings. Please try again.');
        }
    }
}

// Create global instance
const onboarding = new OnboardingManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    onboarding.init();
});
