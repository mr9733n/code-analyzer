// graph.js - Graph visualization and manipulation functions

/**
 * Graph module for dependency visualization
 */
const Graph = {
    // Shared state
    currentGraph: null,
    svg: null,
    simulation: null,

    /**
     * Load and visualize dependency graph
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     */
    async loadDependencyGraph(projectId) {
        try {
            const container = document.getElementById('dependency-graph');

            // Clear the container
            container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            // Fetch dependencies data
            const response = await fetch(`/dependencies/${projectId}`);
            const dependencies = await response.json();

            console.log("Dependencies data:", dependencies);

            // Store for later use (e.g., for exports)
            this.currentDependencies = dependencies;

            // Check if there are data to display
            if (Object.keys(dependencies).length === 0) {
                container.innerHTML = '<div class="alert alert-info">Нет данных о зависимостях для отображения.</div>';
                return;
            }

            // Clear the container again
            container.innerHTML = '';

            // Prepare data for D3
            const { nodes, links } = this._prepareGraphData(dependencies);

            console.log("Graph nodes:", nodes);
            console.log("Graph links:", links);

            // If no nodes or links, show message
            if (nodes.length === 0 || links.length === 0) {
                container.innerHTML = '<div class="alert alert-info">Недостаточно данных для построения графа зависимостей.</div>';
                return;
            }

            // Render the graph
            this._renderGraph(container, nodes, links);

            // Add export buttons after rendering
            this._addExportButtons(container);

        } catch (error) {
            Utils.handleError(error, 'loading dependency graph');
            const container = document.getElementById('dependency-graph');
            container.innerHTML = `<div class="alert alert-danger">Ошибка при загрузке графа зависимостей: ${error.message}</div>`;
        }
    },

    /**
     * Convert dependencies to D3-compatible data format
     * @param {Object} dependencies - Dependencies data from API
     * @returns {Object} Object with nodes and links arrays
     * @private
     */
    _prepareGraphData(dependencies) {
        const nodes = [];
        const links = [];
        const nodeIds = new Set();

        // First create nodes from project modules
        for (const module in dependencies) {
            const moduleName = Utils.getFilenameFromPath(module);
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
                    const depName = Utils.getFilenameFromPath(dep);
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

        return { nodes, links };
    },

    /**
     * Render dependency graph using D3.js
     * @param {HTMLElement} container - Container element
     * @param {Array} nodes - Graph nodes
     * @param {Array} links - Graph links
     * @private
     */
    _renderGraph(container, nodes, links) {
        // Calculate optimal size based on node count
        const nodeCount = nodes.length;
        const width = Math.max(800, Math.min(2000, nodeCount * 50));
        const height = Math.max(600, Math.min(1500, nodeCount * 40));

        // Create container div with scroll
        const graphContainer = document.createElement('div');
        graphContainer.style.width = '100%';
        graphContainer.style.height = '800px';
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

        // Store reference to SVG for export
        this.svg = svg;

        // Add zoom and pan functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                mainGroup.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Create main group for transformation
        const mainGroup = svg.append('g');

        // Add border for visualizing boundaries
        mainGroup.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('stroke', '#eee');

        // Add arrow marker
        const defs = mainGroup.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Create simulation with improved settings
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(60))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        // Store reference to simulation
        this.simulation = simulation;

        // Add grid pattern
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
            .attr('marker-end', 'url(#arrowhead)');

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

        // Create node groups
        const nodeGroup = mainGroup.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(this._dragBehavior(simulation))
            .on('mouseover', function(event, d) {
                // Highlight on hover
                d3.select(this).select('circle').transition()
                    .attr('r', d => d.isProjectModule ? 12 : 8)
                    .attr('stroke-width', 3);

                // Show tooltip
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
                if (d.isProjectModule) {
                    // Project modules: blue gradient based on dependencies
                    const depCount = links.filter(l => l.source.id === d.id).length;
                    return d3.interpolateBlues(0.3 + Math.min(depCount / 10, 0.7));
                } else {
                    // External dependencies: orange
                    return '#f0c297';
                }
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        // Add text background
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

        // Add text labels
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

        // Update positions on each tick
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
                    // Calculate endpoint at edge of target node
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetRadius = d.target.isProjectModule ? 10 : 6;

                    return dist === 0 ? d.target.x : d.source.x + dx * (1 - targetRadius / dist);
                })
                .attr('y2', d => {
                    // Calculate endpoint at edge of target node
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetRadius = d.target.isProjectModule ? 10 : 6;

                    return dist === 0 ? d.target.y : d.source.y + dy * (1 - targetRadius / dist);
                });

            nodeGroup
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Add graph controls
        this._addGraphControls(container, svg, zoom);
    },

    /**
     * Create drag behavior for graph nodes
     * @param {d3.Simulation} simulation - D3 force simulation
     * @returns {d3.Drag} Drag behavior
     * @private
     */
    _dragBehavior(simulation) {
        const dragstarted = (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        };

        const dragged = (event) => {
            // Keep within bounds of parent SVG
            const svgElement = simulation.nodes()[0] && simulation.nodes()[0].x ?
                               d3.select(event.sourceEvent.target).closest('svg').node() :
                               null;

            if (svgElement) {
                const width = svgElement.getBoundingClientRect().width;
                const height = svgElement.getBoundingClientRect().height;

                event.subject.fx = Math.max(30, Math.min(width - 30, event.x));
                event.subject.fy = Math.max(30, Math.min(height - 30, event.y));
            } else {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            // Update tooltip if visible
            const tooltip = d3.select('.graph-tooltip');
            if (tooltip.style('display') !== 'none') {
                tooltip
                    .style('left', (event.sourceEvent.pageX + 10) + 'px')
                    .style('top', (event.sourceEvent.pageY - 20) + 'px');
            }
        };

        const dragended = (event) => {
            if (!event.active) simulation.alphaTarget(0);
            // Keep position fixed after drag (don't release)
            // event.subject.fx = null;
            // event.subject.fy = null;
        };

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    },

    /**
     * Add control panel for graph manipulation
     * @param {HTMLElement} container - Container element
     * @param {d3.Selection} svg - D3 selection of SVG element
     * @param {d3.Zoom} zoom - D3 zoom behavior
     * @private
     */
    _addGraphControls(container, svg, zoom) {
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
        container.insertBefore(controlPanel, container.firstChild);

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

            d3.selectAll('#dependency-graph g > g').selectAll('g')
                .style('opacity', d => {
                    if (!d) return 1;
                    const visible = d.id.toLowerCase().includes(filterTerm) ||
                                  d.displayName.toLowerCase().includes(filterTerm);
                    return visible ? 1 : 0.2;
                });

            d3.selectAll('#dependency-graph g > g').selectAll('line')
                .style('opacity', d => {
                    if (!d) return 0.6;
                    const sourceVisible = d.source.id.toLowerCase().includes(filterTerm) ||
                                        d.source.displayName.toLowerCase().includes(filterTerm);
                    const targetVisible = d.target.id.toLowerCase().includes(filterTerm) ||
                                        d.target.displayName.toLowerCase().includes(filterTerm);
                    return (sourceVisible || targetVisible) ? 0.8 : 0.1;
                });
        });
    },

    /**
     * Add export buttons for graph
     * @param {HTMLElement} container - Container element
     * @private
     */
    _addExportButtons(container) {
        const exportButtons = document.createElement('div');
        exportButtons.className = 'mt-3 mb-3 btn-group';

        // Button for SVG export
        const svgButton = document.createElement('button');
        svgButton.className = 'btn btn-outline-primary btn-sm';
        svgButton.innerHTML = '<i class="bi bi-file-earmark-image"></i> Сохранить как SVG';
        svgButton.onclick = () => this.exportGraphAsSVG(window.currentProjectId);

        // Add buttons to group
        exportButtons.appendChild(svgButton);

        // Add button group before container
        container.parentNode.insertBefore(exportButtons, container);
    },

    /**
     * Export graph as SVG image
     * @param {string} projectId - Project identifier
     * @returns {Promise<void>}
     */
    async exportGraphAsSVG(projectId) {
        try {
            // Get SVG element
            const svgElement = document.querySelector('#dependency-graph svg');
            if (!svgElement) {
                console.error('SVG element not found');
                Utils.showNotification('SVG element not found for export', 'danger');
                return;
            }

            // Clone SVG to avoid modifying original
            const svgClone = svgElement.cloneNode(true);

            // Set export attributes
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svgClone.setAttribute('width', svgElement.getAttribute('width'));
            svgClone.setAttribute('height', svgElement.getAttribute('height'));

            // Add styles to SVG
            const style = document.createElement('style');
            style.textContent = `
                line { stroke: #999; stroke-opacity: 0.6; stroke-width: 2px; }
                circle { stroke: #fff; stroke-width: 1.5px; }
                text { font-size: 10px; font-family: Arial, sans-serif; }
            `;
            svgClone.insertBefore(style, svgClone.firstChild);

            // Create SVG string
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

            // Download SVG
            Utils.triggerDownload(blob, 'dependency_graph.svg');

            // Save to server if projectId provided
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
                        console.log('Graph saved successfully on server:', result.message);
                        Utils.showNotification(result.message);
                    } else {
                        console.error('Error saving graph on server:', result.error);
                        Utils.showNotification(result.error, 'danger');
                    }
                } catch (error) {
                    Utils.handleError(error, 'saving graph to server');
                }
            }
        } catch (error) {
            Utils.handleError(error, 'exporting graph as SVG');
        }
    }
};

// Export the Graph namespace to window
window.Graph = Graph;