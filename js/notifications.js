class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.sheetsUrl = 'https://docs.google.com/spreadsheets/d/1HVA23xlT1WIhz4aO6NIz5Ek2LoVlWVo2cnACNLbXtts/gviz/tq?tqx=out:json';
    }

    async init() {
        const sheetsFetched = await this.fetchFromSheets();

        if (sheetsFetched) {
            await this.loadAndMergeStoredNotifications();
            await this.saveNotifications();
        } else {
            await this.loadFromDatabase();
        }

        await this.expireOldNotifications();
        this.setupEventListeners();
        this.updateBadge();
    }

    setupEventListeners() {
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

    async loadAndMergeStoredNotifications() {
        try {
            const stored = await db.getSetting('notifications');
            if (stored && stored.length > 0) {
                // Create a map of stored read statuses
                const storedReadStatus = new Map();
                stored.forEach(n => {
                    storedReadStatus.set(n.id, n.read);
                });

                // Apply stored read status to current notifications
                this.notifications = this.notifications.map(notif => {
                    if (storedReadStatus.has(notif.id)) {
                        const wasRead = storedReadStatus.get(notif.id);
                        return {
                            ...notif,
                            read: wasRead
                        };
                    }
                    return notif;
                });

                // Sort by date (newest first)
                this.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

                this.calculateUnreadCount();
            } else {
                this.calculateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading stored notifications:', error);
        }
    }

    async loadFromDatabase() {
        try {
            const stored = await db.getSetting('notifications');
            if (stored && stored.length > 0) {
                this.notifications = stored;
                // Sort by date (newest first)
                this.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
                this.calculateUnreadCount();
            } else {
                this.notifications = [];
            }
        } catch (error) {
            console.error('Error loading notifications from DB:', error);
            this.notifications = [];
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

    async expireOldNotifications() {
        try {
            const EXPIRATION_DAYS = 30; // Notifications older than 30 days will be removed
            const now = new Date();
            const expirationDate = new Date(now.getTime() - (EXPIRATION_DAYS * 24 * 60 * 60 * 1000));

            const initialCount = this.notifications.length;

            // Filter out notifications older than expiration date
            this.notifications = this.notifications.filter(notification => {
                const notifDate = new Date(notification.date);

                // If date is invalid, keep the notification (don't remove it)
                if (isNaN(notifDate.getTime())) {
                    return true; // Keep notification with invalid date
                }

                return notifDate >= expirationDate;
            });

            const expiredCount = initialCount - this.notifications.length;

            // Save if any notifications were expired
            if (expiredCount > 0) {
                await this.saveNotifications();
            }
        } catch (error) {
            console.error('Error expiring old notifications:', error);
        }
    }

    async fetchFromSheets() {
        try {
            // Skip if URL not configured
            if (!this.sheetsUrl || this.sheetsUrl === 'YOUR_GOOGLE_SHEETS_JSON_URL_HERE') {
                return false;
            }

            const response = await fetch(this.sheetsUrl, { cache: "no-cache" });
            const text = await response.text();

            // Parse Google Visualization API format
            const jsonText = text
                .replace("/*O_o*/", "")
                .replace("google.visualization.Query.setResponse(", "")
                .slice(0, -2);

            const data = JSON.parse(jsonText);

            // Parse Google Sheets data and set as current notifications
            this.notifications = this.parseSheetData(data);
            // Sort by date (newest first)
            this.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
            return true;
        } catch (error) {
            // Silently fail - offline mode
            return false;
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

            // Create unique ID from title + message to ensure consistency
            const idString = `${title}-${message}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const id = `notif-${idString.substring(0, 50)}`;

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
