// app.js - Главный JavaScript для обработки формы и инициализации визуализаций

// Глобальная переменная для хранения текущего project_id
let currentProjectId = null;

// Дожидаемся полной загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded. Initializing...');

    // Находим форму для анализа
    const analyzeForm = document.getElementById('analyze-form');

    if (!analyzeForm) {
        console.error('Форма анализа не найдена в DOM!');
        return;
    }

    // Устанавливаем обработчик отправки формы
    analyzeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Форма отправлена');

        const projectPath = document.getElementById('project-path').value;
        if (!projectPath) {
            alert('Пожалуйста, введите путь к проекту');
            return;
        }

        try {
            // Показываем индикатор загрузки
            const resultsSection = document.getElementById('results');
            resultsSection.classList.remove('d-none');

            // Устанавливаем значения счетчиков на "загрузка..."
            document.getElementById('total-modules').textContent = '...';
            document.getElementById('total-loc').textContent = '...';
            document.getElementById('total-functions').textContent = '...';
            document.getElementById('total-classes').textContent = '...';

            // Очищаем предыдущие результаты
            document.getElementById('complex-functions').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            document.getElementById('dependency-graph').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            // Удаляем существующие кнопки экспорта, если они есть
            const existingExportButtons = document.getElementById('export-buttons');
            if (existingExportButtons) {
                existingExportButtons.remove();
            }

            // Отправляем запрос на сервер
            console.log(`Отправка запроса на анализ: ${projectPath}`);
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `project_path=${encodeURIComponent(projectPath)}`
            });

            const data = await response.json();
            console.log('Получен ответ от сервера:', data);

            if (response.ok) {
                // Сохраняем идентификатор проекта
                currentProjectId = data.project_id;

                // Обновляем сводную информацию
                document.getElementById('total-modules').textContent = data.summary.total_modules;
                document.getElementById('total-loc').textContent = data.summary.total_loc;
                document.getElementById('total-functions').textContent = data.summary.total_functions;
                document.getElementById('total-classes').textContent = data.summary.total_classes;

                // Добавляем кнопки экспорта отчета
                addReportExportButtons(currentProjectId);

                // Загружаем сложные функции
                console.log('Вызов loadComplexFunctions с project_id:', data.project_id);
                await loadComplexFunctions(data.project_id);

                // Загружаем граф зависимостей
                console.log('Вызов loadDependencyGraph с project_id:', data.project_id);
                await loadDependencyGraph(data.project_id);

                console.log('Визуализация завершена');
            } else {
                alert(`Ошибка: ${data.error}`);
                resultsSection.classList.add('d-none');
            }
        } catch (error) {
            console.error('Ошибка при анализе проекта:', error);
            alert(`Произошла ошибка при анализе проекта: ${error.message}`);
            document.getElementById('results').classList.add('d-none');
        }
    });

    console.log('Инициализация завершена. Форма готова к использованию.');
});
