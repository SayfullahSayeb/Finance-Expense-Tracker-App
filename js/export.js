class ExportManager {
    async init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Backup button - opens backup modal
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.openBackupModal();
            });
        }

        // Restore button - opens restore modal
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.openRestoreModal();
            });
        }

        // Backup modal controls
        const closeBackupModal = document.getElementById('close-backup-modal');
        if (closeBackupModal) {
            closeBackupModal.addEventListener('click', () => {
                this.closeBackupModal();
            });
        }

        const cancelBackupBtn = document.getElementById('cancel-backup-btn');
        if (cancelBackupBtn) {
            cancelBackupBtn.addEventListener('click', () => {
                this.closeBackupModal();
            });
        }

        const confirmBackupBtn = document.getElementById('confirm-backup-btn');
        if (confirmBackupBtn) {
            confirmBackupBtn.addEventListener('click', () => {
                this.closeBackupModal();
                this.exportJSON();
            });
        }

        // Restore modal controls
        const closeRestoreModal = document.getElementById('close-restore-modal');
        if (closeRestoreModal) {
            closeRestoreModal.addEventListener('click', () => {
                this.closeRestoreModal();
            });
        }

        const cancelRestoreBtn = document.getElementById('cancel-restore-btn');
        if (cancelRestoreBtn) {
            cancelRestoreBtn.addEventListener('click', () => {
                this.closeRestoreModal();
            });
        }

        const confirmRestoreBtn = document.getElementById('confirm-restore-btn');
        if (confirmRestoreBtn) {
            confirmRestoreBtn.addEventListener('click', () => {
                this.closeRestoreModal();
                document.getElementById('import-file').click();
            });
        }

        // Import file handler
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleImport(e);
        });
    }

    openBackupModal() {
        const modal = document.getElementById('backup-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeBackupModal() {
        const modal = document.getElementById('backup-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openRestoreModal() {
        const modal = document.getElementById('restore-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeRestoreModal() {
        const modal = document.getElementById('restore-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async exportJSON() {
        try {
            // Export current profile data
            const currentProfileData = await db.exportData();
            const currentProfile = profileManager ? profileManager.getActiveProfile() : 'personal';
            const currentProfileName = profileManager ? profileManager.getActiveProfileName() : 'Personal';

            // Check if secondary profile exists and export it too
            let secondaryProfileData = null;
            const secondaryEnabled = await db.getSetting('secondaryProfileEnabled');

            if (secondaryEnabled && profileManager) {
                // Temporarily switch to get secondary profile data
                const originalProfile = currentProfile;
                const secondaryProfile = currentProfile === 'personal' ? 'secondary' : 'personal';
                const secondaryDBName = secondaryProfile === 'personal' ? 'FinanceTrackerDB' : 'FinanceTrackerDB_Secondary';

                // Create temporary db instance for secondary profile
                const tempDb = new Database();
                await tempDb.init(secondaryDBName);
                secondaryProfileData = await tempDb.exportData();

                // Get secondary profile name
                const secondaryName = await tempDb.getSetting('userName') || (secondaryProfile === 'personal' ? 'Personal' : 'Secondary');
                secondaryProfileData.profileName = secondaryName;
                secondaryProfileData.profileKey = secondaryProfile;
            }

            // Create combined export
            const exportData = {
                exportDate: new Date().toISOString(),
                version: currentProfileData.version,
                profiles: {
                    [currentProfile]: {
                        profileName: currentProfileName,
                        profileKey: currentProfile,
                        transactions: currentProfileData.transactions,
                        categories: currentProfileData.categories,
                        settings: currentProfileData.settings,
                        goals: currentProfileData.goals
                    }
                }
            };

            // Add secondary profile if exists
            if (secondaryProfileData) {
                const secondaryKey = secondaryProfileData.profileKey;
                exportData.profiles[secondaryKey] = {
                    profileName: secondaryProfileData.profileName,
                    profileKey: secondaryKey,
                    transactions: secondaryProfileData.transactions,
                    categories: secondaryProfileData.categories,
                    settings: secondaryProfileData.settings,
                    goals: secondaryProfileData.goals
                };
            }

            const jsonString = JSON.stringify(exportData, null, 2);
            const filename = `amar-taka-backup-${new Date().toISOString().split('T')[0]}.json`;

            Utils.downloadFile(jsonString, filename, 'application/json');

            const profileCount = Object.keys(exportData.profiles).length;
            Utils.showToast(`Backup created with ${profileCount} profile${profileCount > 1 ? 's' : ''}`);
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('Error exporting data');
        }
    }

    async exportCSV() {
        try {
            const transactions = await db.getAll('transactions');
            const csvContent = Utils.exportToCSV(transactions);
            const filename = `finance-tracker-transactions-${new Date().toISOString().split('T')[0]}.csv`;

            Utils.downloadFile(csvContent, filename, 'text/csv');
            Utils.showToast(lang.translate('dataExported'));
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('Error exporting data');
        }
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Check if this is new multi-profile format or old single-profile format
                const isMultiProfile = data.profiles !== undefined;

                if (isMultiProfile) {
                    // New format with multiple profiles
                    const profileKeys = Object.keys(data.profiles);
                    const profileNames = profileKeys.map(key => data.profiles[key].profileName).join(', ');

                    const confirmed = await Utils.confirm(
                        `This backup contains ${profileKeys.length} profile(s): ${profileNames}\n\nAll data will be restored to their respective profiles.\n\nThis will overwrite existing data in both profiles.`,
                        'Restore Multi-Profile Backup',
                        'Restore'
                    );

                    if (!confirmed) return;

                    // Restore each profile
                    for (const profileKey of profileKeys) {
                        const profileData = data.profiles[profileKey];
                        const dbName = profileKey === 'personal' ? 'FinanceTrackerDB' : 'FinanceTrackerDB_Secondary';

                        const tempDb = new Database();
                        await tempDb.init(dbName);
                        await tempDb.importData(profileData);
                    }

                    Utils.showToast(`Restored ${profileKeys.length} profile(s) successfully`);
                } else {
                    // Old format - single profile backup
                    if (!data.transactions && !data.categories && !data.settings) {
                        Utils.showToast('Invalid backup file format');
                        return;
                    }

                    const currentProfile = profileManager.getActiveProfile();
                    const currentProfileName = profileManager.getActiveProfileName();
                    const backupProfile = data.profileName || 'Unknown';
                    const backupProfileKey = data.profileKey;

                    let confirmMessage = 'This will restore your data from the backup file.\n\nAll current data will be replaced.';
                    let confirmTitle = 'Restore Data';

                    if (backupProfileKey && backupProfileKey !== currentProfile) {
                        confirmMessage = `⚠️ WARNING: You are attempting to restore '${backupProfile}' data into your '${currentProfileName}' profile.\n\nThis will completely overwrite your current '${currentProfileName}' data with data from a different profile.\n\nAre you sure you want to proceed?`;
                        confirmTitle = 'Profile Mismatch Warning';
                    }

                    const confirmed = await Utils.confirm(confirmMessage, confirmTitle, 'Restore');
                    if (!confirmed) return;

                    const success = await db.importData(data);

                    if (!success) {
                        Utils.showToast('Error importing data');
                        return;
                    }

                    Utils.showToast('Data restored successfully');
                }

                // Reload the app after successful import
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (error) {
                console.error('Import error:', error);
                Utils.showToast('Error importing data - Invalid file format');
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }
}

// Create global export manager instance
const exportManager = new ExportManager();
