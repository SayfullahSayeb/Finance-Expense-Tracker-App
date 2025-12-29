// ===================================
// Export/Import Manager
// ===================================

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
            const data = await db.exportData();

            // Add profile information to export
            const profileName = profileManager ? profileManager.getActiveProfileName() : 'Personal';
            data.profileName = profileName;
            data.profileKey = profileManager ? profileManager.getActiveProfile() : 'personal';

            const jsonString = JSON.stringify(data, null, 2);
            const filename = `finance-tracker-${profileName.toLowerCase()}-backup-${new Date().toISOString().split('T')[0]}.json`;

            Utils.downloadFile(jsonString, filename, 'application/json');
            Utils.showToast(`${profileName} profile data exported successfully. (Does not include other profiles)`);
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

                // Validate data structure
                if (!data.transactions && !data.categories && !data.settings) {
                    Utils.showToast('Invalid backup file format');
                    return;
                }

                // Check for profile mismatch
                const currentProfile = profileManager.getActiveProfile();
                const currentProfileName = profileManager.getActiveProfileName();
                const backupProfile = data.profileName || 'Unknown';
                const backupProfileKey = data.profileKey; // May be undefined for old backups

                let confirmMessage = lang.translate('dataResetConfirm');
                let confirmTitle = 'Restore Data';

                if (backupProfileKey && backupProfileKey !== currentProfile) {
                    confirmMessage = `⚠️ WARNING: You are attempting to restore '${backupProfile}' data into your '${currentProfileName}' profile.\n\nThis will completely overwrite your current '${currentProfileName}' data with data from a different profile.\n\nAre you sure you want to proceed?`;
                    confirmTitle = 'Profile Mismatch Warning';
                }

                // Confirm import
                const confirmed = await Utils.confirm(confirmMessage, confirmTitle, 'Restore');
                if (!confirmed) {
                    return;
                }

                const success = await db.importData(data);

                if (success) {
                    Utils.showToast(lang.translate('dataImported'));

                    // Reload the app
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    Utils.showToast('Error importing data');
                }
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
