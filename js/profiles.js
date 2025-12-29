// ===================================
// Profile Management System (Enhanced)
// ===================================

class ProfileManager {
    constructor() {
        this.profiles = {
            personal: {
                name: 'Personal',
                icon: '👤',
                enabled: true,
                isDefault: true
            },
            secondary: {
                name: null,
                icon: '💼',
                enabled: false,
                isDefault: false
            }
        };
        this.activeProfile = 'personal';
        this.DB_PREFIX = 'FinanceTrackerDB_';
    }

    async init() {
        // Load profile settings from localStorage
        this.loadProfileSettings();

        // Set active profile
        const savedProfile = localStorage.getItem('active_profile');
        if (savedProfile && this.profiles[savedProfile] && this.profiles[savedProfile].enabled) {
            this.activeProfile = savedProfile;
        } else {
            this.activeProfile = 'personal';
            localStorage.setItem('active_profile', 'personal');
        }

        // Update UI
        this.updateSwitchIconVisibility();
    }

    loadProfileSettings() {
        const savedSettings = localStorage.getItem('profile_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                Object.keys(settings).forEach(key => {
                    if (this.profiles[key]) {
                        this.profiles[key] = { ...this.profiles[key], ...settings[key] };
                    }
                });
            } catch (error) {
                console.error('Error loading profile settings:', error);
            }
        }
    }

    saveProfileSettings() {
        localStorage.setItem('profile_settings', JSON.stringify(this.profiles));
    }

    getActiveProfile() {
        return this.activeProfile;
    }

    getActiveProfileName() {
        return this.profiles[this.activeProfile].name || 'Personal';
    }

    getActiveProfileIcon() {
        return this.profiles[this.activeProfile].icon;
    }

    getActiveProfileDB() {
        return this.DB_PREFIX + this.activeProfile;
    }

    isSecondaryProfileEnabled() {
        return this.profiles.secondary.enabled;
    }

    getSecondaryProfileName() {
        return this.profiles.secondary.name || 'Secondary';
    }

    async setupSecondaryProfile(name, currency, budget) {
        try {
            // Check if secondary profile database already exists (was disabled with data preserved)
            const dbName = this.DB_PREFIX + 'secondary';
            const databases = await indexedDB.databases();
            const dbExists = databases.some(db => db.name === dbName);

            // Set profile name
            this.profiles.secondary.name = name;
            this.profiles.secondary.enabled = true;
            this.saveProfileSettings();

            // Only initialize if database doesn't exist (first time setup)
            if (!dbExists) {
                await this.initializeProfileDatabase('secondary', currency, budget, name);
            } else {
                // Database exists, just update the settings
                const tempDB = new Database();
                await tempDB.init(dbName);

                if (name) {
                    await tempDB.update('settings', { key: 'userName', value: name });
                }
                if (currency) {
                    await tempDB.update('settings', { key: 'currency', value: currency });
                }
                if (budget) {
                    await tempDB.update('settings', { key: 'monthlyBudget', value: budget });
                }

                if (tempDB.db) {
                    tempDB.db.close();
                }
            }

            Utils.showToast(`${name} profile created successfully!`);

            // Update UI
            this.updateSettingsUI();
            this.updateSwitchIconVisibility();

            return true;
        } catch (error) {
            console.error('Error setting up secondary profile:', error);
            Utils.showToast('Error creating profile');
            return false;
        }
    }

    openDisableSecondaryModal() {
        const modal = document.getElementById('disable-secondary-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeDisableSecondaryModal() {
        const modal = document.getElementById('disable-secondary-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async disableSecondaryProfile(eraseData = false) {
        try {
            if (eraseData) {
                // Erase all data from secondary profile
                await this.eraseSecondaryProfileData();
                // Clear the profile name so it's treated as new setup next time
                this.profiles.secondary.name = null;
            }

            this.profiles.secondary.enabled = false;
            this.saveProfileSettings();

            // If currently on secondary profile, switch to personal
            if (this.activeProfile === 'secondary') {
                await this.switchProfile('personal');
            }

            const message = eraseData ?
                'Secondary profile disabled and all data erased' :
                'Secondary profile disabled (data preserved)';
            Utils.showToast(message);

            // Update UI
            this.updateSettingsUI();
            this.updateSwitchIconVisibility();
            this.closeDisableSecondaryModal();
        } catch (error) {
            console.error('Error disabling secondary profile:', error);
            Utils.showToast('Error disabling profile');
        }
    }

    async eraseSecondaryProfileData() {
        try {
            const dbName = this.DB_PREFIX + 'secondary';

            // Delete the database
            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(dbName);

                request.onsuccess = () => {
                    console.log('Secondary profile database deleted');
                    resolve();
                };

                request.onerror = () => {
                    reject('Failed to delete database');
                };

                request.onblocked = () => {
                    console.warn('Database deletion blocked');
                    reject('Database deletion blocked');
                };
            });
        } catch (error) {
            console.error('Error erasing secondary profile data:', error);
            throw error;
        }
    }

    async switchProfile(profileKey) {
        if (!this.profiles[profileKey]) {
            console.error('Invalid profile:', profileKey);
            return;
        }

        if (!this.profiles[profileKey].enabled) {
            Utils.showToast('This profile is not enabled');
            return;
        }

        if (this.activeProfile === profileKey) {
            Utils.showToast('Already on ' + this.profiles[profileKey].name + ' profile');
            return;
        }

        const previousProfile = this.activeProfile;
        this.activeProfile = profileKey;
        localStorage.setItem('active_profile', profileKey);

        try {
            await this.reinitializeApp();
            Utils.showToast(`Switched to ${this.profiles[profileKey].name} Profile`);
            this.updateSwitchIconVisibility();
            this.updateSettingsUI();
        } catch (error) {
            console.error('Error switching profile:', error);
            this.activeProfile = previousProfile;
            localStorage.setItem('active_profile', previousProfile);
            Utils.showToast('Error switching profile. Please try again.');
        }
    }

    async reinitializeApp() {
        if (db.db) {
            db.db.close();
        }

        const newDBName = this.getActiveProfileDB();
        await db.init(newDBName);

        if (typeof homeManager !== 'undefined') {
            await homeManager.render();
        }
        if (typeof transactionsManager !== 'undefined') {
            await transactionsManager.render();
        }
        if (typeof analysisManager !== 'undefined') {
            await analysisManager.render();
        }
        if (typeof settingsManager !== 'undefined') {
            await settingsManager.loadSettings();
        }
        if (typeof categoriesManager !== 'undefined') {
            await categoriesManager.init();
        }
    }

    async initializeProfileDatabase(profileKey, currency = 'BDT', budget = null, userName = null) {
        const dbName = this.DB_PREFIX + profileKey;
        const tempDB = new Database();
        await tempDB.init(dbName);

        if (userName) {
            await tempDB.update('settings', { key: 'userName', value: userName });
        }

        if (currency) {
            await tempDB.update('settings', { key: 'currency', value: currency });
        }
        if (budget) {
            await tempDB.update('settings', { key: 'monthlyBudget', value: budget });
        }

        const defaultCategories = [
            { name: 'Food', emoji: '🍔', type: 'expense' },
            { name: 'Transport', emoji: '🚗', type: 'expense' },
            { name: 'Shopping', emoji: '🛍️', type: 'expense' },
            { name: 'Bills', emoji: '💡', type: 'expense' },
            { name: 'Entertainment', emoji: '🎬', type: 'expense' },
            { name: 'Health', emoji: '🏥', type: 'expense' },
            { name: 'Salary', emoji: '💰', type: 'income' },
            { name: 'Freelance', emoji: '💼', type: 'income' },
            { name: 'Investment', emoji: '📈', type: 'income' }
        ];

        for (const category of defaultCategories) {
            try {
                await tempDB.add('categories', category);
            } catch (error) {
                console.log('Category may already exist:', category.name);
            }
        }

        if (tempDB.db) {
            tempDB.db.close();
        }
    }

    updateSwitchIconVisibility() {
        const switchIcon = document.getElementById('profile-switch-icon');
        if (switchIcon) {
            // Show icon in both profiles when secondary is enabled
            if (this.isSecondaryProfileEnabled()) {
                switchIcon.style.display = 'flex';
            } else {
                switchIcon.style.display = 'none';
            }
        }
    }

    updateSettingsUI() {
        // Hide secondary profile settings when on secondary profile
        const secondaryProfileSection = document.querySelector('.setting-item:has(#secondary-profile-toggle)');
        const switchBtn = document.getElementById('switch-profile-btn');
        const demoModeSection = document.querySelector('.setting-item:has(#demo-mode-toggle)');
        const appLockSection = document.querySelector('.setting-item:has(#app-lock-toggle)');

        // Hide Data Management section on secondary profile
        const dataManagementSection = document.querySelector('.settings-section:has(#reset-data-btn)');

        if (this.activeProfile === 'secondary') {
            // Hide secondary profile toggle when on secondary profile
            if (secondaryProfileSection) {
                secondaryProfileSection.style.display = 'none';
            }
            // Hide Demo Mode on secondary profile
            if (demoModeSection) {
                demoModeSection.style.display = 'none';
            }
            // Hide App Lock on secondary profile
            if (appLockSection) {
                appLockSection.style.display = 'none';
            }
            // Hide Data Management on secondary profile
            if (dataManagementSection) {
                dataManagementSection.style.display = 'none';
            }
            // Keep switch button visible
            if (switchBtn && this.isSecondaryProfileEnabled()) {
                switchBtn.style.display = 'flex';
            }
        } else {
            // Show all settings when on personal profile
            if (secondaryProfileSection) {
                secondaryProfileSection.style.display = 'flex';
            }
            if (demoModeSection) {
                demoModeSection.style.display = 'flex';
            }
            if (appLockSection) {
                appLockSection.style.display = 'flex';
            }
            if (dataManagementSection) {
                dataManagementSection.style.display = 'block';
            }

            const toggle = document.getElementById('secondary-profile-toggle');
            if (toggle) {
                toggle.checked = this.isSecondaryProfileEnabled();
            }

            if (switchBtn) {
                if (this.isSecondaryProfileEnabled()) {
                    switchBtn.style.display = 'flex';
                } else {
                    switchBtn.style.display = 'none';
                }
            }
        }

        const profileNameEl = document.getElementById('current-profile-name');
        if (profileNameEl) {
            profileNameEl.textContent = this.getActiveProfileName();
        }

        // Hide/show reset data option based on profile
        this.updateResetDataVisibility();
    }

    updateResetDataVisibility() {
        const resetDataBtn = document.getElementById('reset-data-btn');
        if (resetDataBtn) {
            if (this.activeProfile === 'secondary') {
                // Hide reset data in secondary profile
                resetDataBtn.style.display = 'none';
            } else {
                // Show reset data in personal profile
                resetDataBtn.style.display = 'flex';
            }
        }
    }

    openSecondarySetupModal() {
        const modal = document.getElementById('secondary-profile-setup-modal');
        if (modal) {
            document.getElementById('secondary-profile-name').value = '';
            document.getElementById('secondary-currency-select').value = 'BDT';
            document.getElementById('secondary-monthly-budget').value = '';
            modal.classList.add('active');
            document.getElementById('secondary-profile-name').focus();
        }
    }

    closeSecondarySetupModal() {
        const modal = document.getElementById('secondary-profile-setup-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    setupEventListeners() {
        // Secondary profile toggle
        const toggle = document.getElementById('secondary-profile-toggle');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    // Check if profile was previously set up (has a name)
                    if (this.profiles.secondary.name) {
                        // Profile exists, just re-enable it
                        this.profiles.secondary.enabled = true;
                        this.saveProfileSettings();
                        Utils.showToast(`${this.profiles.secondary.name} profile re-enabled`);
                        this.updateSettingsUI();
                        this.updateSwitchIconVisibility();
                    } else {
                        // First time setup
                        this.openSecondarySetupModal();
                    }
                } else {
                    this.openDisableSecondaryModal();
                }
            });
        }

        // Switch profile button
        const switchBtn = document.getElementById('switch-profile-btn');
        if (switchBtn) {
            switchBtn.addEventListener('click', async () => {
                const targetProfile = this.activeProfile === 'personal' ? 'secondary' : 'personal';
                await this.switchProfile(targetProfile);
            });
        }

        // Profile switch icon
        const switchIcon = document.getElementById('profile-switch-icon');
        if (switchIcon) {
            switchIcon.addEventListener('click', async () => {
                // Toggle between profiles
                const targetProfile = this.activeProfile === 'personal' ? 'secondary' : 'personal';
                await this.switchProfile(targetProfile);
            });
        }

        // Secondary setup modal - close
        const closeBtn = document.getElementById('close-secondary-setup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSecondarySetupModal();
                const toggle = document.getElementById('secondary-profile-toggle');
                if (toggle && !this.isSecondaryProfileEnabled()) {
                    toggle.checked = false;
                }
            });
        }

        // Secondary setup modal - cancel
        const cancelBtn = document.getElementById('cancel-secondary-setup');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeSecondarySetupModal();
                const toggle = document.getElementById('secondary-profile-toggle');
                if (toggle && !this.isSecondaryProfileEnabled()) {
                    toggle.checked = false;
                }
            });
        }

        // Secondary setup modal - save
        const saveBtn = document.getElementById('save-secondary-setup');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const name = document.getElementById('secondary-profile-name').value.trim();
                const currency = document.getElementById('secondary-currency-select').value;
                const budgetInput = document.getElementById('secondary-monthly-budget').value;
                const budget = budgetInput ? parseFloat(budgetInput) : null;

                if (!name) {
                    Utils.showToast('Please enter a profile name');
                    document.getElementById('secondary-profile-name').focus();
                    return;
                }

                const success = await this.setupSecondaryProfile(name, currency, budget);
                if (success) {
                    this.closeSecondarySetupModal();
                }
            });
        }

        // Disable secondary modal - close
        const closeDisableBtn = document.getElementById('close-disable-secondary');
        if (closeDisableBtn) {
            closeDisableBtn.addEventListener('click', () => {
                this.closeDisableSecondaryModal();
                const toggle = document.getElementById('secondary-profile-toggle');
                if (toggle) {
                    toggle.checked = true; // Revert toggle
                }
            });
        }

        // Disable secondary modal - cancel
        const cancelDisableBtn = document.getElementById('cancel-disable-secondary');
        if (cancelDisableBtn) {
            cancelDisableBtn.addEventListener('click', () => {
                this.closeDisableSecondaryModal();
                const toggle = document.getElementById('secondary-profile-toggle');
                if (toggle) {
                    toggle.checked = true; // Revert toggle
                }
            });
        }

        // Disable secondary modal - keep data option
        const keepDataBtn = document.getElementById('disable-keep-data');
        if (keepDataBtn) {
            keepDataBtn.addEventListener('click', async () => {
                await this.disableSecondaryProfile(false);
            });
        }

        // Disable secondary modal - erase data option
        const eraseDataBtn = document.getElementById('disable-erase-data');
        if (eraseDataBtn) {
            eraseDataBtn.addEventListener('click', async () => {
                const confirmed = await Utils.confirm(
                    'Are you sure you want to permanently delete all secondary profile data? This action cannot be undone.',
                    'Confirm Data Deletion',
                    'Delete'
                );

                if (confirmed) {
                    await this.disableSecondaryProfile(true);
                }
            });
        }
    }

    async migrateExistingData() {
        const migrated = localStorage.getItem('profiles_migrated');
        if (migrated) return;

        try {
            const oldDBName = 'FinanceTrackerDB';
            const newDBName = this.DB_PREFIX + 'personal';
            const databases = await indexedDB.databases();
            const hasOldDB = databases.some(db => db.name === oldDBName);
            const hasNewDB = databases.some(db => db.name === newDBName);

            if (hasOldDB && !hasNewDB) {
                console.log('Migrating existing data to Personal profile...');
                localStorage.setItem('profiles_migrated', 'true');
                console.log('Migration completed');
            } else {
                localStorage.setItem('profiles_migrated', 'true');
            }
        } catch (error) {
            console.error('Migration error:', error);
        }
    }
}

const profileManager = new ProfileManager();
