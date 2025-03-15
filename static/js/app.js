// app.js - Main application logic and initialization

// Global variable for current project ID
window.currentProjectId = null;

/**
 * Application main module
 */
const App = {
    /**
     * Initialize the application
     */
    initialize() {
        console.log('Initializing application...');

        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded. Initializing components...');

            // Initialize UI components
            UI.initialize();

            // Set up form handling
            this._setupAnalyzeForm();

            console.log('Initialization complete. Application ready.');
        });
    },

    /**
     * Set up analyze form submission handling
     * @private
     */
    _setupAnalyzeForm() {
        const analyzeForm = document.getElementById('analyze-form');

        if (!analyzeForm) {
            console.error('Analyze form not found in DOM!');
            return;
        }

        analyzeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            const projectPath = document.getElementById('project-path').value;
            if (!projectPath) {
                alert('Please enter a project path');
                return;
            }

            try {
                await this._performAnalysis(projectPath);
            } catch (error) {
                Utils.handleError(error, 'analyzing project');

                document.getElementById('results').classList.add('d-none');
            }
        });
    },

    /**
     * Perform project analysis
     * @param {string} projectPath - Path to the project
     * @returns {Promise<void>}
     * @private
     */
    async _performAnalysis(projectPath) {
        // Show loading indicators
        this._showLoadingState();

        // Send request to server
        console.log(`Sending analysis request: ${projectPath}`);
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `project_path=${encodeURIComponent(projectPath)}`
        });

        const data = await response.json();
        console.log('Received response from server:', data);

        if (response.ok) {
            // Save project ID
            window.currentProjectId = data.project_id;

            // Update summary information
            this._updateSummary(data.summary);

            // Add export buttons
            Export.addReportExportButtons(window.currentProjectId);

            // Load complex functions
            console.log('Loading complex functions with project_id:', data.project_id);
            await this._loadComplexFunctions(data.project_id);

            // Load dependency graph
            console.log('Loading dependency graph with project_id:', data.project_id);
            await Graph.loadDependencyGraph(data.project_id);

            console.log('Visualization complete');
        } else {
            alert(`Error: ${data.error}`);
            document.getElementById('results').classList.add('d-none');
        }
    },

    /**
     * Show loading state for analysis
     * @private
     */
    _showLoadingState() {
        // Show results section
        const resultsSection = document.getElementById('results');
        resultsSection.classList.remove('d-none');

        // Set counter values to "loading..."
        document.getElementById('total-modules').textContent = '...';
        document.getElementById('total-loc').textContent = '...';
        document.getElementById('total-functions').textContent = '...';
        document.getElementById('total-classes').textContent = '...';

        // Clear previous results and show spinners
        document.getElementById('complex-functions').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        document.getElementById('dependency-graph').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        // Remove existing export buttons if any
        const existingExportButtons = document.getElementById('export-buttons');
        if (existingExportButtons) {
            existingExportButtons.remove();
        }
    },

    /**
     * Update summary with analysis results
     * @param {Object} summary - Summary data
     * @private
     */
    _updateSummary(summary) {
        document.getElementById('total-modules').textContent = summary.total_modules;
        document.getElementById('total-loc').textContent = summary.total_loc;
        document.getElementById('total-functions').textContent = summary.total_functions;
        document.getElementById('total-classes').textContent = summary.total_classes;
    },

    /**
     * Load complex functions data
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     * @private
     */
    async _loadComplexFunctions(projectId) {
        try {
            const response = await fetch(`/complex_functions/${projectId}`);
            const functions = await response.json();

            console.log("Complex functions data:", functions);

            const container = document.getElementById('complex-functions');
            container.innerHTML = '';

            // Check if there's data to display
            if (!functions || functions.length === 0) {
                container.innerHTML = '<div class="alert alert-info">В проекте не найдено функций с высокой сложностью.</div>';
                return;
            }

            // Create table
            const table = document.createElement('table');
            table.className = 'table table-striped';

            // Table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Name</th>
                    <th>Module</th>
                    <th>Class</th>
                    <th>Complexity</th>
                </tr>
            `;
            table.appendChild(thead);

            // Table body
            const tbody = document.createElement('tbody');
            functions.forEach(func => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${func.name || 'Unnamed'}</td>
                    <td>${func.module || 'Unknown'}</td>
                    <td>${func.class || '-'}</td>
                    <td>${func.complexity || 0}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            container.appendChild(table);

            // Add info about cyclomatic complexity
            const infoDiv = document.createElement('div');
            infoDiv.className = 'mt-3 small text-muted';
            infoDiv.innerHTML = `
                <p><strong>О цикломатической сложности:</strong></p>
                <ul>
                    <li>1-4: Низкая сложность - легко тестировать и понимать</li>
                    <li>5-10: Умеренная сложность - обратите внимание на эти функции</li>
                    <li>11-20: Высокая сложность - рассмотрите возможность рефакторинга</li>
                    <li>21+: Очень высокая сложность - требуется рефакторинг</li>
                </ul>
            `;
            container.appendChild(infoDiv);
        } catch (error) {
            Utils.handleError(error, 'loading complex functions');
            const container = document.getElementById('complex-functions');
            container.innerHTML = `<div class="alert alert-danger">Ошибка при загрузке данных о сложных функциях: ${error.message}</div>`;
        }
    }
};

// Initialize the application
App.initialize();