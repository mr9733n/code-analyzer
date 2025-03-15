// history.js - Функции для работы с историей отчетов

// Функция для загрузки списка сохраненных отчетов
async function loadReportsList() {
    try {
        const response = await fetch('/list_reports');
        const data = await response.json();

        if (response.ok) {
            return data.reports;
        } else {
            console.error('Ошибка при загрузке списка отчетов:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Ошибка при загрузке списка отчетов:', error);
        return [];
    }
}

// Функция для отображения модального окна с историей отчетов
async function showReportsHistory() {
    // Создаем модальное окно, если оно еще не существует
    let historyModal = document.getElementById('reports-history-modal');

    if (!historyModal) {
        // Создаем модальное окно
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

        // Добавляем модальное окно в DOM
        document.body.appendChild(historyModal);
    }

    // Инициализируем модальное окно с использованием Bootstrap
    const modal = new bootstrap.Modal(historyModal);
    modal.show();

    // Загружаем список отчетов
    const reports = await loadReportsList();

    // Отображаем список отчетов
    const reportsListContainer = document.getElementById('reports-list-container');

    if (reports.length === 0) {
        reportsListContainer.innerHTML = `
            <div class="alert alert-info">
                История отчетов пуста. Сохраните хотя бы один отчет.
            </div>
        `;
    } else {
        // Создаем таблицу отчетов
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
                    ${generateReportsTableRows(reports)}
                </tbody>
            </table>
        `;

        // Добавляем обработчик для фильтра поиска
        const filterInput = document.getElementById('reports-filter');
        if (filterInput) {
            filterInput.addEventListener('input', function() {
                filterReports();
            });
        }

        // Добавляем обработчики для кнопок фильтра по типу
        const typeButtons = historyModal.querySelectorAll('.btn-group[aria-label="Фильтры по типу"] button');
        typeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Сначала удаляем класс 'active' со всех кнопок
                typeButtons.forEach(btn => btn.classList.remove('active'));
                // Затем добавляем класс 'active' на нажатую кнопку
                this.classList.add('active');
                // Применяем фильтр
                filterReports();
            });
        });
    }
}
// Функция для генерации строк таблицы отчетов
function generateReportsTableRows(reports) {
    return reports.map(report => {
        // Определяем иконку в зависимости от типа файла
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

        // Определяем дополнительные действия в зависимости от типа файла
        let actions = `<a href="/download_report/${report.filename}" class="btn btn-sm btn-outline-primary me-1" download>Скачать</a>`;

        // Для HTML и SVG файлов добавляем кнопку предпросмотра
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
}

// Функция для фильтрации отчетов по имени и типу
function filterReports() {
    const filterText = document.getElementById('reports-filter').value.toLowerCase();
    const activeTypeButton = document.querySelector('.btn-group[aria-label="Фильтры по типу"] button.active');
    const selectedType = activeTypeButton.getAttribute('data-type');

    const allRows = document.querySelectorAll('#reports-table-body tr.report-item');

    allRows.forEach(row => {
        const filename = row.querySelector('td:first-child span').textContent.toLowerCase();
        const type = row.getAttribute('data-type');

        const matchesFilter = filename.includes(filterText);
        const matchesType = selectedType === 'all' || type === selectedType;

        if (matchesFilter && matchesType) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
// Функция для добавления кнопки просмотра истории
function addHistoryButton() {
    // Проверяем, не существует ли уже кнопка истории
    if (document.getElementById('history-button')) {
        return;
    }

    // Создаем кнопку истории
    const historyButton = document.createElement('button');
    historyButton.id = 'history-button';
    historyButton.className = 'btn btn-outline-secondary';
    historyButton.type = 'button';  // Добавляем тип кнопки, чтобы не отправляла форму
    historyButton.innerHTML = '<i class="bi bi-clock-history"></i> История анализов';
    historyButton.onclick = showReportsHistory;

    // Находим форму для анализа
    const analyzeForm = document.getElementById('analyze-form');

    // Добавляем кнопку в форму
    const submitButton = analyzeForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.parentNode.insertBefore(historyButton, submitButton.nextSibling);
        // Добавляем стиль для отступа
        historyButton.style.marginLeft = '10px';
    }
}

// Добавляем кнопку истории при загрузке документа
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем кнопку истории
    addHistoryButton();
});