class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        // ADD YOUR GOOGLE SHEETS JSON URL HERE:
        this.sheetsUrl = 'https://docs.google.com/spreadsheets/d/1Vovs-AYYwwyAq-5wjwJG_h5MFxl-nBja2ZtLUu-mukY/gviz/tq?tqx=out:json';
    }

    async init() {
        await this.loadNotifications();
        await this.fetchFromSheets();
        this.setupEventListeners();
        this.updateBadge();
    }

    setupEventListeners() {
        // Bell icon click
        const bellIcon = document.getElementById('notification-bell');
        if (bellIcon) {
            bellIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openNotificationsModal();
            });
        }

        // Close modal
        const closeBtn = document.getElementById('close-notifications-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeNotificationsModal();
            });
        }

        // Mark all as read
        const markAllBtn = document.getElementById('mark-all-read-btn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }

    async loadNotifications() {
        try {
            const stored = await db.getSetting('notifications');
            if (stored) {
                this.notifications = stored;
                this.calculateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async saveNotifications() {
        try {
            await db.setSetting('notifications', this.notifications);
            this.calculateUnreadCount();
            this.updateBadge();
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    async fetchFromSheets() {
        try {
            // Skip if URL not configured
            if (!this.sheetsUrl || this.sheetsUrl === 'YOUR_GOOGLE_SHEETS_JSON_URL_HERE') {
                return;
            }

            const response = await fetch(this.sheetsUrl, { cache: "no-cache" });
            const text = await response.text();

            // Parse Google Visualization API format
            const jsonText = text
                .replace("/*O_o*/", "")
                .replace("google.visualization.Query.setResponse(", "")
                .slice(0, -2);

            const data = JSON.parse(jsonText);

            // Parse Google Sheets data
            const newNotifications = this.parseSheetData(data);

            // Merge with existing notifications (avoid duplicates)
            this.mergeNotifications(newNotifications);

            await this.saveNotifications();
        } catch (error) {
            // Silently fail - offline mode
            console.error('Failed to fetch notifications:', error);
        }
    }

    parseSheetData(data) {
        const notifications = [];

        // Google Visualization API format: data.table.rows
        if (!data.table || !data.table.rows) {
            return notifications;
        }

        const rows = data.table.rows;

        rows.forEach((row, index) => {
            // Each row has cells in array 'c'
            // Assuming columns: title, message, date, type
            const cells = row.c || [];

            const title = cells[0]?.v || 'Notification';
            const message = cells[1]?.v || '';
            const date = cells[2]?.f || cells[2]?.v || new Date().toISOString();
            const type = cells[3]?.v || 'info';

            // Create unique ID from title + date
            const id = `notif-${title.replace(/\s/g, '-').toLowerCase()}-${index}`;

            notifications.push({
                id,
                title,
                message,
                date,
                type,
                read: false
            });
        });

        return notifications;
    }

    mergeNotifications(newNotifications) {
        // Create a map of existing notifications to preserve read status
        const existingMap = new Map();
        this.notifications.forEach(n => {
            existingMap.set(n.id, n.read);
        });

        // Replace notifications with new ones from sheets
        // This ensures deleted notifications from sheets are removed locally
        this.notifications = newNotifications.map(newNotif => {
            // Preserve read status if notification existed before
            if (existingMap.has(newNotif.id)) {
                newNotif.read = existingMap.get(newNotif.id);
            }
            return newNotif;
        });

        // Sort by date (newest first)
        this.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    calculateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    openNotificationsModal() {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            this.renderNotifications();
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    }

    closeNotificationsModal() {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        // Update count display
        const countDisplay = document.getElementById('notifications-count');
        if (countDisplay) {
            const count = this.notifications.length;
            countDisplay.textContent = `${count} notification${count !== 1 ? 's' : ''}`;
        }

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-tertiary);">
                    <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 1rem; margin: 0;">No notifications yet</p>
                    <p style="font-size: 0.875rem; margin-top: 8px;">Check back later for updates</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notif => `
            <div class="notification-card ${notif.read ? 'read' : 'unread'} notification-${notif.type}" data-id="${notif.id}">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notif.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4 class="notification-title">${notif.title}</h4>
                        <span class="notification-date">${this.formatDate(notif.date)}</span>
                    </div>
                    <p class="notification-message">${notif.message}</p>
                </div>
            </div>
        `).join('');

        // Add click handlers to mark as read
        container.querySelectorAll('.notification-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.markAsRead(id);
            });
        });
    }

    getNotificationIcon(type) {
        const icons = {
            info: '<i class="fas fa-info-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            update: '<i class="fas fa-sync-alt"></i>',
            feature: '<i class="fas fa-star"></i>'
        };
        return icons[type] || icons.info;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.renderNotifications();
        }
    }

    async markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        await this.saveNotifications();
        this.renderNotifications();
    }

    // Method to manually add a notification (for testing or local notifications)
    async addNotification(title, message, type = 'info') {
        const notification = {
            id: `local-${Date.now()}`,
            title,
            message,
            date: new Date().toISOString(),
            type,
            read: false
        };

        this.notifications.unshift(notification);
        await this.saveNotifications();
    }
}

// Create global instance
const notificationsManager = new NotificationsManager();
