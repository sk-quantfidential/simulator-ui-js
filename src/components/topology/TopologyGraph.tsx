/**
 * Topology Graph Component
 *
 * D3.js force-directed graph visualization of the trading ecosystem network topology.
 * Displays services as nodes and connections as directed edges with real-time updates.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import * as d3 from 'd3';
import type {
  NodeSummary,
  EdgeSummary,
  NodeStatus,
  EdgeStatus,
} from '@/generated/audit/v1/topology_service_pb';

/**
 * D3 simulation node (extends NodeSummary with simulation properties)
 */
interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  serviceType: string;
  instanceName: string;
  status: NodeStatus;
  labels: { [key: string]: string };
  // D3 force simulation adds: x, y, vx, vy, fx, fy
}

/**
 * D3 simulation edge (extends EdgeSummary with source/target references)
 */
interface D3Edge extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  status: EdgeStatus;
  isCritical: boolean;
}

/**
 * Component props
 */
interface TopologyGraphProps {
  nodes: NodeSummary[];
  edges: EdgeSummary[];
  width?: number;
  height?: number;
  onNodeClick?: (node: NodeSummary) => void;
  onEdgeClick?: (edge: EdgeSummary) => void;
}

/**
 * Get color based on node status
 */
function getNodeColor(status: NodeStatus): string {
  switch (status) {
    case 1: // NODE_STATUS_LIVE
      return '#10b981'; // green-500
    case 2: // NODE_STATUS_DEGRADED
      return '#f59e0b'; // amber-500
    case 3: // NODE_STATUS_DEAD
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get color based on edge status
 */
function getEdgeColor(status: EdgeStatus): string {
  switch (status) {
    case 1: // EDGE_STATUS_ACTIVE
      return '#10b981'; // green-500
    case 2: // EDGE_STATUS_DEGRADED
      return '#f59e0b'; // amber-500
    case 3: // EDGE_STATUS_FAILED
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get edge width based on criticality
 */
function getEdgeWidth(isCritical: boolean): number {
  return isCritical ? 3 : 1.5;
}

/**
 * TopologyGraph Component
 *
 * Renders an interactive force-directed graph using D3.js with:
 * - Color-coded node status (green=live, amber=degraded, red=dead)
 * - Directional edges with arrow markers
 * - Drag-and-drop node positioning
 * - Zoom and pan capabilities
 * - Real-time updates via props changes
 */
export function TopologyGraph({
  nodes,
  edges,
  width = 1200,
  height = 800,
  onNodeClick,
  onEdgeClick,
}: TopologyGraphProps): ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear existing SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Convert proto nodes/edges to D3 format
    const d3Nodes: D3Node[] = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      serviceType: node.serviceType,
      instanceName: node.instanceName,
      status: node.status,
      labels: node.labels,
    }));

    const d3Edges: D3Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      status: edge.status,
      isCritical: edge.isCritical,
    }));

    // Create SVG container with zoom/pan
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; background-color: #0f172a;');

    const g = container.append('g');

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Define arrow markers for directed edges
    svg
      .append('defs')
      .selectAll('marker')
      .data(['active', 'degraded', 'failed', 'unspecified'])
      .join('marker')
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => {
        switch (d) {
          case 'active':
            return '#10b981';
          case 'degraded':
            return '#f59e0b';
          case 'failed':
            return '#ef4444';
          default:
            return '#6b7280';
        }
      });

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Edge>(d3Edges)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create edges (links)
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Edges)
      .join('line')
      .attr('stroke', (d) => getEdgeColor(d.status))
      .attr('stroke-width', (d) => getEdgeWidth(d.isCritical))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', (d) => {
        const statusName =
          d.status === 1 ? 'active' : d.status === 2 ? 'degraded' : d.status === 3 ? 'failed' : 'unspecified';
        return `url(#arrow-${statusName})`;
      })
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        const originalEdge = edges.find((e) => e.id === d.id);
        if (originalEdge && onEdgeClick) {
          onEdgeClick(originalEdge);
        }
      });

    // Create node groups
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any // D3 v7 drag behavior type compatibility
      )
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNode(d.id);
        const originalNode = nodes.find((n) => n.id === d.id);
        if (originalNode && onNodeClick) {
          onNodeClick(originalNode);
        }
      });

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => getNodeColor(d.status))
      .attr('stroke', (d) => (selectedNode === d.id ? '#fff' : '#1e293b'))
      .attr('stroke-width', (d) => (selectedNode === d.id ? 3 : 2));

    // Add labels to nodes
    node
      .append('text')
      .text((d) => d.name)
      .attr('x', 0)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', '500');

    // Add service type labels
    node
      .append('text')
      .text((d) => d.serviceType)
      .attr('x', 0)
      .attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (typeof d.source === 'object' ? d.source.x! : 0))
        .attr('y1', (d) => (typeof d.source === 'object' ? d.source.y! : 0))
        .attr('x2', (d) => (typeof d.target === 'object' ? d.target.x! : 0))
        .attr('y2', (d) => (typeof d.target === 'object' ? d.target.y! : 0));

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, selectedNode, onNodeClick, onEdgeClick]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-slate-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-xs text-slate-300">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-300">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-xs text-slate-300">Dead</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-slate-800 p-3 rounded-lg shadow-lg">
        <p className="text-xs text-slate-400">
          Drag nodes • Scroll to zoom • Click for details
        </p>
      </div>
    </div>
  );
}
