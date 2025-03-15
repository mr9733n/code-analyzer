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
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="reportsHistoryModalLabel">История анализов</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
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
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Имя файла</th>
                        <th>Дата создания</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(report => `
                        <tr>
                            <td>${report.filename}</td>
                            <td>${report.created}</td>
                            <td>
                                <a href="/download_report/${report.filename}" class="btn btn-sm btn-outline-primary" download>Скачать</a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
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