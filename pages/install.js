// PWA Install Page JavaScript
let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
window.addEventListener('DOMContentLoaded', () => {
    checkInstallStatus();
    initializeScreenshotCarousel();
    initializePlatformTabs();
    setupInstallButtons();
});

// Check if running as installed PWA
function checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        isInstalled = true;
        updateInstallButtons('Already Installed', true);
        updateInstallNote('App is already installed on your device!');
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

    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }

    if (installButtonBottom) {
        installButtonBottom.addEventListener('click', handleInstallClick);
    }
}

// Handle install button click
async function handleInstallClick() {
    if (isInstalled) {
        return;
    }

    if (!deferredPrompt) {
        // Show platform-specific instructions
        showPlatformInstructions();
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

// Show platform-specific instructions
function showPlatformInstructions() {
    const platform = detectPlatform();
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.platform-panel');

    // Remove active class from all tabs and panels
    tabs.forEach(tab => tab.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));

    // Activate the correct tab and panel
    const targetTab = document.querySelector(`[data-platform="${platform}"]`);
    const targetPanel = document.querySelector(`.platform-panel[data-platform="${platform}"]`);

    if (targetTab) targetTab.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');

    // Scroll to instructions
    const instructionsSection = document.querySelector('.instructions');
    if (instructionsSection) {
        instructionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateInstallNote(`Follow the ${platform} instructions below to install the app`);
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
            window.location.href = '../index.html';
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

// Platform Tabs
function initializePlatformTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.platform-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const platform = tab.dataset.platform;

            // Remove active class from all tabs and panels
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            const targetPanel = document.querySelector(`.platform-panel[data-platform="${platform}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // Auto-select platform on load
    const platform = detectPlatform();
    const defaultTab = document.querySelector(`[data-platform="${platform}"]`);
    if (defaultTab) {
        defaultTab.click();
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
