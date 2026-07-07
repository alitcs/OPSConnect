import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import type { ConnectionGraph, ConnectionGraphNode } from '../types';
import { api } from '../api/client';
import Icon from './Icon';

// Colourful but flat (non-glowing) palette so ministries read as distinct clusters.
const MINISTRY_COLORS = [
  '#5b8fd6', // blue
  '#4fae8f', // teal-green
  '#e08a4c', // amber-orange
  '#a173d6', // violet
  '#d96a9a', // rose
  '#d9b23e', // gold
  '#5aa9c9', // sky
  '#c56b5a', // terracotta
];
const DIM_COLOR = '#333844';
const LINK_COLOR = 'rgba(158, 172, 198, 0.28)';
const LINK_HOT = 'rgba(214, 224, 240, 0.9)';

interface GraphNode extends ConnectionGraphNode {
  x?: number;
  y?: number;
  z?: number;
}
interface GraphLink {
  source: number | GraphNode;
  target: number | GraphNode;
  weight: number;
}

function nodeId(end: number | GraphNode): number {
  return typeof end === 'object' ? end.id : end;
}

export default function ConnectionGraph() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  const [graph, setGraph] = useState<ConnectionGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [selected, setSelected] = useState<GraphNode | null>(null);

  useEffect(() => {
    api
      .getConnectionGraph()
      .then(setGraph)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const colorForMinistry = useMemo(() => {
    const map = new Map<string, string>();
    (graph?.ministries ?? []).forEach((m, i) => {
      map.set(m, MINISTRY_COLORS[i % MINISTRY_COLORS.length]);
    });
    return map;
  }, [graph]);

  // Fresh copies — react-force-graph mutates node/link objects in place.
  const data = useMemo(() => {
    if (!graph) return { nodes: [], links: [] };
    return {
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    };
  }, [graph]);

  // Adjacency, used only for click-to-focus highlighting (no per-frame work).
  const neighbors = useMemo(() => {
    const map = new Map<number, Set<number>>();
    if (!graph) return map;
    for (const n of graph.nodes) map.set(n.id, new Set());
    for (const l of graph.links) {
      const a = nodeId(l.source);
      const b = nodeId(l.target);
      map.get(a)?.add(b);
      map.get(b)?.add(a);
    }
    return map;
  }, [graph]);

  const focusId = selected?.id ?? null;
  const activeSet = useMemo(() => {
    if (focusId == null) return null;
    const set = new Set<number>([focusId]);
    neighbors.get(focusId)?.forEach((id) => set.add(id));
    return set;
  }, [focusId, neighbors]);

  // Spread the layout out (longer edges), let it settle, then it freezes — no ongoing
  // physics means smooth orbiting even on modest hardware.
  useEffect(() => {
    if (!graph) return;
    const id = window.setTimeout(() => {
      const fg = fgRef.current;
      if (!fg) return;
      try {
        fg.d3Force('charge')?.strength(-170);
        fg.d3Force('link')?.distance(115).strength(0.08);
        fg.d3ReheatSimulation();
      } catch {
        /* renderer not ready yet */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [graph]);

  const handleNodeClick = (node: GraphNode) => {
    setSelected(node);
    const fg = fgRef.current;
    if (fg && node.x != null && node.y != null && node.z != null) {
      const distance = 140;
      const hyp = Math.hypot(node.x, node.y, node.z) || 1;
      const ratio = 1 + distance / hyp;
      fg.cameraPosition(
        { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
        node,
        900,
      );
    }
  };

  const getNodeColor = (node: GraphNode): string => {
    if (activeSet && !activeSet.has(node.id)) return DIM_COLOR;
    return colorForMinistry.get(node.ministry) ?? '#5b8fd6';
  };

  const getNodeVal = (node: GraphNode): number => {
    const base = 0.6 + Math.sqrt(node.degree) * 0.35;
    return node.id === focusId ? base * 1.6 : base;
  };

  const getLinkColor = (link: GraphLink): string => {
    if (!activeSet) return LINK_COLOR;
    return activeSet.has(nodeId(link.source)) && activeSet.has(nodeId(link.target))
      ? LINK_HOT
      : 'rgba(110, 120, 140, 0.06)';
  };

  const getLinkWidth = (link: GraphLink): number => {
    const hot =
      activeSet &&
      activeSet.has(nodeId(link.source)) &&
      activeSet.has(nodeId(link.target));
    return hot ? 1 : 0.5;
  };

  return (
    <section className="graph-panel">
      <div className="graph-panel__head">
        <div>
          <h2 className="graph-panel__title">Connection network</h2>
          <p className="graph-panel__sub">
            Each node is a person; a link means they’ve messaged. Drag to orbit, scroll to
            zoom, click a node to open their profile.
          </p>
        </div>
        {graph && (
          <div className="graph-panel__stat">
            <span>{graph.nodes.length} people</span>
            <span className="graph-panel__dot" />
            <span>{graph.links.length} connections</span>
          </div>
        )}
      </div>

      <div className="graph-panel__stage" ref={containerRef}>
        {loading && <div className="graph-panel__loading">Building network…</div>}

        {!loading && graph && (
          <ForceGraph3D
            ref={fgRef}
            graphData={data}
            width={size.width}
            height={size.height}
            backgroundColor="#0c0e13"
            showNavInfo={false}
            warmupTicks={30}
            cooldownTicks={90}
            d3AlphaDecay={0.045}
            d3VelocityDecay={0.45}
            nodeRelSize={2.4}
            nodeVal={(node) => getNodeVal(node as GraphNode)}
            nodeColor={(node) => getNodeColor(node as GraphNode)}
            nodeOpacity={0.9}
            nodeResolution={8}
            nodeLabel={(node) => {
              const n = node as GraphNode;
              return `<div class="graph-tip"><strong>${n.name}</strong><span>${n.title}</span><span>${n.team}</span></div>`;
            }}
            linkColor={(link) => getLinkColor(link as GraphLink)}
            linkWidth={(link) => getLinkWidth(link as GraphLink)}
            linkOpacity={0.5}
            onNodeClick={(node) => handleNodeClick(node as GraphNode)}
            onBackgroundClick={() => setSelected(null)}
            enableNodeDrag={false}
          />
        )}

        {graph && (
          <div className="graph-legend">
            {graph.ministries.map((m) => (
              <span className="graph-legend__item" key={m}>
                <span
                  className="graph-legend__swatch"
                  style={{ background: colorForMinistry.get(m) }}
                />
                {m}
              </span>
            ))}
          </div>
        )}

        {selected && (
          <div className="graph-detail" role="dialog" aria-label={`${selected.name} details`}>
            <button
              className="graph-detail__close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <Icon name="x" size={15} />
            </button>
            <span className="graph-detail__ministry">{selected.ministry}</span>
            <h3 className="graph-detail__name">{selected.name}</h3>
            <p className="graph-detail__title">{selected.title}</p>
            <p className="graph-detail__team">{selected.team}</p>

            <div className="graph-detail__meta">
              <span>
                <strong>{selected.degree}</strong> connections
              </span>
              <span className="graph-detail__chip">{selected.status}</span>
              {selected.isCoop && <span className="graph-detail__chip is-coop">Co-op</span>}
            </div>

            <button
              className="graph-detail__cta"
              onClick={() => navigate(`/users/${selected.id}`)}
            >
              View profile
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
