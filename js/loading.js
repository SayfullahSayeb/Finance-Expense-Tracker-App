// ===================================
// Loading Screen Controller
// ===================================

class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.minDisplayTime = 1000; // Minimum time to show loading screen (1 second)
        this.startTime = Date.now();
    }

    /**
     * Hide the loading screen with a smooth fade-out animation
     */
    hide() {
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsedTime);

        // Wait for minimum display time before hiding
        setTimeout(() => {
            if (this.loadingScreen) {
                this.loadingScreen.classList.add('fade-out');
                
                // Remove from DOM after animation completes
                setTimeout(() => {
                    if (this.loadingScreen && this.loadingScreen.parentNode) {
                        this.loadingScreen.remove();
                    }
                }, 500); // Match the CSS transition duration
            }
        }, remainingTime);
    }

    /**
     * Show the loading screen (useful for future use)
     */
    show() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('fade-out');
            this.loadingScreen.style.display = 'flex';
        }
    }
}

// Create global instance
const loadingScreen = new LoadingScreen();
