class SettingsManager {
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.initCustomSelects();
        this.setupOnlineListener();
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

        // Toggle demo mode visibility class
        this.updateDemoModeVisibility(demoMode);

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

    updateDemoModeVisibility(isDemoMode) {
        const settingsPage = document.getElementById('settings-page');
        if (settingsPage) {
            if (isDemoMode) {
                settingsPage.classList.add('demo-mode-active');
            } else {
                settingsPage.classList.remove('demo-mode-active');
            }
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

        // Feedback button
        document.getElementById('feedback-btn').addEventListener('click', () => {
            this.openFeedbackModal();
        });

        document.getElementById('close-feedback-modal').addEventListener('click', () => {
            this.closeFeedbackModal();
        });

        document.getElementById('feedback-back-btn').addEventListener('click', () => {
            this.closeFeedbackModal();
        });

        document.getElementById('submit-feedback-btn').addEventListener('click', () => {
            this.submitFeedback();
        });

        // Share button
        document.getElementById('shareApp').addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: "Amar Taka",
                        text: "Amar Taka helps you track your income and expenses without compromising your privacy. All your financial data stays on your device and never gets sent to any server. No account signup required, no tracking, no ads. Install now!",
                        url: "https://sayfullahsayeb.github.io/Amar-Taka/"
                    });
                } catch (err) {
                    console.log("Share cancelled");
                }
            } else {
                alert("Sharing not supported on this browser");
            }
        });

        // About button
        document.getElementById('about-btn').addEventListener('click', () => {
            this.openAboutModal();
        });

        document.getElementById('close-about-modal').addEventListener('click', () => {
            this.closeAboutModal();
        });

        // Demo Mode toggle
        document.getElementById('demo-mode-toggle').addEventListener('change', async (e) => {
            if (e.target.checked) {
                await demoModeManager.enableDemoMode();
                this.updateDemoModeVisibility(true);
            } else {
                await demoModeManager.disableDemoMode();
                this.updateDemoModeVisibility(false);
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

        // Lock body scroll
        document.body.classList.add('modal-open');

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
            document.body.classList.remove('modal-open');
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
        // Skip if select has no options or is already initialized
        if (!selectElement || selectElement.options.length === 0 || selectElement.nextSibling?.classList?.contains('custom-select-wrapper')) {
            return;
        }

        const selectedValue = selectElement.value;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';

        // Create selected display
        const selected = document.createElement('div');
        selected.className = 'custom-select-selected';

        const selectedText = document.createElement('span');
        selectedText.className = 'custom-select-text';
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        selectedText.textContent = selectedOption ? selectedOption.textContent : '';

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
                if (w !== wrapper) {
                    w.classList.remove('open');
                    w.classList.remove('dropup');
                }
            });

            // Check if dropdown should open upward
            const rect = wrapper.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = 100; // max-height of dropdown

            // If not enough space below but enough space above, open upward
            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                wrapper.classList.add('dropup');
            } else {
                wrapper.classList.remove('dropup');
            }

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

    openFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            // Reset form
            document.getElementById('feedback-rating').value = '';
            document.getElementById('feedback-message').value = '';
            document.querySelectorAll('.feedback-radio').forEach(radio => radio.checked = false);
            document.getElementById('feedback-success').style.display = 'none';
            document.getElementById('feedback-error').style.display = 'none';

            // Show form container, hide messages
            const formContainer = document.getElementById('feedback-form-container');
            if (formContainer) {
                formContainer.style.display = 'block';
            }

            // Remove selected class from emojis and hide label
            document.querySelectorAll('.emoji-rating').forEach(btn => btn.classList.remove('selected'));
            const emojiLabel = document.getElementById('emoji-rating-label');
            if (emojiLabel) {
                emojiLabel.textContent = '';
                emojiLabel.classList.remove('show');
            }

            // Hide "Other" input field
            const otherInputContainer = document.getElementById('feedback-other-input-container');
            const otherInput = document.getElementById('feedback-other-input');
            if (otherInputContainer) {
                otherInputContainer.classList.remove('show');
                if (otherInput) {
                    otherInput.value = '';
                }
            }

            // Add emoji click handlers
            document.querySelectorAll('.emoji-rating').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.emoji-rating').forEach(b => b.classList.remove('selected'));
                    e.currentTarget.classList.add('selected');
                    document.getElementById('feedback-rating').value = e.currentTarget.dataset.rating;

                    // Show emoji label
                    const label = e.currentTarget.dataset.label;
                    if (emojiLabel && label) {
                        emojiLabel.textContent = label;
                        emojiLabel.classList.add('show');
                    }
                });
            });

            // Handle "Other" radio button
            const otherRadio = document.getElementById('feedback-other-radio');
            const allRadios = document.querySelectorAll('input[name="feedback-useful-area"]');

            allRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.id === 'feedback-other-radio' && e.target.checked) {
                        otherInputContainer.classList.add('show');
                        if (otherInput) {
                            setTimeout(() => otherInput.focus(), 300);
                        }
                    } else {
                        otherInputContainer.classList.remove('show');
                        if (otherInput) {
                            otherInput.value = '';
                        }
                    }
                });
            });

            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    }

    closeFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    openAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    }

    closeAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    async submitFeedback() {
        const rating = document.getElementById('feedback-rating').value;
        const message = document.getElementById('feedback-message').value.trim();

        // Get selected radio button
        const selectedRadio = document.querySelector('input[name="feedback-useful-area"]:checked');
        let usefulArea = '';
        let otherText = '';

        if (selectedRadio) {
            if (selectedRadio.id === 'feedback-other-radio') {
                // For "Other" option, Google Forms expects __other_option__ as the value
                // and the actual text in a separate field
                usefulArea = '__other_option__';
                const otherInput = document.getElementById('feedback-other-input');
                otherText = otherInput && otherInput.value.trim() ? otherInput.value.trim() : '';
            } else {
                usefulArea = selectedRadio.value;
            }
        }

        // All fields are optional - check if at least something is provided
        if (!rating && !usefulArea && !message) {
            Utils.showToast('Please provide at least some feedback');
            return;
        }

        // Create feedback object
        const feedbackData = {
            rating,
            usefulArea,
            otherText,
            message,
            timestamp: Date.now()
        };

        // Check if online
        if (navigator.onLine) {
            // Try to send immediately
            const success = await this.sendFeedbackToServer(feedbackData);
            if (success) {
                this.showFeedbackSuccess();
            } else {
                // If failed, save to queue
                await this.saveFeedbackToQueue(feedbackData);
                this.showFeedbackQueued();
            }
        } else {
            // Save to queue for later
            await this.saveFeedbackToQueue(feedbackData);
            this.showFeedbackQueued();
        }
    }

    async sendFeedbackToServer(feedbackData) {
        // Google Form URL and field IDs from your form
        const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfFec8aLUW1CyD5r-w35e-kZdI1Jc5AVvhim8tLHqJK7qSF_g/formResponse';

        const formData = new FormData();

        // Only append fields that have values
        if (feedbackData.rating) {
            formData.append('entry.1012814942', feedbackData.rating); // Rating field
        }

        if (feedbackData.usefulArea) {
            formData.append('entry.1613346850', feedbackData.usefulArea); // Useful area field (checkbox value)

            // If "Other" is selected, also send the custom text
            if (feedbackData.usefulArea === '__other_option__' && feedbackData.otherText) {
                formData.append('entry.1613346850.other_option_response', feedbackData.otherText);
            }
        }

        if (feedbackData.message) {
            formData.append('entry.654395150', feedbackData.message); // Message field
        }

        try {
            await fetch(FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            return true;
        } catch (error) {
            console.error('Failed to send feedback:', error);
            return false;
        }
    }

    async saveFeedbackToQueue(feedbackData) {
        try {
            // Get existing queue
            let queue = await db.getSetting('feedbackQueue') || [];

            // Add new feedback
            queue.push(feedbackData);

            // Save back to database
            await db.setSetting('feedbackQueue', queue);

            console.log('Feedback saved to queue:', feedbackData);
        } catch (error) {
            console.error('Error saving feedback to queue:', error);
        }
    }

    async processFeedbackQueue() {
        try {
            // Get queue
            let queue = await db.getSetting('feedbackQueue') || [];

            if (queue.length === 0) {
                return;
            }

            console.log(`Processing ${queue.length} queued feedback(s)...`);

            // Try to send each feedback
            const remainingQueue = [];
            let sentCount = 0;

            for (const feedback of queue) {
                const success = await this.sendFeedbackToServer(feedback);
                if (success) {
                    sentCount++;
                } else {
                    // Keep in queue if failed
                    remainingQueue.push(feedback);
                }
            }

            // Update queue with remaining items
            await db.setSetting('feedbackQueue', remainingQueue);

            if (sentCount > 0) {
                Utils.showToast(`${sentCount} feedback(s) sent successfully!`);
            }

        } catch (error) {
            console.error('Error processing feedback queue:', error);
        }
    }

    showFeedbackSuccess() {
        // Hide form container and show success message
        const formContainer = document.getElementById('feedback-form-container');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        document.getElementById('feedback-success').style.display = 'block';
        document.getElementById('feedback-error').style.display = 'none';
    }

    showFeedbackQueued() {
        // Hide form container and show queued message
        const formContainer = document.getElementById('feedback-form-container');
        if (formContainer) {
            formContainer.style.display = 'none';
        }

        // Update success message to show it's queued
        const successDiv = document.getElementById('feedback-success');
        if (successDiv) {
            const originalHTML = successDiv.innerHTML;
            successDiv.innerHTML = `
                <i class="fas fa-clock" style="font-size: 48px; color: var(--warning-color); margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 8px;">Feedback Saved!</h3>
                <p style="color: var(--text-secondary);">You're currently offline. Your feedback will be sent automatically when you're back online.</p>
            `;
            successDiv.style.display = 'block';

            // Restore original HTML after modal closes
            setTimeout(() => {
                successDiv.innerHTML = originalHTML;
            }, 5000);
        }

        document.getElementById('feedback-error').style.display = 'none';
    }

    setupOnlineListener() {
        // Listen for online event
        window.addEventListener('online', async () => {
            console.log('App is back online - processing feedback queue...');
            await this.processFeedbackQueue();
        });

        // Also check queue when app loads if online
        if (navigator.onLine) {
            this.processFeedbackQueue();
        }
    }
}

// Create global settings manager instance
const settingsManager = new SettingsManager();

