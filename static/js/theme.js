/**
 * Theme module for managing light/dark themes
 */
const Theme = {
    /**
     * Current theme ('light' or 'dark')
     */
    current: 'light',

    /**
     * Initialize theme system
     */
    initialize() {
        console.log('Initializing theme system...');
        this.loadThemePreference();
        this.addThemeToggle();
        this.applyTheme(this.current);
    },

    /**
     * Load saved theme preference from localStorage
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            this.current = savedTheme;
        } else {
            // Check for system preference if no saved theme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.current = 'dark';
            }
        }
    },

    /**
     * Add theme toggle button to navigation
     */
    addThemeToggle() {
        // Create theme toggle button container
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        themeToggle.style.position = 'fixed';
        themeToggle.style.top = '20px';
        themeToggle.style.right = '20px';
        themeToggle.style.zIndex = '1000';
        
        // Create the button
        themeToggle.innerHTML = `
            <button id="theme-toggle-btn" class="btn ${this.current === 'dark' ? 'btn-light' : 'btn-dark'}">
                <i class="bi ${this.current === 'dark' ? 'bi-sun' : 'bi-moon'}"></i>
                <span class="d-none d-md-inline">${this.current === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
        `;
        
        // Add to document body
        document.body.appendChild(themeToggle);
        
        // Add event listener
        setTimeout(() => {
            const toggleBtn = document.getElementById('theme-toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.toggleTheme();
                });
            } else {
                console.error('Theme toggle button not found in DOM');
            }
        }, 100);
    },

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        this.applyTheme(this.current);
        localStorage.setItem('theme', this.current);
        
        // Update button appearance
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.className = `btn ${this.current === 'dark' ? 'btn-light' : 'btn-dark'}`;
            toggleBtn.innerHTML = `
                <i class="bi ${this.current === 'dark' ? 'bi-sun' : 'bi-moon'}"></i>
                <span class="d-none d-md-inline">${this.current === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            `;
        }
    },

    /**
     * Apply the selected theme to the document
     * @param {string} theme - Theme to apply ('light' or 'dark')
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            // Add dark theme CSS variables
            root.style.setProperty('--bg-color', '#222');
            root.style.setProperty('--text-color', '#f5f5f5');
            root.style.setProperty('--card-bg', '#333');
            root.style.setProperty('--card-border', '#444');
            root.style.setProperty('--input-bg', '#3a3a3a');
            root.style.setProperty('--input-text', '#f5f5f5');
            root.style.setProperty('--table-hover', '#3f3f3f');
            root.style.setProperty('--table-border', '#444');
            root.style.setProperty('--bs-table-striped-bg', '#2a2a2a');
            root.style.setProperty('--link-color', '#6ea8fe');
            root.style.setProperty('--modal-bg', '#333');
            root.style.setProperty('--modal-header', '#2d2d2d');
            root.style.setProperty('--graph-bg', '#262626');
            root.style.setProperty('--graph-grid', '#333');

            // Force Bootstrap table styles
            this._overrideBootstrapTableStyles(true);

            document.body.classList.add('dark-theme');
        } else {
            // Reset to default (light theme)
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--text-color');
            root.style.removeProperty('--card-bg');
            root.style.removeProperty('--card-border');
            root.style.removeProperty('--input-bg');
            root.style.removeProperty('--input-text');
            root.style.removeProperty('--table-hover');
            root.style.removeProperty('--table-border');
            root.style.removeProperty('--bs-table-striped-bg');
            root.style.removeProperty('--link-color');
            root.style.removeProperty('--modal-bg');
            root.style.removeProperty('--modal-header');
            root.style.removeProperty('--graph-bg');
            root.style.removeProperty('--graph-grid');

            // Remove Bootstrap table style overrides
            this._overrideBootstrapTableStyles(false);

            document.body.classList.remove('dark-theme');
        }

        // Apply theme to any D3 svg elements if they exist
        if (window.Graph && window.Graph.svg) {
            this.updateGraphTheme();
        }
    },

    /**
     * Override Bootstrap table styles directly in JS for maximum compatibility
     * @param {boolean} isDark - Whether to apply dark theme styles
     * @private
     */
    _overrideBootstrapTableStyles(isDark) {
        // Find or create our style element
        let styleEl = document.getElementById('dynamic-table-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-table-styles';
            document.head.appendChild(styleEl);
        }

        if (isDark) {
            // Add dark theme table styles
            styleEl.textContent = `
                .table { color: #f5f5f5 !important; }
                .table td, .table th { color: #f5f5f5 !important; }
                .table-striped > tbody > tr:nth-of-type(odd) > * {
                    color: #f5f5f5 !important;
                    background-color: #2a2a2a;
                }
                .table-striped > tbody > tr:nth-of-type(even) > * {
                    color: #f5f5f5 !important;
                }
                .table-hover > tbody > tr:hover > * {
                    color: #f5f5f5 !important;
                    background-color: #3f3f3f;
                }
            `;
        } else {
            // Clear custom styles for light theme
            styleEl.textContent = '';
        }
    },

    /**
     * Update D3 graph colors based on current theme
     */
    updateGraphTheme() {
        if (!window.Graph || !window.Graph.svg) {
            return;
        }

        const isDark = this.current === 'dark';

        // Update graph background
        window.Graph.svg.selectAll('rect')
            .filter(function() {
                return d3.select(this).attr('fill') === 'none';
            })
            .attr('stroke', isDark ? '#444' : '#eee');

        // Update grid lines
        window.Graph.svg.selectAll('.grid line')
            .attr('stroke', isDark ? '#333' : '#f5f5f5');

        // Update node labels background
        window.Graph.svg.selectAll('g > g > rect')
            .attr('fill', isDark ? '#333' : 'white')
            .attr('stroke', isDark ? '#555' : '#eee');

        // Update node labels color
        window.Graph.svg.selectAll('g > g > text')
            .attr('fill', isDark ? '#f5f5f5' : '#000');
    }
};

// Export to window
window.Theme = Theme;