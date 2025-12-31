// ===================================
// Auto Update Manager
// Automatically reloads when updates are detected
// ===================================

class AutoUpdateManager {
    constructor() {
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.currentVersion = APP_VERSION;
        this.isOnline = navigator.onLine;
        this.lastCheckTime = Date.now();
        this.updateCheckTimer = null;

        // Store the running version in localStorage to prevent reload loops
        const storedVersion = localStorage.getItem('app_running_version');
        if (!storedVersion || storedVersion !== APP_VERSION) {
            localStorage.setItem('app_running_version', APP_VERSION);
        }
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Listen for service worker updates
        this.setupServiceWorkerListener();

        // Listen for messages from Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NEW_VERSION_ACTIVATED') {
                    console.log('New version activated in SW, reloading...');
                    this.autoReload();
                }
            });
        }

        // Start periodic version check
        this.startPeriodicCheck();

        // Check for updates on visibility change (when user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Small delay to avoid checking too frequently
                setTimeout(() => {
                    this.checkForUpdates();
                }, 2000);
            }
        });

        // Check for updates on page focus (when user switches back to window)
        window.addEventListener('focus', () => {
            // Small delay to avoid checking too frequently
            setTimeout(() => {
                this.checkForUpdates();
            }, 2000);
        });

        // Check immediately on load
        this.checkForUpdates(true);
    }

    handleOnline() {
        this.isOnline = true;

        // When coming back online, check for updates immediately
        setTimeout(() => {
            this.checkForUpdates(true); // Force check
        }, 2000); // Wait 2 seconds for connection to stabilize
    }

    handleOffline() {
        this.isOnline = false;
    }

    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            // The main service worker registration handles updates
            // This just ensures we trigger update checks when appropriate
            navigator.serviceWorker.ready.then(registration => {
                // Trigger an immediate update check
                registration.update();
            });
        }
    }

    startPeriodicCheck() {
        // Clear any existing timer
        if (this.updateCheckTimer) {
            clearInterval(this.updateCheckTimer);
        }

        // Check for updates every 5 minutes
        this.updateCheckTimer = setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
    }

    async checkForUpdates(forceReload = false) {
        // Don't check if offline
        if (!this.isOnline) {
            return;
        }

        // Don't check too frequently (unless forced)
        const timeSinceLastCheck = Date.now() - this.lastCheckTime;
        if (!forceReload && timeSinceLastCheck < 60000) { // 1 minute minimum
            return;
        }

        this.lastCheckTime = Date.now();

        try {
            // Fetch version.js with aggressive cache busting
            const response = await fetch(`js/version.js?t=${Date.now()}`, {
                cache: 'no-store', // Changed from 'no-cache' to 'no-store' for more aggressive cache bypass
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (response.ok) {
                const text = await response.text();

                // Extract version from the file
                const versionMatch = text.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);

                if (versionMatch && versionMatch[1]) {
                    const latestVersion = versionMatch[1];
                    const runningVersion = localStorage.getItem('app_running_version') || this.currentVersion;

                    // Only reload if the latest version is different from what's currently running
                    if (latestVersion !== runningVersion) {
                        console.log(`New version detected: ${latestVersion} (running: ${runningVersion})`);

                        // Update the stored version before reloading
                        localStorage.setItem('app_running_version', latestVersion);

                        // Trigger service worker update
                        if ('serviceWorker' in navigator) {
                            const registration = await navigator.serviceWorker.getRegistration();
                            if (registration) {
                                await registration.update();

                                // Wait a bit for the new service worker to install
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }

                        // Auto-reload to apply the new version
                        this.autoReload();
                    } else {
                        console.log(`Already running latest version: ${latestVersion}`);
                    }
                }
            }
        } catch (error) {
            // Silently fail - might be offline or network issue
            console.error('Update check failed:', error);
        }
    }

    autoReload() {
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }

        // Force reload with cache bust (service worker will re-cache on reload)
        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
    }

    // Public method to manually check for updates
    async manualCheck() {
        await this.checkForUpdates(false);
    }
}

// Create global instance
const autoUpdateManager = new AutoUpdateManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    autoUpdateManager.init();
});
