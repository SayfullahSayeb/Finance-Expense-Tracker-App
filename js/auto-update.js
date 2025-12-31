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
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Listen for service worker updates
        this.setupServiceWorkerListener();

        // Start periodic version check
        this.startPeriodicCheck();

        // Check for updates on visibility change (when user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });

        // Check for updates on page focus
        window.addEventListener('focus', () => {
            this.checkForUpdates();
        });
    }

    handleOnline() {
        this.isOnline = true;

        // When coming back online, check for updates immediately
        setTimeout(() => {
            this.checkForUpdates(true); // Force check and auto-reload
        }, 2000); // Wait 2 seconds for connection to stabilize
    }

    handleOffline() {
        this.isOnline = false;
    }

    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is installed, auto-reload
                            this.autoReload();
                        }
                    });
                });

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, this.checkInterval);
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
            // Fetch version.js with cache busting
            const response = await fetch(`js/version.js?t=${Date.now()}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const text = await response.text();

                // Extract version from the file
                const versionMatch = text.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);

                if (versionMatch && versionMatch[1]) {
                    const latestVersion = versionMatch[1];

                    // Compare versions
                    if (latestVersion !== this.currentVersion) {
                        // New version detected! Auto-reload
                        this.autoReload();
                    }
                }
            }
        } catch (error) {
            // Silently fail - might be offline or network issue
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

        // Unregister service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }

        // Force reload with cache bust
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
