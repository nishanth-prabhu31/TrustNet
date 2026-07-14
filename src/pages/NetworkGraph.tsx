import { useState, useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize, Share2, Info, X } from 'lucide-react';
import { useApp, PRIORITY_COLORS, ADMIN_USER_ID, ADMIN_COLOR } from '../context/AppContext';

const priorityColors: Record<number, string> = PRIORITY_COLORS;

const priorityLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

// Build graph from real data
function buildGraphData(users: any[], trustData: any, getRelationshipScore: (id: string) => number) {
  // Sort non-root users to create a clean geometric spiral (sorted by score)
  const nonRootUsers = users
    .filter(u => u.id !== ADMIN_USER_ID)
    .sort((a, b) => getRelationshipScore(b.id) - getRelationshipScore(a.id));

  const nodes = users.map((u) => {
    const isRoot = u.id === ADMIN_USER_ID;
    const score = getRelationshipScore(u.id);
    
    let fx, fy;
    if (isRoot) {
      fx = 0;
      fy = 0;
    } else {
      const idx = nonRootUsers.findIndex(nru => nru.id === u.id);
      const angle = (idx / nonRootUsers.length) * 2 * Math.PI;
      // High score -> closer to center (min radius ~80). Low score -> further (max radius 350)
      const radius = 350 - (score * 2.7); 
      fx = Math.cos(angle) * radius;
      fy = Math.sin(angle) * radius;
    }

    return {
      id: u.id,
      name: isRoot ? 'ROOT' : u.name.split(' ')[0],
      fullName: u.name,
      priority: isRoot ? 6 : u.priority,
      realPriority: u.priority,
      score,
      color: isRoot ? ADMIN_COLOR : (u.color || priorityColors[u.priority]),
      val: isRoot ? 5 : (u.priority * 0.6 + 0.8),
      fx,
      fy,
    };
  });

  const links: { source: string; target: string; trustScore: number }[] = [];
  for (const [src, edges] of Object.entries(trustData)) {
    for (const [tgt, data] of Object.entries(edges as any)) {
      links.push({ source: src, target: tgt, trustScore: (data as any).score });
    }
  }

  return { nodes, links };
}

interface SelectedNode {
  id: string;
  name: string;
  fullName: string;
  priority: number | null;
  score: number;
  connections: number;
}

export default function NetworkGraph() {
  const { users, trustData, getRelationshipScore } = useApp();
  const gData = buildGraphData(users, trustData, getRelationshipScore);
  const fgRef = useRef<any>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Center the graph after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400, 80);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // D3 forces are bypassed because all nodes have fixed (fx, fy) positions
  // We can just keep the simulation cool so it doesn't waste CPU
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge', null);
      fgRef.current.d3Force('link', null);
    }
  }, [gData.nodes]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.5, 400);
    }
  };

  const handleFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 80);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    let connections = 0;
    const srcEdges = trustData[node.id];
    if (srcEdges) connections += Object.keys(srcEdges).length;
    for (const edges of Object.values(trustData)) {
      if ((edges as any)[node.id]) connections++;
    }

    setSelectedNode({
      id: node.id,
      fullName: node.fullName,
      name: node.name,
      priority: node.realPriority,
      score: node.score,
      connections,
    });

    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 400);
      fgRef.current.zoom(3, 400);
    }
  }, [trustData]);

  const handleNodeHover = useCallback((node: any) => {
    if (!node) {
      setHoveredNode(null);
      setHighlightLinks(new Set());
      return;
    }
    setHoveredNode(node.id);
    const linked = new Set<string>();
    gData.links.forEach((l: any) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      if (src === node.id || tgt === node.id) {
        linked.add(`${src}-${tgt}`);
      }
    });
    setHighlightLinks(linked);
  }, [gData.links]);

  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const color = node.color;
      const r = node.val * 5;
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isRoot = node.id === ADMIN_USER_ID;

      // Glow effect
      if (isHovered || isSelected || isRoot) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + (isRoot ? 8 : 4), 0, 2 * Math.PI, false);
        ctx.fillStyle = color + (isRoot ? '40' : '30');
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isHovered || isSelected || isRoot ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = (isHovered || isSelected || isRoot ? 2 : 1) / globalScale;
      ctx.stroke();

      // Always draw label
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(label).width;
      const pad = fontSize * 0.4;
      const labelY = node.y + r + fontSize * 0.8 + 2 / globalScale;
      ctx.fillStyle = isRoot ? ADMIN_COLOR : 'rgba(15, 23, 42, 0.85)';
      const pillHeight = fontSize + pad;
      const pillWidth = textWidth + pad * 2;
      const pillRadius = pillHeight / 2;
      
      ctx.beginPath();
      ctx.moveTo(node.x - pillWidth / 2 + pillRadius, labelY - pillHeight / 2);
      ctx.lineTo(node.x + pillWidth / 2 - pillRadius, labelY - pillHeight / 2);
      ctx.arc(node.x + pillWidth / 2 - pillRadius, labelY, pillRadius, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(node.x - pillWidth / 2 + pillRadius, labelY + pillHeight / 2);
      ctx.arc(node.x - pillWidth / 2 + pillRadius, labelY, pillRadius, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.fill();

      // Label text
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(label, node.x, labelY);
    },
    [hoveredNode, selectedNode]
  );

  const linkColor = useCallback(
    (link: any) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      const key = `${src}-${tgt}`;
      if (highlightLinks.has(key)) return 'rgba(59, 130, 246, 0.6)';
      return 'rgba(148, 163, 184, 0.15)';
    },
    [highlightLinks]
  );

  const linkWidth = useCallback(
    (link: any) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      const key = `${src}-${tgt}`;
      if (highlightLinks.has(key)) return 2;
      return link.trustScore ? Math.max(0.5, link.trustScore / 40) : 0.5;
    },
    [highlightLinks]
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Centralized Topology</h1>
          <p className="text-slate-400 mt-1">Admin (ROOT) is pinned to the center. Node distance visualizes Relationship Score.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="px-3 py-1.5 glass-card">{users.length} Nodes</span>
          <span className="px-3 py-1.5 glass-card">{gData.links.length} Edges</span>
        </div>
      </div>

      <div className="flex-1 relative glass-panel rounded-xl overflow-hidden" ref={containerRef}>
        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleFit}
            className="w-10 h-10 glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 glass-card p-4">
          <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Priority Legend
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              ROOT — Admin (Nirmith)
            </div>
            {[5, 4, 3, 2, 1].map((p) => (
              <div key={p} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: priorityColors[p] }}></span>
                P{p} — {priorityLabels[p]}
              </div>
            ))}
          </div>
        </div>

        {/* Node Info Panel */}
        {selectedNode && (
          <div className="absolute top-4 left-4 z-10 glass-card p-5 w-72 shadow-2xl shadow-black/30">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-200">Node Details</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-white">{selectedNode.fullName}</p>
                <p className="text-xs text-slate-400">ID: {selectedNode.id}</p>
              </div>
              <div className="flex gap-4">
                {selectedNode.priority !== null && (
                  <div>
                    <p className="text-xs text-slate-400">Priority</p>
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: priorityColors[selectedNode.priority] + '30', color: priorityColors[selectedNode.priority] }}
                    >
                      P{selectedNode.priority}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Rel. Score</p>
                  <p className="text-sm font-bold text-white mt-1">{selectedNode.score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Edges</p>
                  <p className="text-sm font-bold text-white mt-1">{selectedNode.connections}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <ForceGraph2D
          ref={fgRef}
          width={containerDimensions.width}
          height={containerDimensions.height}
          graphData={gData}
          nodeCanvasObject={drawNode}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          linkColor={linkColor}
          linkWidth={linkWidth}
          backgroundColor="transparent"
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
