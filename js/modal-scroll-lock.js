// Modal Scroll Lock Manager - Inline Version
// Add this script at the end of index.html before </body>

document.addEventListener('DOMContentLoaded', function () {
    const modals = document.querySelectorAll('.modal');

    function lockBodyScroll() {
        document.body.classList.add('modal-open');
    }

    function unlockBodyScroll() {
        const hasActiveModal = document.querySelector('.modal.active');
        if (!hasActiveModal) {
            document.body.classList.remove('modal-open');
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('modal')) {
                    if (target.classList.contains('active')) {
                        lockBodyScroll();
                    } else {
                        unlockBodyScroll();
                    }
                }
            }
        });
    });

    modals.forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                unlockBodyScroll();
            }
        });
    });
});
