// ui.js - UI component management

/**
 * UI module for managing UI components and interactions
 */
const UI = {
    /**
     * Initialize UI elements and event listeners
     */
    initialize() {
        console.log('Initializing UI components...');

        // Add history button
        this.addHistoryButton();

        // Other UI initializations can be added here
    },

    /**
     * Add history button to analyze form
     */
    addHistoryButton() {
        // Skip if button already exists
        if (document.getElementById('history-button')) {
            return;
        }

        // Create history button
        const historyButton = document.createElement('button');
        historyButton.id = 'history-button';
        historyButton.className = 'btn btn-outline-secondary';
        historyButton.type = 'button'; // Prevent form submission
        historyButton.innerHTML = '<i class="bi bi-clock-history"></i> История анализов';
        historyButton.onclick = () => this.showReportsHistory();

        // Add button to form
        const analyzeForm = document.getElementById('analyze-form');
        const submitButton = analyzeForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.parentNode.insertBefore(historyButton, submitButton.nextSibling);
            historyButton.style.marginLeft = '10px';
        }
    },

    /**
     * Show modal with reports history
     * @returns {Promise<void>}
     */
    async showReportsHistory() {
        // Create or get modal
        let historyModal = document.getElementById('reports-history-modal');

        if (!historyModal) {
            // Create modal
            historyModal = document.createElement('div');
            historyModal.id = 'reports-history-modal';
            historyModal.className = 'modal fade';
            historyModal.tabIndex = -1;
            historyModal.setAttribute('aria-labelledby', 'reportsHistoryModalLabel');
            historyModal.setAttribute('aria-hidden', 'true');

            historyModal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reportsHistoryModalLabel">История анализов</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <input type="text" class="form-control" id="reports-filter" placeholder="Поиск по имени файла...">
                            </div>
                            <div class="mb-3">
                                <div class="btn-group btn-group-sm" role="group" aria-label="Фильтры по типу">
                                    <button type="button" class="btn btn-outline-secondary active" data-type="all">Все</button>
                                    <button type="button" class="btn btn-outline-secondary" data-type="JSON Report">JSON</button>
                                    <button type="button" class="btn btn-outline-secondary" data-type="HTML Report">HTML</button>
                                    <button type="button" class="btn btn-outline-secondary" data-type="SVG Diagram">SVG</button>
                                    <button type="button" class="btn btn-outline-secondary" data-type="Mermaid Diagram">Mermaid</button>
                                </div>
                            </div>
                            <div id="reports-list-container">
                                <div class="text-center">
                                    <div class="spinner-border" role="status">
                                        <span class="visually-hidden">Загрузка...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to DOM
            document.body.appendChild(historyModal);
        }

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(historyModal);
        modal.show();

        // Load reports list
        await this.loadReportsList();
    },

    /**
     * Load and display reports list
     * @returns {Promise<void>}
     */
    async loadReportsList() {
        try {
            // Fetch reports data
            const reports = await this._fetchReports();

            // Display reports
            const reportsListContainer = document.getElementById('reports-list-container');

            if (reports.length === 0) {
                reportsListContainer.innerHTML = `
                    <div class="alert alert-info">
                        История отчетов пуста. Сохраните хотя бы один отчет.
                    </div>
                `;
            } else {
                // Create reports table
                reportsListContainer.innerHTML = `
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Имя файла</th>
                                <th>Тип</th>
                                <th>Размер</th>
                                <th>Дата создания</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="reports-table-body">
                            ${this._generateReportsTableRows(reports)}
                        </tbody>
                    </table>
                `;

                // Add filter handlers
                this._setupReportFilters();
            }
        } catch (error) {
            Utils.handleError(error, 'loading reports list');

            const reportsListContainer = document.getElementById('reports-list-container');
            reportsListContainer.innerHTML = `
                <div class="alert alert-danger">
                    Ошибка при загрузке списка отчетов: ${error.message}
                </div>
            `;
        }
    },

    /**
     * Fetch reports from server
     * @returns {Promise<Array>} Array of report objects
     * @private
     */
    async _fetchReports() {
        try {
            const response = await fetch('/list_reports');
            const data = await response.json();

            if (response.ok) {
                return data.reports;
            } else {
                console.error('Error loading reports list:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },

    /**
     * Generate HTML for report table rows
     * @param {Array} reports - Reports data
     * @returns {string} HTML for table rows
     * @private
     */
    _generateReportsTableRows(reports) {
        return reports.map(report => {
            // Determine icon based on file type
            let icon;
            switch (report.type) {
                case 'JSON Report':
                    icon = '<i class="bi bi-file-earmark-code text-primary"></i>';
                    break;
                case 'HTML Report':
                    icon = '<i class="bi bi-file-earmark-text text-success"></i>';
                    break;
                case 'SVG Diagram':
                    icon = '<i class="bi bi-file-earmark-image text-warning"></i>';
                    break;
                case 'Mermaid Diagram':
                    icon = '<i class="bi bi-diagram-3 text-info"></i>';
                    break;
                default:
                    icon = '<i class="bi bi-file-earmark"></i>';
            }

            // Define actions based on file type
            let actions = `<a href="/download_report/${report.filename}" class="btn btn-sm btn-outline-primary me-1" download>Скачать</a>`;

            // Add preview button for HTML and SVG files
            if (report.type === 'HTML Report' || report.type === 'SVG Diagram') {
                actions += `<a href="/download_report/${report.filename}" class="btn btn-sm btn-outline-info" target="_blank">Просмотр</a>`;
            }

            return `
                <tr data-type="${report.type}" class="report-item">
                    <td>
                        ${icon}
                        <span class="ms-2">${report.filename}</span>
                    </td>
                    <td><span class="badge bg-secondary">${report.type}</span></td>
                    <td>${report.size || 'N/A'}</td>
                    <td>${report.created}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Set up event handlers for report filtering
     * @private
     */
    _setupReportFilters() {
        // Filter by name
        const filterInput = document.getElementById('reports-filter');
        if (filterInput) {
            filterInput.addEventListener('input', () => this._filterReports());
        }

        // Filter by type
        const modal = document.getElementById('reports-history-modal');
        const typeButtons = modal.querySelectorAll('.btn-group[aria-label="Фильтры по типу"] button');

        typeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                typeButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Apply filter
                UI._filterReports();
            });
        });
    },

    /**
     * Filter reports based on current filters
     * @private
     */
    _filterReports() {
        const filterText = document.getElementById('reports-filter').value.toLowerCase();
        const activeTypeButton = document.querySelector('.btn-group[aria-label="Фильтры по типу"] button.active');
        const selectedType = activeTypeButton.getAttribute('data-type');

        const allRows = document.querySelectorAll('#reports-table-body tr.report-item');

        allRows.forEach(row => {
            const filename = row.querySelector('td:first-child span').textContent.toLowerCase();
            const type = row.getAttribute('data-type');

            const matchesFilter = filename.includes(filterText);
            const matchesType = selectedType === 'all' || type === selectedType;

            row.style.display = (matchesFilter && matchesType) ? '' : 'none';
        });
    }
};

// Export the UI namespace
window.UI = UI;