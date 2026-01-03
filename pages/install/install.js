// PWA Install Page JavaScript
let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
window.addEventListener('DOMContentLoaded', () => {
    checkInstallStatus();
    initializeScreenshotCarousel();
    setupInstallButtons();
});

// Check if running as installed PWA
async function checkInstallStatus() {
    let installed = false;

    // Method 1: Check if running in standalone mode (currently running as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        installed = true;
    }

    // Method 2: Check getInstalledRelatedApps API (Chrome/Edge)
    if (!installed && 'getInstalledRelatedApps' in navigator) {
        try {
            const relatedApps = await navigator.getInstalledRelatedApps();
            if (relatedApps.length > 0) {
                installed = true;
            }
        } catch (error) {
            // API not supported or failed
        }
    }

    // Method 3: Check localStorage flag (set when app is installed)
    if (!installed && localStorage.getItem('pwa_installed') === 'true') {
        installed = true;
    }

    if (installed) {
        isInstalled = true;
        // Change all install buttons to "Open App" buttons
        updateInstallButtons('Open App', false);
        updateInstallNote('App is already installed! Click to open.');

        // Make buttons redirect to main app instead of installing
        makeButtonsOpenApp();
    }
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to show install button is available
    updateInstallNote('Click the button above to install Amar Taka on your device');
});

// Setup install buttons
function setupInstallButtons() {
    const installButton = document.getElementById('installButton');
    const installButtonBottom = document.getElementById('installButtonBottom');
    const navInstallButton = document.getElementById('navInstallButton');

    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }

    if (installButtonBottom) {
        installButtonBottom.addEventListener('click', handleInstallClick);
    }

    if (navInstallButton) {
        navInstallButton.addEventListener('click', handleInstallClick);
    }
}

// Handle install button click
async function handleInstallClick() {
    if (isInstalled) {
        return;
    }

    if (!deferredPrompt) {
        // No install prompt available
        updateInstallNote('Installation is not available in this browser. Try using Chrome, Edge, or Safari.');
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        updateInstallButtons('Installing...', true);
    } else {
        console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt for next time
    deferredPrompt = null;
}

// Update install button states
function updateInstallButtons(text, disabled = false) {
    const buttons = [
        { textId: 'installButtonText', btnId: 'installButton' },
        { textId: 'installButtonBottomText', btnId: 'installButtonBottom' }
    ];

    buttons.forEach(({ textId, btnId }) => {
        const textElement = document.getElementById(textId);
        const btnElement = document.getElementById(btnId);

        if (textElement) {
            textElement.textContent = text;
        }

        if (btnElement) {
            if (disabled) {
                btnElement.classList.add('installed');
                btnElement.style.cursor = 'default';
            }
        }
    });
}

// Update install note
function updateInstallNote(text) {
    const installNote = document.getElementById('installNote');
    if (installNote) {
        installNote.textContent = text;
    }
}

// Detect user's platform
function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'ios';
    } else if (/android/.test(userAgent)) {
        return 'android';
    } else {
        return 'desktop';
    }
}

// Make buttons open the app instead of installing
function makeButtonsOpenApp() {
    const buttons = [
        document.getElementById('installButton'),
        document.getElementById('installButtonBottom'),
        document.getElementById('navInstallButton')
    ];

    buttons.forEach(btn => {
        if (btn) {
            // Remove existing click handlers by cloning the button
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            // Add new click handler to open the app
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '../../index.html';
            });

            // Update styling to show it's clickable
            newBtn.style.cursor = 'pointer';
            newBtn.classList.remove('installed');
        }
    });
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    isInstalled = true;

    // Set localStorage flag for future detection
    localStorage.setItem('pwa_installed', 'true');

    updateInstallButtons('Open App', false);
    updateInstallNote('App installed successfully! Click to open.');

    // Make buttons open the app
    makeButtonsOpenApp();

    // Show success message
    setTimeout(() => {
        if (confirm('App installed successfully! Would you like to open it now?')) {
            window.location.href = '../../index.html';
        }
    }, 500);
});

// Screenshot Carousel
function initializeScreenshotCarousel() {
    const dots = document.querySelectorAll('.dot');
    const screenshots = document.querySelectorAll('.screenshot');
    let currentIndex = 0;
    let autoPlayInterval;

    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showScreenshot(index);
            resetAutoPlay();
        });
    });

    function showScreenshot(index) {
        // Remove active class from all
        screenshots.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        // Add active class to current
        screenshots[index].classList.add('active');
        dots[index].classList.add('active');

        currentIndex = index;
    }

    function nextScreenshot() {
        const nextIndex = (currentIndex + 1) % screenshots.length;
        showScreenshot(nextIndex);
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(nextScreenshot, 4000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // Start auto-play
    startAutoPlay();

    // Pause on hover
    const phoneMockup = document.querySelector('.phone-mockup');
    if (phoneMockup) {
        phoneMockup.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });

        phoneMockup.addEventListener('mouseleave', () => {
            startAutoPlay();
        });
    }
}

// Service Worker Registration (if not already registered)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js')
        .then(registration => {
            console.log('Service Worker registered:', registration);
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}

// Add smooth scroll behavior for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});
