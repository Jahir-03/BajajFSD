const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/bfhl', (req, res) => {
    const data = req.body.data;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ error: "Input must be non-empty array" });

    let invalid = [], duplicate = [], seen = new Set(), edges = [], parent = {}, graph = {};

    for (let i of data) {
        if (typeof i !== 'string') { invalid.push(String(i)); continue; }
        let s = i.trim(), m = s.match(/^([A-Z])->([A-Z])$/);
        if (!m || m[1] === m[2]) { invalid.push(i); continue; }
        
        if (seen.has(s)) {
            if (!duplicate.includes(s)) duplicate.push(s);
            continue;
        }
        seen.add(s);
        let u = m[1], v = m[2];
        if (!parent[v]) {
            parent[v] = u;
            edges.push([u, v]);
        }
    }

    for (let [u, v] of edges) {
        if (!graph[u]) graph[u] = [];
        graph[u].push(v);
    }

    let nodes = new Set();
    edges.forEach(([u, v]) => { nodes.add(u); nodes.add(v); });

    let visited = new Set(), comps = [];

    function dfs(n, set) {
        visited.add(n); set.push(n);
        let neigh = (graph[n] || []).concat(Object.keys(graph).filter(x => (graph[x] || []).includes(n)));
        for (let x of neigh) if (!visited.has(x)) dfs(x, set);
    }

    for (let n of nodes) {
        if (!visited.has(n)) {
            let temp = []; dfs(n, temp); comps.push(temp);
        }
    }

    let hierarchies = [], total_trees = 0, total_cycles = 0, maxDepth = 0, largest_root = null;

    function build(r) {
        let obj = {};
        (graph[r] || []).forEach(c => { obj[c] = build(c); });
        return obj;
    }

    function depth(r) {
        if (!graph[r]) return 1;
        return 1 + Math.max(...graph[r].map(depth));
    }

    for (let comp of comps) {
        let roots = comp.filter(n => !parent[n]);
        if (roots.length === 1) {
            let r = roots[0], d = depth(r);
            hierarchies.push({ root: r, tree: { [r]: build(r) }, depth: d });
            total_trees++;
            if (d > maxDepth || (d === maxDepth && (largest_root === null || r < largest_root))) { maxDepth = d; largest_root = r; }
        } else if (roots.length === 0) {
            let r = comp.sort()[0];
            hierarchies.push({ root: r, tree: {}, has_cycle: true });
            total_cycles++;
        }
    }

    res.json({
        user_id: "jahir_03122005", email_id: "ja4348@srmist.edu.in", college_roll_number: "RA2311032010060",
        hierarchies, invalid_entries: invalid, duplicate_edges: duplicate,
        summary: { total_trees, total_cycles, largest_tree_root: largest_root }
    });
});

app.listen(3000, () => console.log("running..."));