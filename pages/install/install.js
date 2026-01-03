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
function checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        isInstalled = true;
        updateInstallButtons('Open App', false);
        updateInstallNote('App is already installed! Click the button to open it.');
        return;
    }

    // Additional check: Try to detect if app was previously installed
    // by checking if we're in a browser context but the app might be installed
    if ('getInstalledRelatedApps' in navigator) {
        navigator.getInstalledRelatedApps().then((relatedApps) => {
            if (relatedApps.length > 0) {
                isInstalled = true;
                updateInstallButtons('Open App', false);
                updateInstallNote('App is already installed! Click the button to open it.');
            }
        }).catch(err => {
            console.log('Could not check for installed apps:', err);
        });
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
    // If already installed, open the app
    if (isInstalled) {
        window.location.href = '../../index.html';
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
            // Remove existing state classes
            btnElement.classList.remove('installed', 'open-app');

            // Update icon based on state
            const iconElement = btnElement.querySelector('.btn-icon');
            if (iconElement && text === 'Open App') {
                // Change to "external link" icon for Open App
                iconElement.innerHTML = `
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 0 0 1-2-2V8a2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                `;
            } else if (iconElement && text !== 'Open App') {
                // Reset to download icon
                iconElement.innerHTML = `
                    <path d="M21 15v4a2 0 0 1-2 2H5a2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                `;
            }

            if (disabled) {
                btnElement.classList.add('installed');
                btnElement.style.cursor = 'default';
            } else if (text === 'Open App') {
                // Add special styling for "Open App" button
                btnElement.classList.add('open-app');
                btnElement.style.cursor = 'pointer';
            } else {
                btnElement.style.cursor = 'pointer';
            }
        }
    });

    // Also update the navbar button
    const navInstallButton = document.getElementById('navInstallButton');
    if (navInstallButton) {
        navInstallButton.textContent = text;
        navInstallButton.classList.remove('installed', 'open-app');

        if (disabled) {
            navInstallButton.classList.add('installed');
            navInstallButton.style.cursor = 'default';
        } else if (text === 'Open App') {
            navInstallButton.classList.add('open-app');
            navInstallButton.style.cursor = 'pointer';
        } else {
            navInstallButton.style.cursor = 'pointer';
        }
    }
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

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    isInstalled = true;
    updateInstallButtons('Installed Successfully!', true);
    updateInstallNote('App installed successfully! You can now launch it from your home screen.');

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
