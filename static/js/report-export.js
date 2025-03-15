// report-export.js - Функции для экспорта отчетов анализа

// Improved exportGraphAsMermaid function with better relationship handling
async function exportGraphAsMermaid(projectId) {
    try {
        // Get dependencies
        const dependenciesResponse = await fetch(`/dependencies/${projectId}`);
        const dependencies = await dependenciesResponse.json();

        console.log("Dependencies:", dependencies);

        // Create Mermaid classDiagram text
        let mermaidText = "classDiagram\n";

        // Dictionary for storing classes and their methods
        const classes = {};

        // First create all classes from project modules
        for (const modulePath in dependencies) {
            // Get class name from file path
            const moduleName = modulePath.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '');

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
                // Try different matching strategies
                let targetModulePath = null;
                let targetClassName = null;

                // Strategy 1: Direct match
                if (dependencies.hasOwnProperty(dependency)) {
                    targetModulePath = dependency;
                    targetClassName = classes[targetModulePath].name;
                }
                // Strategy 2: Match by filename
                else {
                    for (const path in classes) {
                        const fileName = path.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '');
                        if (fileName === dependency) {
                            targetModulePath = path;
                            targetClassName = classes[path].name;
                            break;
                        }
                    }
                }

                // If we found a matching target module, add the relationship
                if (targetClassName) {
                    mermaidText += `    ${sourceClassName} --> ${targetClassName}\n`;
                    relationshipsFound = true;
                } else {
                    // If no matching module found, create a placeholder class for the dependency
                    const placeholderName = dependency.replace(/[^a-zA-Z0-9_]/g, '_');
                    mermaidText += `    class ${placeholderName} {\n`;
                    mermaidText += `        +process()\n`;
                    mermaidText += `    }\n`;
                    mermaidText += `    ${sourceClassName} --> ${placeholderName}\n`;
                    relationshipsFound = true;

                    // Add the placeholder to our classes dict to prevent duplicates
                    classes[dependency] = {
                        name: placeholderName,
                        methods: ['+process()']
                    };
                }
            }
        }

        // Add a comment if no relationships were found
        if (!relationshipsFound) {
            mermaidText += "    %% No relationships found between classes\n";
        }

        // Create Blob for download
        const blob = new Blob([mermaidText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `dependency_graph_${timestamp}.mermaid`;

        // Download file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Free URL
        URL.revokeObjectURL(url);

        // Save on server
        const saveResponse = await fetch(`/save_mermaid/${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mermaid_data: mermaidText })
        });

        const result = await saveResponse.json();
        if (saveResponse.ok) {
            console.log('Mermaid saved on server:', result.message);

            // Notify user
            const notification = document.createElement('div');
            notification.className = 'alert alert-success alert-dismissible fade show mt-3';
            notification.innerHTML = `
                ${result.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            // Add notification after export buttons
            const exportButtons = document.getElementById('export-buttons');
            if (exportButtons) {
                exportButtons.parentNode.insertBefore(notification, exportButtons.nextSibling);
            }

            // Automatically hide notification after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

    } catch (error) {
        console.error('Error exporting Mermaid diagram:', error);
        alert('Error exporting Mermaid diagram: ' + error.message);
    }
}
// Функция для экспорта полного отчета в JSON
async function exportReportAsJSON(projectId) {
    try {
        // Получаем полный отчет с сервера
        const response = await fetch(`/report/${projectId}`);
        const report = await response.json();

        // Создаем Blob из JSON-данных
        const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(reportBlob);

        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `code_analysis_report_${timestamp}.json`;

        // Скачиваем
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Освобождаем URL
        URL.revokeObjectURL(url);

        // Сохраняем отчет на сервере
        try {
            const saveResponse = await fetch(`/save_report/${projectId}`);
            const saveResult = await saveResponse.json();

            if (saveResponse.ok) {
                console.log('Отчет успешно сохранен на сервере:', saveResult.message);

                // Показываем уведомление пользователю
                const notification = document.createElement('div');
                notification.className = 'alert alert-success alert-dismissible fade show mt-3';
                notification.innerHTML = `
                    ${saveResult.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

                // Добавляем уведомление после кнопок экспорта
                const exportButtons = document.getElementById('export-buttons');
                if (exportButtons) {
                    exportButtons.parentNode.insertBefore(notification, exportButtons.nextSibling);
                }

                // Автоматически скрываем уведомление через 5 секунд
                setTimeout(() => {
                    notification.remove();
                }, 5000);
            } else {
                console.error('Ошибка при сохранении отчета на сервере:', saveResult.error);
            }
        } catch (saveError) {
            console.error('Ошибка при отправке запроса на сохранение отчета:', saveError);
        }

    } catch (error) {
        console.error('Ошибка при экспорте отчета:', error);
        alert('Не удалось экспортировать отчет: ' + error.message);
    }
}

// Функция для экспорта отчета в HTML формате
async function exportReportAsHTML(projectId) {
    try {
        // Получаем полный отчет с сервера
        const response = await fetch(`/report/${projectId}`);
        const report = await response.json();

        // Получаем сложные функции и граф зависимостей
        const complexFuncsResponse = await fetch(`/complex_functions/${projectId}`);
        const complexFunctions = await complexFuncsResponse.json();

        const dependenciesResponse = await fetch(`/dependencies/${projectId}`);
        const dependencies = await dependenciesResponse.json();

        // Формируем имя файла с временной меткой
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `code_analysis_report_${timestamp}.html`;

        // Создаем HTML-шаблон для отчета
        const htmlTemplate = `
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
</html>
        `;

        // Создаем Blob из HTML-данных
        const htmlBlob = new Blob([htmlTemplate], { type: 'text/html' });
        const url = URL.createObjectURL(htmlBlob);

        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;

        // Скачиваем
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Освобождаем URL
        URL.revokeObjectURL(url);
        // Сохраняем HTML отчет на сервере
        try {
            const saveResponse = await fetch(`/save_html_report/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    html_content: htmlTemplate,
                    file_name: fileName
                })
            });
            const saveResult = await saveResponse.json();

            if (saveResponse.ok) {
                console.log('HTML отчет успешно сохранен на сервере:', saveResult.message);

                // Показываем уведомление пользователю
                const notification = document.createElement('div');
                notification.className = 'alert alert-success alert-dismissible fade show mt-3';
                notification.innerHTML = `
                    ${saveResult.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

                // Добавляем уведомление после кнопок экспорта
                const exportButtons = document.getElementById('export-buttons');
                if (exportButtons) {
                    exportButtons.parentNode.insertBefore(notification, exportButtons.nextSibling);
                }

                // Автоматически скрываем уведомление через 5 секунд
                setTimeout(() => {
                    notification.remove();
                }, 5000);
            } else {
                console.error('Ошибка при сохранении HTML отчета на сервере:', saveResult.error);

                // Показываем уведомление об ошибке
                const errorNotification = document.createElement('div');
                errorNotification.className = 'alert alert-danger alert-dismissible fade show mt-3';
                errorNotification.innerHTML = `
                    Ошибка при сохранении HTML отчета на сервере: ${saveResult.error}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

                // Добавляем уведомление после кнопок экспорта
                const exportButtons = document.getElementById('export-buttons');
                if (exportButtons) {
                    exportButtons.parentNode.insertBefore(errorNotification, exportButtons.nextSibling);
                }

                // Автоматически скрываем уведомление через 5 секунд
                setTimeout(() => {
                    errorNotification.remove();
                }, 5000);
            }
        } catch (saveError) {
            console.error('Ошибка при отправке запроса на сохранение HTML отчета:', saveError);

            // Показываем уведомление об ошибке
            const errorNotification = document.createElement('div');
            errorNotification.className = 'alert alert-danger alert-dismissible fade show mt-3';
            errorNotification.innerHTML = `
                Ошибка при отправке запроса на сохранение HTML отчета: ${saveError.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            // Добавляем уведомление после кнопок экспорта
            const exportButtons = document.getElementById('export-buttons');
            if (exportButtons) {
                exportButtons.parentNode.insertBefore(errorNotification, exportButtons.nextSibling);
            }

            // Автоматически скрываем уведомление через 5 секунд
            setTimeout(() => {
                errorNotification.remove();
            }, 5000);
        }
    } catch (error) {
        console.error('Ошибка при экспорте HTML-отчета:', error);
        alert('Не удалось экспортировать HTML-отчет: ' + error.message);
    }
}
// Функция для добавления кнопок экспорта отчета
function addReportExportButtons(projectId) {
    // Проверяем, не существуют ли уже кнопки экспорта
    if (document.getElementById('export-buttons')) {
        return;
    }

    // Создаем контейнер для кнопок
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-buttons';
    exportContainer.className = 'mt-4 mb-4';

    // Заголовок для секции экспорта
    const exportHeader = document.createElement('h5');
    exportHeader.textContent = 'Экспорт результатов анализа';
    exportContainer.appendChild(exportHeader);

    // Группа кнопок
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'btn-group mt-2';

    // Кнопка для экспорта отчета в JSON
    const jsonButton = document.createElement('button');
    jsonButton.className = 'btn btn-outline-secondary';
    jsonButton.innerHTML = '<i class="bi bi-file-earmark-code"></i> Экспорт в JSON';
    jsonButton.onclick = () => exportReportAsJSON(projectId);
    buttonGroup.appendChild(jsonButton);

    // Кнопка для экспорта отчета в HTML
    const htmlButton = document.createElement('button');
    htmlButton.className = 'btn btn-outline-secondary';
    htmlButton.innerHTML = '<i class="bi bi-file-earmark-text"></i> Экспорт в HTML';
    htmlButton.onclick = () => exportReportAsHTML(projectId);
    buttonGroup.appendChild(htmlButton);

    // Кнопка для экспорта отчета в формате Mermaid
    const mermaidButton = document.createElement('button');
    mermaidButton.className = 'btn btn-outline-secondary';
    mermaidButton.innerHTML = '<i class="bi bi-diagram-3"></i> Экспорт диаграммы классов';
    mermaidButton.onclick = () => exportGraphAsMermaid(projectId);
    buttonGroup.appendChild(mermaidButton);

    // Добавляем группу кнопок в контейнер
    exportContainer.appendChild(buttonGroup);


    // Находим секцию с результатами и добавляем контейнер с кнопками
    const resultsSection = document.getElementById('results');
    resultsSection.insertBefore(exportContainer, resultsSection.firstChild.nextSibling);
}