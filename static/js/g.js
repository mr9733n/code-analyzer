// Функция для экспорта графа как SVG
function exportGraphAsSVG() {
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
}
// Функция для загрузки и визуализации графа зависимостей
// Improved version of loadDependencyGraph function
async function loadDependencyGraph(projectId) {
    try {
        const response = await fetch(`/dependencies/${projectId}`);
        const dependencies = await response.json();

        console.log("Dependencies data:", dependencies);

        // Check if there are data to display
        if (Object.keys(dependencies).length === 0) {
            const container = document.getElementById('dependency-graph');
            container.innerHTML = '<div class="alert alert-info">Нет данных о зависимостях для отображения.</div>';
            return;
        }

        // Clear the container
        const container = document.getElementById('dependency-graph');
        container.innerHTML = '';

        // Convert data for D3.js
        const nodes = [];
        const links = [];
        const nodeIds = new Set();

        // First create all nodes from project modules
        for (const module in dependencies) {
            // Extract module name for display
            const moduleName = module.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '');
            nodes.push({
                id: module,
                displayName: moduleName,
                isProjectModule: true
            });
            nodeIds.add(module);
        }

        // Then add dependencies as nodes if they don't exist yet
        for (const module in dependencies) {
            dependencies[module].forEach(dep => {
                // Add node for dependency if it doesn't exist yet
                if (!nodeIds.has(dep)) {
                    const depName = dep.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '');
                    nodes.push({
                        id: dep,
                        displayName: depName,
                        isProjectModule: false
                    });
                    nodeIds.add(dep);
                }

                // Add connection
                links.push({ source: module, target: dep });
            });
        }

        console.log("Graph nodes:", nodes);
        console.log("Graph links:", links);

        // If no nodes or links, show message
        if (nodes.length === 0 || links.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Недостаточно данных для построения графа зависимостей.</div>';
            return;
        }

        // Calculate optimal size based on node count
        const nodeCount = nodes.length;
        let width = Math.max(800, Math.min(2000, nodeCount * 50)); // Scales with node count but has limits
        let height = Math.max(600, Math.min(1500, nodeCount * 40));

        // Create container div with scroll
        const graphContainer = document.createElement('div');
        graphContainer.style.width = '100%';
        graphContainer.style.height = '800px'; // Fixed height for container
        graphContainer.style.overflow = 'auto';
        graphContainer.style.border = '1px solid #ddd';
        graphContainer.style.borderRadius = '4px';
        container.appendChild(graphContainer);

        // Create SVG with responsive viewBox
        const svg = d3.select(graphContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom and pan behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4]) // Allow zoom from 0.1x to 4x
            .on('zoom', (event) => {
                mainGroup.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Create a main group that will be transformed
        const mainGroup = svg.append('g');

        // Add a border rect for debugging viewBox
        mainGroup.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('stroke', '#eee');

        // Create a defs element for marker (arrow)
        const defs = mainGroup.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20) // Position the arrow away from node
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Create simulation with improved settings
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150)) // More distance between nodes
            .force('charge', d3.forceManyBody().strength(-500)) // Stronger repulsion
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(60)) // Prevent node overlap
            .force('x', d3.forceX(width / 2).strength(0.1)) // Keep nodes within boundaries
            .force('y', d3.forceY(height / 2).strength(0.1));

        // Add a subtle grid pattern for reference
        const gridSize = 50;
        const grid = mainGroup.append('g')
            .attr('class', 'grid')
            .selectAll('line')
            .data(d3.range(0, width + gridSize, gridSize).concat(d3.range(0, height + gridSize, gridSize)))
            .enter().append('line')
            .attr('x1', d => d < width ? d : 0)
            .attr('y1', d => d < width ? 0 : d - width)
            .attr('x2', d => d < width ? d : width)
            .attr('y2', d => d < width ? height : d - width)
            .attr('stroke', '#f5f5f5')
            .attr('stroke-width', 1);

        // Create links
        const link = mainGroup.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)'); // Add arrows to links

        // Create node groups
        const nodeGroup = mainGroup.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(drag(simulation))
            .on('mouseover', function(event, d) {
                // Highlight the node and its connections
                d3.select(this).select('circle').transition()
                    .attr('r', d => d.isProjectModule ? 12 : 8)
                    .attr('stroke-width', 3);

                // Show the full ID/path as tooltip
                tooltip.style('display', 'block')
                    .html(`<strong>${d.id}</strong>`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', function(event, d) {
                // Return to normal
                d3.select(this).select('circle').transition()
                    .attr('r', d => d.isProjectModule ? 10 : 6)
                    .attr('stroke-width', 1.5);

                tooltip.style('display', 'none');
            });

        // Add node circles
        nodeGroup.append('circle')
            .attr('r', d => d.isProjectModule ? 10 : 6)
            .attr('fill', d => {
                // Use color scheme to make it more informative
                if (d.isProjectModule) {
                    // Project modules: green to blue gradient based on dependency count
                    const depCount = links.filter(l => l.source.id === d.id).length;
                    return d3.interpolateBlues(0.3 + Math.min(depCount / 10, 0.7));
                } else {
                    // External dependencies: grey to orange
                    return '#f0c297';
                }
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        // Add text labels inside a background rectangle for better readability
        // First add background
        nodeGroup.append('rect')
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('x', 12)
            .attr('y', -9)
            .attr('fill', 'white')
            .attr('opacity', 0.8)
            .attr('stroke', '#eee')
            .attr('stroke-width', 0.5)
            .attr('width', d => Math.min(d.displayName.length * 6.5 + 6, 150))
            .attr('height', 18);

        // Then add text label
        nodeGroup.append('text')
            .text(d => {
                if (d.displayName.length > 20) {
                    return d.displayName.substring(0, 18) + '...';
                }
                return d.displayName;
            })
            .attr('font-size', 12)
            .attr('font-family', 'Arial, sans-serif')
            .attr('x', 15)
            .attr('y', 3);

        // Create tooltip div
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('display', 'none')
            .style('position', 'absolute')
            .style('padding', '8px')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000');

        // Update element positions
        simulation.on('tick', () => {
            // Keep nodes within bounds
            nodes.forEach(d => {
                d.x = Math.max(30, Math.min(width - 30, d.x));
                d.y = Math.max(30, Math.min(height - 30, d.y));
            });

            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => {
                    // Adjust end point to stop at node edge
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetRadius = d.target.isProjectModule ? 10 : 6;

                    return dist === 0 ? d.target.x : d.source.x + dx * (1 - targetRadius / dist);
                })
                .attr('y2', d => {
                    // Adjust end point to stop at node edge
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetRadius = d.target.isProjectModule ? 10 : 6;

                    return dist === 0 ? d.target.y : d.source.y + dy * (1 - targetRadius / dist);
                });

            nodeGroup
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Add controls for the graph
        const controlPanel = document.createElement('div');
        controlPanel.className = 'graph-controls mt-3 mb-3';
        controlPanel.innerHTML = `
            <div class="mb-2">
                <button id="zoom-in" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-zoom-in"></i> Увеличить
                </button>
                <button id="zoom-out" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-zoom-out"></i> Уменьшить
                </button>
                <button id="reset-view" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-arrows-fullscreen"></i> Сбросить
                </button>
            </div>
            <div class="form-inline">
                <div class="form-group mr-2">
                    <label for="filter-input" class="mr-2">Фильтр:</label>
                    <input type="text" id="filter-input" class="form-control form-control-sm" placeholder="Название модуля...">
                </div>
            </div>
        `;
        container.insertBefore(controlPanel, graphContainer);

        // Add control functionality
        document.getElementById('zoom-in').addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 1.3);
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 0.7);
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            svg.transition().call(zoom.transform, d3.zoomIdentity);
        });

        // Add filtering functionality
        document.getElementById('filter-input').addEventListener('input', (e) => {
            const filterTerm = e.target.value.toLowerCase();

            nodeGroup.style('opacity', d => {
                const visible = d.id.toLowerCase().includes(filterTerm) ||
                               d.displayName.toLowerCase().includes(filterTerm);
                return visible ? 1 : 0.2;
            });

            link.style('opacity', d => {
                const sourceVisible = d.source.id.toLowerCase().includes(filterTerm) ||
                                     d.source.displayName.toLowerCase().includes(filterTerm);
                const targetVisible = d.target.id.toLowerCase().includes(filterTerm) ||
                                     d.target.displayName.toLowerCase().includes(filterTerm);
                return (sourceVisible || targetVisible) ? 0.8 : 0.1;
            });
        });

        // Function for node dragging
        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                // Keep within bounds
                event.subject.fx = Math.max(30, Math.min(width - 30, event.x));
                event.subject.fy = Math.max(30, Math.min(height - 30, event.y));

                // Update tooltip position
                tooltip
                    .style('left', (event.sourceEvent.pageX + 10) + 'px')
                    .style('top', (event.sourceEvent.pageY - 20) + 'px');
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                // Don't release node position after drag - keep it fixed
                // event.subject.fx = null;
                // event.subject.fy = null;
            }

            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }

        // Add export buttons
        addExportButtons(container);

    } catch (error) {
        console.error('Error loading dependency graph:', error);
        const container = document.getElementById('dependency-graph');
        container.innerHTML = `<div class="alert alert-danger">Ошибка при загрузке графа зависимостей: ${error.message}</div>`;
    }
}