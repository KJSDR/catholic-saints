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
            '<p style="text-align: center; color: #8B4513;">Error loading saints data. Please check that all files are present.</p>';
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

    // Create links with hover functionality
    link = svg.append("g")
        .selectAll("line")
        .data(saintsData.links)
        .join("line")
        .attr("class", "link")
        .attr("stroke-width", d => d.type === "mentor" ? 3 : d.type === "order" ? 2 : 1)
        .style("cursor", "pointer");

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
        .text(d => d.name.replace("St. ", "").replace("Blessed ", ""))
        .attr("dy", d => d.size + 15);

    // Add node interactions
    node.on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    // Add link interactions
    link.on("mouseover", handleLinkMouseOver)
        .on("mouseout", handleLinkMouseOut);

    // Update positions on simulation tick
    simulation.on("tick", updatePositions);
}

function handleMouseOver(event, d) {
    // Highlight node
    d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d => d.size * 1.3);

    // Calculate lifespan
    const lifespan = d.deathYear - d.birthYear;
    const birthDisplay = d.birthYear < 0 ? `${Math.abs(d.birthYear)} BC` : `${d.birthYear} AD`;
    const deathDisplay = d.deathYear < 0 ? `${Math.abs(d.deathYear)} BC` : `${d.deathYear} AD`;

    // Show enhanced tooltip
    tooltip
        .style("opacity", 1)
        .html(`
            <h3>${d.name}</h3>
            <p class="feast-day">Feast Day: ${d.feastDay}</p>
            <p><strong>Life:</strong> ${birthDisplay} - ${deathDisplay} (${lifespan} years)</p>
            <p><strong>Location:</strong> ${d.location}</p>
            <p><strong>Patronage:</strong> ${d.patronage}</p>
            <p><em>${d.description}</em></p>
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

function handleLinkMouseOver(event, d) {
    // Highlight the link
    d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", d => (d.type === "mentor" ? 5 : d.type === "order" ? 4 : 3))
        .style("stroke", "#8B4513");

    // Get relationship description
    const relationshipDescriptions = {
        "mentor": "Mentor-Student relationship",
        "contemporary": "Lived at the same time",
        "influence": "Theological/spiritual influence", 
        "order": "Same religious order",
        "friend": "Personal friendship",
        "colleague": "Worked together"
    };

    const description = relationshipDescriptions[d.type] || "Connected";
    
    // Show tooltip
    tooltip
        .style("opacity", 1)
        .html(`
            <h3>${d.source.name} ↔ ${d.target.name}</h3>
            <p><strong>Relationship:</strong> ${description}</p>
            <p><em>${getRelationshipDetail(d)}</em></p>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function handleLinkMouseOut(event, d) {
    // Reset link appearance
    d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", d => d.type === "mentor" ? 3 : d.type === "order" ? 2 : 1)
        .style("stroke", "rgba(139, 69, 19, 0.4)");

    // Hide tooltip
    tooltip.style("opacity", 0);
}

function getRelationshipDetail(d) {
    // Add specific details about relationships
    const details = {
        "peter-paul": "Both apostles who worked together in the early Church",
        "peter-john": "Fellow apostles and close companions of Jesus",
        "paul-john": "Collaborated in spreading Christianity",
        "peter-stephen": "Peter likely ordained Stephen as first deacon",
        "augustine-benedict": "Augustine's writings influenced Benedict's Rule",
        "augustine-aquinas": "Aquinas built upon Augustine's theological foundation",
        "paul-augustine": "Augustine was deeply influenced by Paul's letters",
        "benedict-francis": "Francis was inspired by monastic tradition",
        "francis-dominic": "Contemporary founders with different approaches",
        "francis-anthony": "Anthony joined the Franciscan order under Francis",
        "francis-clare": "Francis guided Clare in founding the Poor Clares",
        "dominic-aquinas": "Aquinas was a Dominican friar",
        "ignatius-teresa-avila": "Counter-Reformation reformers and mystics",
        "teresa-avila-john-cross": "Teresa guided John in mystical theology",
        "augustine-jerome": "Corresponded frequently about theological matters",
        "aquinas-catherine-siena": "Catherine was influenced by Dominican theology",
        "teresa-avila-therese": "Thérèse was inspired by Teresa's writings",
        "therese-padre-pio": "Both promoted devotion to the Sacred Heart",
        "francis-padre-pio": "Padre Pio was a Franciscan friar",
        "lawrence-cecilia": "Both Roman martyrs of the 3rd century",
        "patrick-benedict": "Patrick's missionary work influenced monasticism",
        "mary-john": "Mary entrusted to John's care at the crucifixion",
        "mary-joseph": "Holy Family - married and raised Jesus together",
        "mary-john-baptist": "John the Baptist announced Jesus' coming to Mary",
        "mary-mary-magdalene": "Both witnessed Jesus' crucifixion and resurrection",
        "joseph-john-baptist": "Both central figures in Jesus' early life",
        "john-baptist-peter": "John baptized Jesus, Peter became first Pope",
        "john-baptist-john": "John the Baptist was John the Apostle's namesake",
        "mary-magdalene-peter": "First witnesses to the resurrection",
        "mary-magdalene-paul": "Both experienced dramatic conversions",
        "monica-augustine": "Monica prayed for Augustine's conversion for years",
        "martin-tours-augustine": "Both bishops and theologians of the 4th century",
        "martin-tours-benedict": "Martin's monasticism influenced Benedict",
        "basil-augustine": "Both Church Fathers and bishops",
        "basil-jerome": "Both translated and preserved Scripture",
        "elizabeth-hungary-francis": "Both devoted to serving the poor",
        "elizabeth-hungary-dominic": "Elizabeth inspired by Dominican spirituality",
        "joan-arc-catherine-siena": "Both received visions and influenced politics",
        "mary-teresa-avila": "Teresa had deep Marian devotion",
        "mary-therese": "Thérèse's 'Little Way' centered on Mary",
        "mother-teresa-john-paul-ii": "John Paul II supported Mother Teresa's work",
        "maximilian-kolbe-john-paul-ii": "Both Polish saints, John Paul beatified Kolbe",
        "maximilian-kolbe-francis": "Kolbe was a Franciscan friar and martyr",
        "john-chrysostom-basil": "Cappadocian Fathers and theologians",
        "gregory-nazianzus-basil": "Cappadocian Fathers, defended Trinity",
        "john-chrysostom-gregory-nazianzus": "Both great preachers and theologians",
        "john-xxiii-john-paul-ii": "John XXIII's reforms influenced John Paul II",
        "faustina-john-paul-ii": "John Paul II canonized Faustina, promoted Divine Mercy",
        "faustina-therese": "Both promoted trust in God's mercy",
        "rose-lima-teresa-avila": "Both mystics influenced by Carmelite spirituality",
        "rose-lima-dominic": "Rose was a Dominican tertiary",
        "mother-teresa-therese": "Teresa inspired by Thérèse's 'Little Way'"
    };
    
    const key1 = `${d.source.id}-${d.target.id}`;
    const key2 = `${d.target.id}-${d.source.id}`;
    
    return details[key1] || details[key2] || "These saints shared important connections in Church history";
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
    link.style("opacity", 0.7);
}

function filterByType(type) {
    currentFilter = type;
    updateButtons();
    
    node.style("opacity", d => d.type === type ? 1 : 0.2);
    label.style("opacity", d => d.type === type ? 1 : 0.2);
    link.style("opacity", d => 
        (d.source.type === type || d.target.type === type) ? 0.7 : 0.1
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