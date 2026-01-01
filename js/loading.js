class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.minDisplayTime = 1000; 
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
                }, 500); 
            }
        }, remainingTime);
    }

    show() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('fade-out');
            this.loadingScreen.style.display = 'flex';
        }
    }
}

// Create global instance
const loadingScreen = new LoadingScreen();
