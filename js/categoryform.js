// ===================================
// Category Form Handler
// ===================================

class CategoryFormHandler {
    constructor() {
        this.modal = null;
        this.form = null;
        this.isEditMode = false;
    }

    init() {
        this.modal = document.getElementById('category-form-modal');
        this.form = document.getElementById('category-form');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Category button
        const addBtn = document.getElementById('add-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // Close modal button
        const closeBtn = document.getElementById('close-category-form-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-category-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Form submit
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Emoji picker buttons
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                const emojiInput = document.getElementById('category-emoji');
                if (emojiInput) {
                    emojiInput.value = emoji;
                }
            });
        });


    }

    openAddModal() {
        const title = document.getElementById('category-form-title');
        if (title) {
            title.textContent = 'Add Category';
        }

        this.isEditMode = false;
        this.resetForm();

        // Hide delete button in add mode
        const deleteBtn = document.getElementById('delete-category-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }

        if (this.modal) {
            this.modal.classList.add('active');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
        this.resetForm();
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
        }

        const idInput = document.getElementById('category-id');
        if (idInput) {
            idInput.value = '';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const emojiInput = document.getElementById('category-emoji');
        const nameInput = document.getElementById('category-name');
        const typeSelect = document.getElementById('category-type');
        const idInput = document.getElementById('category-id');

        if (!emojiInput || !nameInput || !typeSelect) {
            showToast('Please fill all fields');
            return;
        }

        const categoryData = {
            emoji: emojiInput.value.trim(),
            name: nameInput.value.trim(),
            color: '#f6f8fa', // Fixed color for all categories
            type: typeSelect.value
        };

        // Validate
        if (!categoryData.emoji || !categoryData.name) {
            showToast('Please fill all required fields');
            return;
        }

        try {
            const categoryId = idInput ? idInput.value : null;

            if (categoryId) {
                // Edit mode
                await categoriesManager.updateCategory(parseInt(categoryId), categoryData);
                showToast('Category updated successfully');
            } else {
                // Add mode
                await categoriesManager.addCategory(categoryData);
                showToast('Category added successfully');
            }

            // Refresh the categories list
            await categoriesManager.renderCategoriesList();

            // Refresh transaction modal category dropdown if it's open
            this.refreshTransactionCategoryDropdown();

            // Close modal
            this.closeModal();

        } catch (error) {
            console.error('Error saving category:', error);
            showToast('Error saving category');
        }
    }

    refreshTransactionCategoryDropdown() {
        // Check if transaction modal is open
        const transactionModal = document.getElementById('transaction-modal');
        if (transactionModal && transactionModal.classList.contains('active')) {
            // Get current transaction type
            const activeTypeBtn = document.querySelector('.type-btn.active');
            if (activeTypeBtn && typeof transactionsManager !== 'undefined') {
                const type = activeTypeBtn.dataset.type;
                transactionsManager.updateCategoryOptions(type);
            }
        }
    }
}

// Initialize category form handler
const categoryFormHandler = new CategoryFormHandler();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    categoryFormHandler.init();
});
