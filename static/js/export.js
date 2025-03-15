// export.js - Функции для экспорта графа зависимостей

// Функция для экспорта графа как SVG и сохранения на сервере
async function exportGraphAsSVG(projectId = currentProjectId) {
    // Получаем SVG элемент
    const svgElement = document.querySelector('#dependency-graph svg');
    if (!svgElement) {
        console.error('SVG элемент не найден');
        return;
    }

    // Создаем клон SVG элемента, чтобы не изменять оригинал
    const svgClone = svgElement.cloneNode(true);

    // Устанавливаем атрибуты для экспорта
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('width', svgElement.getAttribute('width'));
    svgClone.setAttribute('height', svgElement.getAttribute('height'));

    // Добавляем стили в SVG
    const style = document.createElement('style');
    style.textContent = `
        line { stroke: #999; stroke-opacity: 0.6; stroke-width: 2px; }
        circle { stroke: #fff; stroke-width: 1.5px; }
        text { font-size: 10px; font-family: Arial, sans-serif; }
    `;
    svgClone.insertBefore(style, svgClone.firstChild);

    // Создаем Blob из SVG
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    // Создаем URL для скачивания
    const url = URL.createObjectURL(blob);

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dependency_graph.svg';

    // Добавляем ссылку в DOM и эмулируем клик
    document.body.appendChild(link);
    link.click();

    // Удаляем ссылку из DOM
    document.body.removeChild(link);

    // Освобождаем URL
    URL.revokeObjectURL(url);

    // Если указан projectId, сохраняем также на сервере
    if (projectId) {
        try {
            const response = await fetch(`/save_graph/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ svg_data: svgData })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Граф успешно сохранен на сервере:', result.message);

                // Показываем уведомление пользователю
                const notification = document.createElement('div');
                notification.className = 'alert alert-success alert-dismissible fade show mt-3';
                notification.innerHTML = `
                    ${result.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

                // Добавляем уведомление после кнопок экспорта
                const exportButtons = document.querySelector('#dependency-graph').previousSibling;
                if (exportButtons) {
                    exportButtons.parentNode.insertBefore(notification, exportButtons.nextSibling);
                }

                // Автоматически скрываем уведомление через 5 секунд
                setTimeout(() => {
                    notification.remove();
                }, 5000);
            } else {
                console.error('Ошибка при сохранении графа на сервере:', result.error);
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса на сохранение графа:', error);
        }
    }
}
//Функция кнопок экспорта
function addExportButtons(container) {
    const exportButtons = document.createElement('div');
    exportButtons.className = 'mt-3 mb-3 btn-group';

    // Кнопка для экспорта в SVG
    const svgButton = document.createElement('button');
    svgButton.className = 'btn btn-outline-primary btn-sm';
    svgButton.textContent = 'Сохранить как SVG';
    svgButton.onclick = () => exportGraphAsSVG(currentProjectId);

    // Добавляем кнопки в группу
    exportButtons.appendChild(svgButton);

    // Добавляем группу кнопок перед контейнером графа
    container.parentNode.insertBefore(exportButtons, container);
}
