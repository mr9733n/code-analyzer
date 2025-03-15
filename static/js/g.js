// Исправленная функция для загрузки и визуализации графа зависимостей
async function loadDependencyGraph(projectId) {
    try {
        const response = await fetch(`/dependencies/${projectId}`);
        const dependencies = await response.json();

        console.log("Dependencies data:", dependencies);

        // Проверяем, есть ли данные для отображения
        if (Object.keys(dependencies).length === 0) {
            const container = document.getElementById('dependency-graph');
            container.innerHTML = '<div class="alert alert-info">Нет данных о зависимостях для отображения.</div>';
            return;
        }

        // Простая визуализация (можно заменить на более сложную)
        const container = document.getElementById('dependency-graph');
        container.innerHTML = '';

        // Преобразуем данные для D3.js
        const nodes = [];
        const links = [];
        const nodeIds = new Set();

        // Сначала создаем все узлы из модулей проекта
        for (const module in dependencies) {
            nodes.push({ id: module });
            nodeIds.add(module);
        }

        // Затем добавляем зависимости как узлы, если их еще нет
        for (const module in dependencies) {
            dependencies[module].forEach(dep => {
                // Добавляем узел для зависимости, если его еще нет
                if (!nodeIds.has(dep)) {
                    nodes.push({ id: dep });
                    nodeIds.add(dep);
                }

                // Добавляем связь
                links.push({ source: module, target: dep });
            });
        }

        console.log("Graph nodes:", nodes);
        console.log("Graph links:", links);

        // Если нет узлов или связей, показываем сообщение
        if (nodes.length === 0 || links.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Недостаточно данных для построения графа зависимостей.</div>';
            return;
        }

        // Создаем SVG
        const width = 1300;
        const height = 1300;

        const svg = d3.select('#dependency-graph')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Создаем симуляцию с более надежной настройкой
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30)); // Предотвращает перекрытие узлов

        // Создаем связи
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Создаем группы для узлов
        const nodeGroup = svg.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(drag(simulation));

        // Добавляем круги для узлов
        nodeGroup.append('circle')
            .attr('r', d => isProjectModule(d.id, dependencies) ? 8 : 5)
            .attr('fill', d => isProjectModule(d.id, dependencies) ? '#69b3a2' : '#cccccc');

        // Добавляем подписи
        nodeGroup.append('text')
            .text(d => d.id.split('/').pop())
            .attr('font-size', 10)
            .attr('dx', 10)
            .attr('dy', 3);

        // Обновление положения элементов
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodeGroup
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Функция для определения, является ли модуль частью проекта
        function isProjectModule(id, dependencies) {
            return Object.keys(dependencies).includes(id);
        }

        // Функция для перетаскивания узлов
        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }
    } catch (error) {
        console.error('Error loading dependency graph:', error);
        const container = document.getElementById('dependency-graph');
        container.innerHTML = `<div class="alert alert-danger">Ошибка при загрузке графа зависимостей: ${error.message}</div>`;
    }
}