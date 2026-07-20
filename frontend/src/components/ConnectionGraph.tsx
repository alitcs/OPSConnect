import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import type { ConnectionGraph, ConnectionGraphNode, EdgeMode } from '../types';
import { EDGE_MODES } from '../types';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

// Vivid, well-separated categorical hues so ministries read as distinct clusters at a
// glance. Kept bright and saturated so nodes stay legible against the dark/light scene
// (WebGL Lambert lighting darkens the base colour, so we start brighter than the CSS UI).
const MINISTRY_COLORS = [
  '#4d9fff', // bright blue
  '#2fd9a6', // bright teal-green
  '#ff9f43', // bright orange
  '#b57bff', // bright violet
  '#ff6fae', // bright rose-pink
  '#ffd23f', // bright gold
  '#3fc7e0', // cyan
  '#ff7a5c', // coral
];

// The 3D scene has its own colours (set on the WebGL canvas, not via CSS), so it needs an
// explicit light/dark palette rather than inheriting the page theme variables.
interface GraphPalette {
  bg: string;
  dim: string;
  link: string;
  linkHot: string;
  linkMuted: string;
  edges: Record<string, string>;
}

const DARK_PALETTE: GraphPalette = {
  bg: '#080a0f',
  dim: '#2b3040',
  link: 'rgba(176, 190, 218, 0.45)',
  linkHot: 'rgba(232, 242, 255, 0.98)',
  linkMuted: 'rgba(110, 120, 140, 0.05)',
  edges: {
    coffee: 'rgba(255, 158, 92, 0.75)',
    team: 'rgba(70, 210, 170, 0.65)',
    division: 'rgba(90, 195, 230, 0.65)',
    ministry: 'rgba(90, 160, 245, 0.6)',
    cluster: 'rgba(185, 130, 245, 0.65)',
    project: 'rgba(245, 205, 80, 0.7)',
    skills: 'rgba(245, 120, 175, 0.65)',
    interests: 'rgba(240, 120, 100, 0.65)',
    reporting: 'rgba(224, 234, 250, 0.7)',
    location: 'rgba(90, 225, 200, 0.6)',
    mentorship: 'rgba(120, 170, 255, 0.7)',
    cohort: 'rgba(250, 205, 100, 0.65)',
    bridge: 'rgba(170, 184, 210, 0.3)',
  },
};

const LIGHT_PALETTE: GraphPalette = {
  bg: '#f4f6fb',
  dim: '#b6bdcb',
  link: 'rgba(48, 62, 96, 0.42)',
  linkHot: 'rgba(8, 18, 44, 0.92)',
  linkMuted: 'rgba(120, 130, 150, 0.09)',
  edges: {
    coffee: 'rgba(210, 105, 25, 0.85)',
    team: 'rgba(15, 155, 130, 0.75)',
    division: 'rgba(35, 115, 195, 0.7)',
    ministry: 'rgba(30, 90, 190, 0.7)',
    cluster: 'rgba(120, 65, 200, 0.75)',
    project: 'rgba(175, 130, 10, 0.8)',
    skills: 'rgba(200, 55, 130, 0.75)',
    interests: 'rgba(190, 60, 40, 0.75)',
    reporting: 'rgba(25, 38, 70, 0.75)',
    location: 'rgba(15, 150, 125, 0.7)',
    mentorship: 'rgba(30, 85, 210, 0.8)',
    cohort: 'rgba(185, 130, 20, 0.75)',
    bridge: 'rgba(80, 92, 115, 0.3)',
  },
};

const EDGE_KIND_LABELS: Record<string, string> = {
  coffee: 'Coffee chat',
  team: 'Teammates',
  bridge: 'Cross-team',
  reporting: 'Reporting line',
};

// Touch devices tap imprecisely and have no hover, so tiny nodes are easy to miss when you
// try to select one. Render nodes larger on coarse pointers so a fingertip reliably lands
// on a node (and highlights its connections) instead of hitting empty space.
const COARSE_POINTER =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;
const NODE_REL_SIZE = COARSE_POINTER ? 3.8 : 2.4;


interface GraphNode extends ConnectionGraphNode {
  x?: number;
  y?: number;
  z?: number;
}
interface GraphLink {
  source: number | GraphNode;
  target: number | GraphNode;
  weight: number;
  kind?: string;
}

function nodeId(end: number | GraphNode): number {
  return typeof end === 'object' ? end.id : end;
}

interface ConnectionGraphProps {
  /**
   * External request to focus/highlight a person — by exact id (a person-card tap) when
   * available, otherwise by name (an assistant "find <person>" request).
   */
  focusRequest?: { query: string; id?: number; nonce: number } | null;
  /** The active relationship lens that defines what an edge means. */
  mode?: EdgeMode;
  /** Called when the coordinator picks a different lens from the selector. */
  onModeChange?: (mode: EdgeMode) => void;
}

export default function ConnectionGraph({
  focusRequest = null,
  mode = 'combined',
  onModeChange,
}: ConnectionGraphProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const palette = theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  const [graph, setGraph] = useState<ConnectionGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [selected, setSelected] = useState<GraphNode | null>(null);

  // Fetch (and re-fetch) the network whenever the lens changes. The first load shows the
  // full loading state; subsequent lens switches keep the old graph up and show a subtle
  // "recomputing" hint so the view doesn't blank out.
  useEffect(() => {
    let cancelled = false;
    setSelected(null);
    setRefreshing(true);
    api
      .getConnectionGraph(mode)
      .then((g) => {
        if (!cancelled) setGraph(g);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf1 = 0;
    let raf2 = 0;
    // Only accept real, non-zero measurements — a 0-size read (from a still-settling
    // lazy mount or grid layout) would hand ForceGraph3D a blank canvas that never
    // redraws until the window is resized.
    const update = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) {
        setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      }
    };
    // Measure now, then again over the next two frames to catch late layout so the graph
    // mounts with the correct size on the first try (no manual refresh needed).
    update();
    raf1 = requestAnimationFrame(() => {
      update();
      raf2 = requestAnimationFrame(update);
    });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
    };
    // Re-measure once the data resolves and ForceGraph3D actually mounts.
  }, [loading]);

  const colorForMinistry = useMemo(() => {
    const map = new Map<string, string>();
    (graph?.ministries ?? []).forEach((m, i) => {
      map.set(m, MINISTRY_COLORS[i % MINISTRY_COLORS.length]);
    });
    return map;
  }, [graph]);

  const currentMode = useMemo(
    () => EDGE_MODES.find((m) => m.id === mode) ?? EDGE_MODES[0],
    [mode],
  );

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
  // physics means smooth orbiting even on modest hardware. Runs once the graph has
  // actually mounted (data ready + a real size), so the reheat isn't lost to a null ref.
  const ready = !loading && !!graph && size.width > 0 && size.height > 0;
  useEffect(() => {
    if (!ready) return;
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
  }, [ready]);

  const handleNodeClick = (node: GraphNode) => {
    focusNode(node);
  };

  // Move the camera to a node and select it (drives the highlight + detail card).
  const focusNode = (node: GraphNode) => {
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

  // Respond to an external "find <person>" request by matching a node by name and
  // focusing it. Matching prefers an exact name, then a first/last-name or prefix hit.
  useEffect(() => {
    if (!focusRequest || !graph) return;
    const q = focusRequest.query.trim().toLowerCase();
    const nodes = data.nodes as GraphNode[];
    // A card tap carries the person's id, so match that exactly before falling back to name.
    const byId =
      focusRequest.id != null ? nodes.find((n) => n.id === focusRequest.id) : undefined;
    const match =
      byId ??
      (q
        ? nodes.find((n) => n.name.toLowerCase() === q) ??
          nodes.find((n) => n.name.toLowerCase().split(/\s+/).includes(q)) ??
          nodes.find((n) => n.name.toLowerCase().startsWith(q)) ??
          nodes.find((n) => n.name.toLowerCase().includes(q))
        : undefined);
    if (match) focusNode(match);
    // Re-run only when a new request arrives (nonce changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest?.nonce]);

  // Re-apply node/link colours when the page theme flips (the WebGL scene caches them).
  useEffect(() => {
    const fg = fgRef.current;
    if (fg && typeof fg.refresh === 'function') fg.refresh();
  }, [theme]);

  const getNodeColor = (node: GraphNode): string => {
    if (activeSet && !activeSet.has(node.id)) return palette.dim;
    return colorForMinistry.get(node.ministry) ?? '#5b8fd6';
  };

  const getNodeVal = (node: GraphNode): number => {
    const base = 0.6 + Math.sqrt(node.degree) * 0.35;
    return node.id === focusId ? base * 1.6 : base;
  };

  const getLinkColor = (link: GraphLink): string => {
    if (activeSet) {
      return activeSet.has(nodeId(link.source)) && activeSet.has(nodeId(link.target))
        ? palette.linkHot
        : palette.linkMuted;
    }
    return (link.kind && palette.edges[link.kind]) || palette.link;
  };

  const getLinkWidth = (link: GraphLink): number => {
    const hot =
      activeSet &&
      activeSet.has(nodeId(link.source)) &&
      activeSet.has(nodeId(link.target));
    return hot ? 1.4 : 0.7;
  };

  return (
    <section className="graph-panel">
      <div className="graph-panel__head">
        <div>
          <h2 className="graph-panel__title">Connection network</h2>
          <p className="graph-panel__sub">
            Each node is a person; an edge means {currentMode.description}. Drag to orbit,
            scroll to zoom, click a node to focus it — or ask Copilot to “find someone” and tap
            the person cards it returns to light them up here.
          </p>
        </div>
        <div className="graph-panel__controls">
          <label className="graph-mode">
            <span className="graph-mode__label">Connections by</span>
            <select
              className="graph-mode__select"
              value={mode}
              onChange={(e) => onModeChange?.(e.target.value as EdgeMode)}
              aria-label="Choose what defines a connection"
            >
              {EDGE_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {graph && (
            <div className="graph-panel__stat">
              <span>{graph.connectedCount} connected</span>
              <span className="graph-panel__dot" />
              <span>{graph.edgeCount} links</span>
              <span className="graph-panel__dot" />
              <span>{graph.avgConnections} avg</span>
              {refreshing && <span className="graph-panel__refreshing">· recomputing…</span>}
            </div>
          )}
        </div>
      </div>

      <div className="graph-panel__stage" ref={containerRef}>
        {(loading || size.width === 0 || size.height === 0) && (
          <div className="graph-panel__loading">Building network…</div>
        )}

        {ready && (
          <ForceGraph3D
            ref={fgRef}
            graphData={data}
            width={size.width}
            height={size.height}
            backgroundColor={palette.bg}
            showNavInfo={false}
            warmupTicks={30}
            cooldownTicks={90}
            d3AlphaDecay={0.045}
            d3VelocityDecay={0.45}
            dagMode={mode === 'orgchart' ? 'td' : undefined}
            dagLevelDistance={42}
            onDagError={() => undefined}
            nodeRelSize={NODE_REL_SIZE}
            nodeVal={(node) => getNodeVal(node as GraphNode)}
            nodeColor={(node) => getNodeColor(node as GraphNode)}
            nodeOpacity={0.96}
            nodeResolution={14}
            nodeLabel={(node) => {
              const n = node as GraphNode;
              return `<div class="graph-tip"><strong>${n.name}</strong><span>${n.title}</span><span>${n.team}</span></div>`;
            }}
            linkColor={(link) => getLinkColor(link as GraphLink)}
            linkWidth={(link) => getLinkWidth(link as GraphLink)}
            linkOpacity={0.62}
            linkDirectionalArrowLength={mode === 'orgchart' ? 2.6 : 0}
            linkDirectionalArrowRelPos={1}
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

        {graph && mode === 'combined' && (
          <div className="graph-legend graph-legend--edges">
            {Object.entries(EDGE_KIND_LABELS).map(([kind, label]) => (
              <span className="graph-legend__item" key={kind}>
                <span
                  className="graph-legend__line"
                  style={{ background: palette.edges[kind] }}
                />
                {label}
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
