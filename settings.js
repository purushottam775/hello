class SettingsManager {
    constructor() {
        this.settings = this.loadSettings() || {
            personal: {
                fullName: '',
                email: '',
                phone: '',
                university: '',
                studentId: ''
            },
            preferences: {
                currency: 'INR',
                language: 'en',
                emailNotifications: true,
                smsNotifications: false
            },
            privacy: {
                profileVisibility: false,
                shareData: true
            },
            lastUpdated: null
        };

        this.initializeEventListeners();
        this.loadUserSettings();
    }

    initializeEventListeners() {
        // Save settings
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveUserSettings());

        // Export data
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportUserData());

        // Delete account
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => this.showDeleteModal());
        document.getElementById('deleteConfirmation')?.addEventListener('input', (e) => this.handleDeleteConfirmation(e));
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.deleteAccount());

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideDeleteModal());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('deleteModal');
            if (e.target === modal) {
                this.hideDeleteModal();
            }
        });

        // Form input changes
        document.querySelectorAll('.form-input, .checkbox-label input').forEach(input => {
            input.addEventListener('change', () => this.markAsUnsaved());
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDeleteModal();
            }
        });
    }

    loadUserSettings() {
        // Load personal information
        Object.keys(this.settings.personal).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = this.settings.personal[key];
            }
        });

        // Load preferences
        document.getElementById('currency').value = this.settings.preferences.currency;
        document.getElementById('language').value = this.settings.preferences.language;
        document.getElementById('emailNotifications').checked = this.settings.preferences.emailNotifications;
        document.getElementById('smsNotifications').checked = this.settings.preferences.smsNotifications;

        // Load privacy settings
        document.getElementById('profileVisibility').checked = this.settings.privacy.profileVisibility;
        document.getElementById('shareData').checked = this.settings.privacy.shareData;

        // Update display name in sidebar
        this.updateDisplayName();
    }

    saveUserSettings() {
        try {
            // Gather personal information
            this.settings.personal = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                university: document.getElementById('university').value,
                studentId: document.getElementById('studentId').value
            };

            // Gather preferences
            this.settings.preferences = {
                currency: document.getElementById('currency').value,
                language: document.getElementById('language').value,
                emailNotifications: document.getElementById('emailNotifications').checked,
                smsNotifications: document.getElementById('smsNotifications').checked
            };

            // Gather privacy settings
            this.settings.privacy = {
                profileVisibility: document.getElementById('profileVisibility').checked,
                shareData: document.getElementById('shareData').checked
            };

            this.settings.lastUpdated = new Date().toISOString();
            this.saveSettings();
            this.updateDisplayName();
            this.showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    exportUserData() {
        try {
            const data = {
                settings: this.settings,
                budget: JSON.parse(localStorage.getItem('budgetData') || '{}'),
                transactions: JSON.parse(localStorage.getItem('transactions') || '[]')
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smart-budget-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }

    showDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('deleteConfirmation').value = '';
            document.getElementById('confirmDeleteBtn').disabled = true;
        }
    }

    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    handleDeleteConfirmation(e) {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (confirmBtn) {
            confirmBtn.disabled = e.target.value !== 'DELETE';
        }
    }

    deleteAccount() {
        try {
            // Clear all local storage data
            localStorage.clear();

            // Show success message
            this.showNotification('Account deleted successfully', 'success');

            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Failed to delete account', 'error');
        }
    }

    markAsUnsaved() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.classList.add('unsaved');
        }
    }

    updateDisplayName() {
        const displayName = document.getElementById('userNameDisplay');
        if (displayName) {
            displayName.textContent = this.settings.personal.fullName || 'User Name';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadSettings() {
        try {
            const data = localStorage.getItem('userSettings');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading settings:', error);
            return null;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('userSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }
}

// Initialize Settings Manager
const settingsManager = new SettingsManager(); 