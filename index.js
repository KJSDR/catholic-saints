// Catholic Saints Network Visualization
// Main JavaScript file for the interactive network graph

// Global variables
let saintsData = {};
let svg, node, link, label, simulation, tooltip;
let currentFilter = 'all';

// Color mapping for saint types
const colorMap = {
    apostle: '#ff6b6b',
    doctor: '#4ecdc4',
    founder: '#95e1d3',
    martyr: '#ffd93d',
    mystic: '#a8e6cf'
};

// Set up dimensions
const width = 1200;
const height = 700;

// Initialize the visualization
async function init() {
    try {
        // Load the saints data
        const response = await fetch('data/saints.json');
        saintsData = await response.json();
        
        console.log('Loaded', saintsData.nodes.length, 'saints and', saintsData.links.length, 'connections');
        setupVisualization();
        
    } catch (error) {
        console.error('Error loading saints data:', error);
        document.getElementById('network').innerHTML = 
            '<p style="text-align: center; color: #ffd700;">Error loading saints data. Please check that all files are present.</p>';
    }
}

function setupVisualization() {
    // Create SVG
    svg = d3.select("#network")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    // Initialize tooltip
    tooltip = d3.select("#tooltip");

    // Create force simulation with boundary constraints
    simulation = d3.forceSimulation(saintsData.nodes)
        .force("link", d3.forceLink(saintsData.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.size + 5))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1));

    // Create links
    link = svg.append("g")
        .selectAll("line")
        .data(saintsData.links)
        .join("line")
        .attr("class", "link")
        .attr("stroke-width", d => d.type === "mentor" ? 2 : 1);

    // Create nodes
    node = svg.append("g")
        .selectAll("circle")
        .data(saintsData.nodes)
        .join("circle")
        .attr("class", "node")
        .attr("r", d => d.size)
        .attr("fill", d => colorMap[d.type])
        .call(drag(simulation));

    // Create labels
    label = svg.append("g")
        .selectAll("text")
        .data(saintsData.nodes)
        .join("text")
        .attr("class", "node-label")
        .text(d => d.name.replace("St. ", ""))
        .attr("dy", d => d.size + 15);

    // Add node interactions
    node.on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    // Update positions on simulation tick
    simulation.on("tick", updatePositions);
}

function handleMouseOver(event, d) {
    // Highlight node
    d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d => d.size * 1.3);

    // Show tooltip
    tooltip
        .style("opacity", 1)
        .html(`
            <h3>${d.name}</h3>
            <p class="feast-day">Feast Day: ${d.feastDay}</p>
            <p><strong>Patronage:</strong> ${d.patronage}</p>
            <p><strong>Died:</strong> ${d.year} AD</p>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function handleMouseOut(event, d) {
    // Reset node size
    d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d => d.size);

    // Hide tooltip
    tooltip.style("opacity", 0);
}

function updatePositions() {
    // Constrain nodes to stay within boundaries
    saintsData.nodes.forEach(d => {
        d.x = Math.max(d.size, Math.min(width - d.size, d.x));
        d.y = Math.max(d.size, Math.min(height - d.size, d.y));
    });

    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
}

// Drag functionality
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        // Constrain dragging to stay within boundaries
        const radius = event.subject.size;
        event.subject.fx = Math.max(radius, Math.min(width - radius, event.x));
        event.subject.fy = Math.max(radius, Math.min(height - radius, event.y));
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// Filter functions (called by buttons in HTML)
function filterAll() {
    currentFilter = 'all';
    updateButtons();
    node.style("opacity", 1);
    label.style("opacity", 1);
    link.style("opacity", 0.6);
}

function filterByType(type) {
    currentFilter = type;
    updateButtons();
    
    node.style("opacity", d => d.type === type ? 1 : 0.2);
    label.style("opacity", d => d.type === type ? 1 : 0.2);
    link.style("opacity", d => 
        (d.source.type === type || d.target.type === type) ? 0.6 : 0.1
    );
}

function updateButtons() {
    d3.selectAll("button").classed("active", false);
    if (currentFilter === 'all') {
        d3.select("button[onclick='filterAll()']").classed("active", true);
    } else {
        d3.select(`button[onclick="filterByType('${currentFilter}')"]`).classed("active", true);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);