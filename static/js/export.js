// export.js - Export functionality for reports and diagrams

/**
 * Export module for creating and saving reports
 */
const Export = {
    /**
     * Creates export buttons for reports
     * @param {string} projectId - Project identifier
     */
    addReportExportButtons(projectId) {
        // Skip if buttons already exist
        if (document.getElementById('export-buttons')) {
            return;
        }

        // Create container for buttons
        const exportContainer = document.createElement('div');
        exportContainer.id = 'export-buttons';
        exportContainer.className = 'mt-4 mb-4';

        // Header for export section
        const exportHeader = document.createElement('h5');
        exportHeader.textContent = 'Экспорт результатов анализа';
        exportContainer.appendChild(exportHeader);

        // Button group
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group mt-2';

        // JSON export button
        const jsonButton = document.createElement('button');
        jsonButton.className = 'btn btn-outline-secondary';
        jsonButton.innerHTML = '<i class="bi bi-file-earmark-code"></i> Экспорт в JSON';
        jsonButton.onclick = () => this.exportReportAsJSON(projectId);
        buttonGroup.appendChild(jsonButton);

        // HTML export button
        const htmlButton = document.createElement('button');
        htmlButton.className = 'btn btn-outline-secondary';
        htmlButton.innerHTML = '<i class="bi bi-file-earmark-text"></i> Экспорт в HTML';
        htmlButton.onclick = () => this.exportReportAsHTML(projectId);
        buttonGroup.appendChild(htmlButton);

        // Mermaid diagram export button
        const mermaidButton = document.createElement('button');
        mermaidButton.className = 'btn btn-outline-secondary';
        mermaidButton.innerHTML = '<i class="bi bi-diagram-3"></i> Экспорт диаграммы классов';
        mermaidButton.onclick = () => this.exportGraphAsMermaid(projectId);
        buttonGroup.appendChild(mermaidButton);

        // Add button group to container
        exportContainer.appendChild(buttonGroup);

        // Add container to results section
        const resultsSection = document.getElementById('results');
        resultsSection.insertBefore(exportContainer, resultsSection.firstChild.nextSibling);
    },

    /**
     * Export report as JSON file
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     */
    async exportReportAsJSON(projectId) {
        try {
            // Get full report from server
            const response = await fetch(`/report/${projectId}`);
            const report = await response.json();

            if (!response.ok) {
                throw new Error(`Server returned error: ${report.error || response.status}`);
            }

            // Create JSON blob
            const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });

            // Generate filename with timestamp
            const timestamp = Utils.getTimestampString();
            const filename = `code_analysis_report_${timestamp}.json`;

            // Trigger download
            Utils.triggerDownload(reportBlob, filename);

            // Save report on server
            try {
                const saveResponse = await fetch(`/save_report/${projectId}`);
                const saveResult = await saveResponse.json();

                if (saveResponse.ok) {
                    console.log('Report saved successfully on server:', saveResult.message);
                    Utils.showNotification(saveResult.message);
                } else {
                    console.error('Error saving report on server:', saveResult.error);
                    Utils.showNotification(saveResult.error, 'danger');
                }
            } catch (saveError) {
                Utils.handleError(saveError, 'saving report on server', false);
            }
        } catch (error) {
            Utils.handleError(error, 'exporting report as JSON');
        }
    },

    /**
     * Export report as HTML file
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     */
    async exportReportAsHTML(projectId) {
        try {
            // Get report data from server
            const reportResponse = await fetch(`/report/${projectId}`);
            const report = await reportResponse.json();

            if (!reportResponse.ok) {
                throw new Error(`Server returned error: ${report.error || reportResponse.status}`);
            }

            // Get complex functions data
            const complexFuncsResponse = await fetch(`/complex_functions/${projectId}`);
            const complexFunctions = await complexFuncsResponse.json();

            // Get dependencies data
            const dependenciesResponse = await fetch(`/dependencies/${projectId}`);
            const dependencies = await dependenciesResponse.json();

            // Generate filename with timestamp
            const timestamp = Utils.getTimestampString();
            const filename = `code_analysis_report_${timestamp}.html`;

            // Create HTML template
            const htmlTemplate = this._generateHTMLReport(report, complexFunctions, dependencies);

            // Create HTML blob
            const htmlBlob = new Blob([htmlTemplate], { type: 'text/html' });

            // Trigger download
            Utils.triggerDownload(htmlBlob, filename);

            // Save HTML report on server
            try {
                const saveResponse = await fetch(`/save_html_report/${projectId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        html_content: htmlTemplate,
                        file_name: filename
                    })
                });

                const saveResult = await saveResponse.json();

                if (saveResponse.ok) {
                    console.log('HTML report saved successfully on server:', saveResult.message);
                    Utils.showNotification(saveResult.message);
                } else {
                    console.error('Error saving HTML report on server:', saveResult.error);
                    Utils.showNotification(saveResult.error, 'danger');
                }
            } catch (saveError) {
                Utils.handleError(saveError, 'saving HTML report on server', false);
            }
        } catch (error) {
            Utils.handleError(error, 'exporting report as HTML');
        }
    },

    /**
     * Generate HTML report template
     * @param {Object} report - Report data
     * @param {Array} complexFunctions - Complex functions data
     * @param {Object} dependencies - Dependencies data
     * @returns {string} HTML template
     * @private
     */
    _generateHTMLReport(report, complexFunctions, dependencies) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Code Analysis Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
        .summary-item { display: inline-block; width: 22%; margin: 1%; padding: 10px;
                       text-align: center; background-color: #f8f9fa; border-radius: 4px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
        pre { background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Code Analysis Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>

        <div class="card">
            <h2>Project Summary</h2>
            <div>
                <div class="summary-item">
                    <h3>${report.total_modules}</h3>
                    <p>Modules</p>
                </div>
                <div class="summary-item">
                    <h3>${report.total_loc}</h3>
                    <p>Lines of Code</p>
                </div>
                <div class="summary-item">
                    <h3>${report.total_functions}</h3>
                    <p>Functions</p>
                </div>
                <div class="summary-item">
                    <h3>${report.total_classes}</h3>
                    <p>Classes</p>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Complex Functions</h2>
            ${complexFunctions && complexFunctions.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Module</th>
                        <th>Class</th>
                        <th>Complexity</th>
                    </tr>
                </thead>
                <tbody>
                    ${complexFunctions.map(func => `
                    <tr>
                        <td>${func.name || 'Unnamed'}</td>
                        <td>${func.module || 'Unknown'}</td>
                        <td>${func.class || '-'}</td>
                        <td>${func.complexity || 0}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            <div>
                <p><strong>About Cyclomatic Complexity:</strong></p>
                <ul>
                    <li>1-4: Low complexity - easy to test and understand</li>
                    <li>5-10: Moderate complexity - pay attention to these functions</li>
                    <li>11-20: High complexity - consider refactoring</li>
                    <li>21+: Very high complexity - refactoring required</li>
                </ul>
            </div>
            ` : '<p>No complex functions found in the project.</p>'}
        </div>

        <div class="card">
            <h2>Dependency Graph</h2>
            <p>Module dependencies represented as a graph:</p>
            <pre>${JSON.stringify(dependencies, null, 2)}</pre>
        </div>

        <div class="footer">
            <p>Generated by Code Analyzer Tool | ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
    },

    /**
     * Export dependency graph as Mermaid diagram
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     */
    async exportGraphAsMermaid(projectId) {
        try {
            // Get dependencies
            const dependenciesResponse = await fetch(`/dependencies/${projectId}`);
            const dependencies = await dependenciesResponse.json();

            if (!dependenciesResponse.ok) {
                throw new Error(`Server returned error: ${dependencies.error || dependenciesResponse.status}`);
            }

            console.log("Dependencies for Mermaid:", dependencies);

            // Generate Mermaid diagram text
            const mermaidText = this._generateMermaidDiagram(dependencies);

            // Create and download blob
            const blob = new Blob([mermaidText], { type: 'text/plain' });
            const timestamp = Utils.getTimestampString();
            const filename = `dependency_graph_${timestamp}.mermaid`;

            Utils.triggerDownload(blob, filename);

            // Save on server
            try {
                const saveResponse = await fetch(`/save_mermaid/${projectId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mermaid_data: mermaidText })
                });

                const result = await saveResponse.json();

                if (saveResponse.ok) {
                    console.log('Mermaid diagram saved on server:', result.message);
                    Utils.showNotification(result.message);
                } else {
                    console.error('Error saving Mermaid diagram on server:', result.error);
                    Utils.showNotification(result.error, 'danger');
                }
            } catch (saveError) {
                Utils.handleError(saveError, 'saving Mermaid diagram on server', false);
            }
        } catch (error) {
            Utils.handleError(error, 'exporting Mermaid diagram');
        }
    },

    /**
     * Generate Mermaid diagram text from dependencies
     * @param {Object} dependencies - Dependencies data
     * @returns {string} Mermaid diagram text
     * @private
     */
    _generateMermaidDiagram(dependencies) {
        let mermaidText = "classDiagram\n";

        // Dictionary for storing classes and their methods
        const classes = {};

        // First create all classes from project modules
        for (const modulePath in dependencies) {
            // Get class name from file path
            const moduleName = Utils.getFilenameFromPath(modulePath);

            // Normalize name for use in Mermaid
            const className = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');

            // Save in dictionary for further use
            classes[modulePath] = {
                name: className,
                methods: []
            };

            // Add methods based on class name
            classes[modulePath].methods.push(`+process()`);

            if (moduleName.toLowerCase().includes('manager')) {
                classes[modulePath].methods.push(`+manage(options)`);
            }

            if (moduleName.toLowerCase().includes('helper')) {
                classes[modulePath].methods.push(`+provide_assistance()`);
            }
        }

        // Add all classes to Mermaid text
        for (const modulePath in classes) {
            const classInfo = classes[modulePath];

            // Class definition
            mermaidText += `    class ${classInfo.name} {\n`;

            // Class methods
            classInfo.methods.forEach(method => {
                mermaidText += `        ${method}\n`;
            });

            mermaidText += `    }\n`;
        }

        // Add relationships between modules
        mermaidText += "\n    %% Relationships between classes\n";
        let relationshipsFound = false;

        for (const modulePath in dependencies) {
            const sourceClassName = classes[modulePath].name;

            // Skip if no dependencies
            if (!Array.isArray(dependencies[modulePath]) || dependencies[modulePath].length === 0) {
                continue;
            }

            // Process each dependency
            for (const dependency of dependencies[modulePath]) {
                // Find the actual module path for this dependency
                let targetClassName = null;

                // Strategy 1: Direct match
                if (dependencies.hasOwnProperty(dependency)) {
                    targetClassName = classes[dependency].name;
                }
                // Strategy 2: Match by filename
                else {
                    for (const path in classes) {
                        const fileName = Utils.getFilenameFromPath(path);
                        if (fileName === dependency) {
                            targetClassName = classes[path].name;
                            break;
                        }
                    }
                }

                // If found matching target module, add relationship
                if (targetClassName) {
                    mermaidText += `    ${sourceClassName} --> ${targetClassName}\n`;
                    relationshipsFound = true;
                } else {
                    // If no matching module found, create placeholder
                    const placeholderName = dependency.replace(/[^a-zA-Z0-9_]/g, '_');

                    // Check if placeholder already added
                    if (!classes[dependency]) {
                        mermaidText += `    class ${placeholderName} {\n`;
                        mermaidText += `        +process()\n`;
                        mermaidText += `    }\n`;

                        // Add to classes dict to prevent duplicates
                        classes[dependency] = {
                            name: placeholderName,
                            methods: ['+process()']
                        };
                    }

                    mermaidText += `    ${sourceClassName} --> ${placeholderName}\n`;
                    relationshipsFound = true;
                }
            }
        }

        // Add note if no relationships found
        if (!relationshipsFound) {
            mermaidText += "    %% No relationships found between classes\n";
        }

        return mermaidText;
    }
};