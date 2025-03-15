// Исправленная функция для загрузки списка сложных функций
async function loadComplexFunctions(projectId) {
    try {
        const response = await fetch(`/complex_functions/${projectId}`);
        const functions = await response.json();

        console.log("Complex functions data:", functions);

        const container = document.getElementById('complex-functions');
        container.innerHTML = '';

        // Проверяем, есть ли данные для отображения
        if (!functions || functions.length === 0) {
            container.innerHTML = '<div class="alert alert-info">В проекте не найдено функций с высокой сложностью.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-striped';

        // Заголовок таблицы
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

        // Тело таблицы
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

        // Добавляем информацию о цикломатической сложности
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
        console.error('Error loading complex functions:', error);
        const container = document.getElementById('complex-functions');
        container.innerHTML = `<div class="alert alert-danger">Ошибка при загрузке данных о сложных функциях: ${error.message}</div>`;
    }
}