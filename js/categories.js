// ===================================
// Categories Manager
// ===================================

class CategoriesManager {
    constructor() {
        this.defaultCategories = [
            { name: 'Food', emoji: '🍔', color: '#FF6B6B', type: 'expense' },
            { name: 'Transport', emoji: '🚗', color: '#4ECDC4', type: 'expense' },
            { name: 'Bills', emoji: '💡', color: '#FFE66D', type: 'expense' },
            { name: 'Shopping', emoji: '🛍️', color: '#A8E6CF', type: 'expense' },
            { name: 'Medical', emoji: '🏥', color: '#FF8B94', type: 'expense' },
            { name: 'Education', emoji: '📚', color: '#95E1D3', type: 'expense' },
            { name: 'Rent', emoji: '🏠', color: '#F38181', type: 'expense' },
            { name: 'Salary', emoji: '💰', color: '#34C759', type: 'income' },
            { name: 'Investment', emoji: '📈', color: '#5AC8FA', type: 'income' },
            { name: 'Others', emoji: '➕', color: '#8E8E93', type: 'both' }
        ];
    }

    async init() {
        // Check if categories exist, if not, add defaults
        const categories = await db.getAll('categories');
        if (categories.length === 0) {
            for (const category of this.defaultCategories) {
                await db.add('categories', category);
            }
        }
    }

    async getCategories(type = null) {
        const categories = await db.getAll('categories');
        if (type) {
            return categories.filter(c => c.type === type || c.type === 'both');
        }
        return categories;
    }

    async getCategoryById(id) {
        return await db.get('categories', id);
    }

    async addCategory(categoryData) {
        return await db.add('categories', categoryData);
    }

    async updateCategory(id, categoryData) {
        return await db.update('categories', { ...categoryData, id });
    }

    async deleteCategory(id) {
        return await db.delete('categories', id);
    }

    async populateCategorySelect(selectElement, type = 'expense') {
        const categories = await this.getCategories(type);
        selectElement.innerHTML = '';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.emoji} ${lang.translate(category.name.toLowerCase())}`;
            selectElement.appendChild(option);
        });

        // Initialize custom select if settingsManager is available
        if (typeof settingsManager !== 'undefined' && settingsManager.createCustomSelect) {
            settingsManager.createCustomSelect(selectElement);
        }
    }

    async renderCategoriesList() {
        const container = document.getElementById('categories-list');
        const categories = await this.getCategories();

        if (categories.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: var(--spacing-lg); color: var(--text-tertiary);">No categories yet</p>';
            return;
        }

        // Group categories by type
        const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');
        const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

        let html = '';

        // Income Section
        if (incomeCategories.length > 0) {
            html += `
                <div style="margin-bottom: var(--spacing-lg);">
                    <h3 style="font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-secondary); margin-bottom: var(--spacing-sm); padding: 0 var(--spacing-sm); text-transform: uppercase; letter-spacing: 0.5px;">Income</h3>
                    <div class="settings-group">
                        ${incomeCategories.map((category, index) => `
                            <div class="setting-item" style="border-bottom: ${index < incomeCategories.length - 1 ? '1px solid var(--border-color)' : 'none'}; padding: var(--spacing-md) var(--spacing-lg);">
                                <div class="setting-info">
                                    <span style="font-size: 20px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background-color: #f6f8fa; border-radius: var(--radius-sm);">
                                        ${category.emoji}
                                    </span>
                                    <span style="font-size: var(--font-size-md); font-weight: var(--font-weight-medium); color: var(--text-primary);">
                                        ${lang.translate(category.name.toLowerCase())}
                                    </span>
                                </div>
                                <button class="btn-action category-edit-btn" data-category-id="${category.id}" title="Edit" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Expense Section
        if (expenseCategories.length > 0) {
            html += `
                <div>
                    <h3 style="font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-secondary); margin-bottom: var(--spacing-sm); padding: 0 var(--spacing-sm); text-transform: uppercase; letter-spacing: 0.5px;">Expense</h3>
                    <div class="settings-group">
                        ${expenseCategories.map((category, index) => `
                            <div class="setting-item" style="border-bottom: ${index < expenseCategories.length - 1 ? '1px solid var(--border-color)' : 'none'}; padding: var(--spacing-md) var(--spacing-lg);">
                                <div class="setting-info">
                                    <span style="font-size: 20px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background-color: #f6f8fa; border-radius: var(--radius-sm);">
                                        ${category.emoji}
                                    </span>
                                    <span style="font-size: var(--font-size-md); font-weight: var(--font-weight-medium); color: var(--text-primary);">
                                        ${lang.translate(category.name.toLowerCase())}
                                    </span>
                                </div>
                                <div style="display: flex; gap: var(--spacing-xs);">
                                    <button class="btn-action category-edit-btn" data-category-id="${category.id}" title="Edit" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Setup event listeners for the buttons
        this.setupCategoryEventListeners();
    }

    setupCategoryEventListeners() {
        // Edit buttons
        const editButtons = document.querySelectorAll('.category-edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = parseInt(btn.getAttribute('data-category-id'));
                this.editCategory(categoryId);
            });
        });

        // Delete button in modal
        const modalDeleteBtn = document.getElementById('delete-category-btn');
        if (modalDeleteBtn) {
            modalDeleteBtn.addEventListener('click', () => {
                const categoryId = document.getElementById('category-id').value;
                if (categoryId) {
                    this.confirmDeleteCategory(parseInt(categoryId));
                }
            });
        }
    }

    isDefaultCategory(name) {
        return this.defaultCategories.some(c => c.name === name);
    }

    getCategoryColor(categoryName) {
        const category = this.defaultCategories.find(c => c.name === categoryName);
        return category ? category.color : '#8E8E93';
    }

    getCategoryEmoji(categoryName) {
        const category = this.defaultCategories.find(c => c.name === categoryName);
        return category ? category.emoji : '➕';
    }

    async editCategory(id) {
        const category = await this.getCategoryById(id);
        if (!category) return;

        // Open the category form modal in edit mode
        const modal = document.getElementById('category-form-modal');
        const title = document.getElementById('category-form-title');
        const emojiInput = document.getElementById('category-emoji');
        const nameInput = document.getElementById('category-name');
        const typeSelect = document.getElementById('category-type');
        const idInput = document.getElementById('category-id');
        const deleteBtn = document.getElementById('delete-category-btn');

        if (modal && title && emojiInput && nameInput && typeSelect && idInput) {
            title.textContent = 'Edit Category';
            emojiInput.value = category.emoji;
            nameInput.value = category.name;
            typeSelect.value = category.type;
            idInput.value = category.id;

            // Show delete button in edit mode
            if (deleteBtn) {
                deleteBtn.style.display = 'flex';
            }

            // Close categories modal and open form modal
            document.getElementById('categories-modal').classList.remove('active');
            modal.classList.add('active');
        }
    }

    async confirmDeleteCategory(id) {
        const category = await this.getCategoryById(id);
        if (!category) return;

        const confirmed = await Utils.confirm(
            `This will permanently delete "${category.name}". Transactions using this category will not be affected.`,
            'Delete Category',
            'Delete'
        );

        if (confirmed) {
            const success = await this.deleteCategory(id);
            if (success) {
                showToast('Category deleted successfully');

                // Close the edit modal
                document.getElementById('category-form-modal').classList.remove('active');

                // Refresh the categories list
                await this.renderCategoriesList();

                // Refresh transaction modal category dropdown if it's open
                if (typeof categoryFormHandler !== 'undefined') {
                    categoryFormHandler.refreshTransactionCategoryDropdown();
                }
            } else {
                showToast('Error deleting category');
            }
        }
    }
}

// Create global categories manager instance
const categoriesManager = new CategoriesManager();
