/**
 * Network Topology Visualization Page
 *
 * Real-time visualization of the trading ecosystem network topology
 * showing services, their status, and interconnections.
 */

'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';
import { TopologyGraph } from '@/components/topology/TopologyGraph';
import { useTopologyStructure, useTopologyStream } from '@/hooks/useTopology';
import type { NodeSummary, EdgeSummary } from '@/generated/audit/v1/topology_service_pb';

/**
 * Node details panel component
 */
function NodeDetailsPanel({ node }: { node: NodeSummary }): ReactElement {
  const statusText =
    node.status === 1 ? 'Live' :
    node.status === 2 ? 'Degraded' :
    node.status === 3 ? 'Dead' : 'Unknown';

  const statusColor =
    node.status === 1 ? 'text-green-400' :
    node.status === 2 ? 'text-amber-400' :
    node.status === 3 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-slate-200 mb-4">{node.name}</h2>

      <div className="space-y-3">
        <div>
          <span className="text-sm text-slate-400">Status:</span>
          <span className={`ml-2 text-sm font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div>
          <span className="text-sm text-slate-400">Service Type:</span>
          <span className="ml-2 text-sm text-slate-200">{node.serviceType}</span>
        </div>

        <div>
          <span className="text-sm text-slate-400">Instance:</span>
          <span className="ml-2 text-sm text-slate-200">{node.instanceName}</span>
        </div>

        {Object.keys(node.labels).length > 0 && (
          <div>
            <span className="text-sm text-slate-400">Labels:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(node.labels).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Edge details panel component
 */
function EdgeDetailsPanel({ edge }: { edge: EdgeSummary }): ReactElement {
  const statusText =
    edge.status === 1 ? 'Active' :
    edge.status === 2 ? 'Degraded' :
    edge.status === 3 ? 'Failed' : 'Unknown';

  const statusColor =
    edge.status === 1 ? 'text-green-400' :
    edge.status === 2 ? 'text-amber-400' :
    edge.status === 3 ? 'text-red-400' : 'text-gray-400';

  const typeText =
    edge.type === 1 ? 'gRPC' :
    edge.type === 2 ? 'HTTP' :
    edge.type === 3 ? 'Data Flow' : 'Unknown';

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-slate-200 mb-4">Connection</h2>

      <div className="space-y-3">
        <div>
          <span className="text-sm text-slate-400">From:</span>
          <span className="ml-2 text-sm text-slate-200">{edge.sourceId}</span>
        </div>

        <div>
          <span className="text-sm text-slate-400">To:</span>
          <span className="ml-2 text-sm text-slate-200">{edge.targetId}</span>
        </div>

        <div>
          <span className="text-sm text-slate-400">Status:</span>
          <span className={`ml-2 text-sm font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div>
          <span className="text-sm text-slate-400">Type:</span>
          <span className="ml-2 text-sm text-slate-200">{typeText}</span>
        </div>

        {edge.isCritical && (
          <div className="mt-2 px-3 py-2 bg-amber-900/30 border border-amber-600 rounded">
            <span className="text-sm text-amber-300 font-semibold">⚠️ Critical Connection</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Topology Page Component
 */
export default function TopologyPage(): ReactElement {
  const [selectedNode, setSelectedNode] = useState<NodeSummary | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSummary | null>(null);

  // Fetch initial topology structure
  const { data, loading, error, refetch } = useTopologyStructure();

  // Stream real-time topology changes
  const { changes, connected } = useTopologyStream({
    fromSnapshotId: data?.snapshotId,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading topology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Topology</h2>
          <p className="text-slate-300 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No topology data available</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Network Topology</h1>
          <p className="text-slate-400 mt-1">
            Trading Ecosystem Service Map • {data.nodes.length} nodes • {data.edges.length} connections
          </p>
        </div>

        <div className="flex items-center gap-4">
          {connected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-600 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Live Updates</span>
            </div>
          )}

          {changes.length > 0 && (
            <div className="px-3 py-1 bg-blue-900/30 border border-blue-600 rounded">
              <span className="text-sm text-blue-400">{changes.length} changes</span>
            </div>
          )}

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Topology Graph */}
        <div className="col-span-9">
          <TopologyGraph
            nodes={data.nodes}
            edges={data.edges}
            width={1200}
            height={800}
            onNodeClick={(node) => {
              setSelectedNode(node);
              setSelectedEdge(null);
            }}
            onEdgeClick={(edge) => {
              setSelectedEdge(edge);
              setSelectedNode(null);
            }}
          />
        </div>

        {/* Details Panel */}
        <div className="col-span-3">
          {selectedNode && <NodeDetailsPanel node={selectedNode} />}
          {selectedEdge && <EdgeDetailsPanel edge={selectedEdge} />}
          {!selectedNode && !selectedEdge && (
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-slate-200 mb-4">Details</h2>
              <p className="text-sm text-slate-400">
                Click on a node or connection to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Info */}
      {data.snapshotTime && (
        <div className="mt-6 text-center text-xs text-slate-500">
          Snapshot ID: {data.snapshotId} • Last updated:{' '}
          {data.snapshotTime.toLocaleString()}
        </div>
      )}
    </div>
  );
}
