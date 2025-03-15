// utils.js - Shared utility functions across the application

/**
 * Namespace for utility functions
 */
const Utils = {
    /**
     * Shows a notification to the user
     * @param {string} message - Message to display
     * @param {string} type - Bootstrap alert type (success, danger, info, warning)
     * @param {number} duration - Duration in milliseconds before auto-hiding (0 for no auto-hide)
     * @param {HTMLElement} [container=null] - Container to append notification to (if null, adds below export buttons)
     */
    showNotification: function(message, type = 'success', duration = 5000, container = null) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Find container to add notification to
        if (!container) {
            // Default: add after export buttons
            container = document.getElementById('export-buttons');
            if (container) {
                container.parentNode.insertBefore(notification, container.nextSibling);
            } else {
                // Fallback: add to results section
                container = document.getElementById('results');
                if (container) {
                    container.appendChild(notification);
                } else {
                    // Last resort: add to body
                    document.body.appendChild(notification);
                }
            }
        } else {
            container.appendChild(notification);
        }

        // Auto-hide notification after duration (if specified)
        if (duration > 0) {
            setTimeout(() => {
                notification.remove();
            }, duration);
        }

        return notification;
    },

    /**
     * Handle API errors consistently
     * @param {Error} error - Error object
     * @param {string} operation - Description of the operation that failed
     * @param {boolean} showAlert - Whether to show an alert to the user
     */
    handleError: function(error, operation, showAlert = true) {
        console.error(`Error during ${operation}:`, error);

        if (showAlert) {
            this.showNotification(
                `Error during ${operation}: ${error.message}`,
                'danger',
                7000
            );
        }
    },

    /**
     * Generate a human-readable file size string
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize: function(bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    },

    /**
     * Safely extract filename from path
     * @param {string} path - File path
     * @returns {string} Extracted filename without extension
     */
    getFilenameFromPath: function(path) {
        return path.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '');
    },

    /**
     * Create a timestamp string for filenames
     * @returns {string} Formatted timestamp (YYYYMMDD_HHMMSS)
     */
    getTimestampString: function() {
        const now = new Date();
        return now.toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
    },

    /**
     * Create and trigger a download for client-side generated content
     * @param {Blob} blob - The data to download
     * @param {string} filename - Name for the downloaded file
     */
    triggerDownload: function(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }
};

// Export the Utils namespace
window.Utils = Utils;