/**
 * React Hooks for Topology Data
 *
 * Provides type-safe hooks for fetching and streaming topology data
 * from the audit-correlator service using Connect-ES.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@connectrpc/connect';
import { grpcTransport } from '@/lib/grpc-client';
// Connect-ES v2 unified imports: service and types from single file
import {
  TopologyService,
  type NodeSummary,
  type EdgeSummary,
  type TopologyChange,
  type MetricsUpdate,
  type NodeStatus,
} from '@/generated/audit/v1/topology_service_pb';

/**
 * Topology data state
 */
export interface TopologyData {
  nodes: NodeSummary[];
  edges: EdgeSummary[];
  snapshotId: string;
  snapshotTime: Date | null;
}

/**
 * Hook state for topology structure
 */
interface UseTopologyStructureState {
  data: TopologyData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook state for topology streaming
 */
interface UseTopologyStreamState {
  changes: TopologyChange[];
  connected: boolean;
  error: Error | null;
}

/**
 * Hook state for metrics streaming
 */
interface UseMetricsStreamState {
  updates: MetricsUpdate[];
  connected: boolean;
  error: Error | null;
}

/**
 * Create a topology service client
 */
const createTopologyClient = () =>
  createClient(TopologyService, grpcTransport);

/**
 * Hook: Fetch initial topology structure
 *
 * Usage:
 * ```tsx
 * const { data, loading, error, refetch } = useTopologyStructure({
 *   serviceTypes: ['exchange-simulator', 'risk-monitor'],
 *   statuses: [NodeStatus.NODE_STATUS_LIVE],
 * });
 * ```
 */
export function useTopologyStructure(options?: {
  serviceTypes?: string[];
  statuses?: NodeStatus[];
}): UseTopologyStructureState {
  const [data, setData] = useState<TopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopology = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = createTopologyClient();
      const response = await client.getTopologyStructure({
        serviceTypes: options?.serviceTypes || [],
        statuses: options?.statuses || [],
        requestId: crypto.randomUUID(),
      });

      setData({
        nodes: response.nodes,
        edges: response.edges,
        snapshotId: response.snapshotId,
        snapshotTime: response.snapshotTime
          ? new Date(Number(response.snapshotTime.seconds) * 1000)
          : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch topology'));
      console.error('[useTopologyStructure] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [options?.serviceTypes, options?.statuses]);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  return {
    data,
    loading,
    error,
    refetch: fetchTopology,
  };
}

/**
 * Hook: Stream real-time topology changes
 *
 * Usage:
 * ```tsx
 * const { changes, connected, error } = useTopologyStream({
 *   fromSnapshotId: currentSnapshotId,
 *   serviceTypes: ['exchange-simulator'],
 * });
 * ```
 */
export function useTopologyStream(options?: {
  fromSnapshotId?: string;
  serviceTypes?: string[];
}): UseTopologyStreamState {
  const [changes, setChanges] = useState<TopologyChange[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const streamChanges = async () => {
      try {
        setConnected(true);
        setError(null);

        const client = createTopologyClient();
        const stream = client.streamTopologyChanges(
          {
            fromSnapshotId: options?.fromSnapshotId || '',
            serviceTypes: options?.serviceTypes || [],
          },
          { signal }
        );

        // Process streaming updates
        for await (const change of stream) {
          setChanges((prev) => [...prev, change]);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error('Stream error'));
          console.error('[useTopologyStream] Error:', err);
        }
      } finally {
        setConnected(false);
      }
    };

    streamChanges();

    // Cleanup: abort stream on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [options?.fromSnapshotId, options?.serviceTypes]);

  return {
    changes,
    connected,
    error,
  };
}

/**
 * Hook: Stream real-time metrics updates
 *
 * Usage:
 * ```tsx
 * const { updates, connected, error } = useMetricsStream({
 *   nodeIds: ['risk-monitor', 'exchange-okx'],
 *   updateIntervalSeconds: 2,
 * });
 * ```
 */
export function useMetricsStream(options?: {
  nodeIds?: string[];
  edgeIds?: string[];
  serviceTypes?: string[];
  updateIntervalSeconds?: number;
}): UseMetricsStreamState {
  const [updates, setUpdates] = useState<MetricsUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const streamMetrics = async () => {
      try {
        setConnected(true);
        setError(null);

        const client = createTopologyClient();
        const stream = client.streamMetricsUpdates(
          {
            nodeIds: options?.nodeIds || [],
            edgeIds: options?.edgeIds || [],
            serviceTypes: options?.serviceTypes || [],
            updateInterval: {
              seconds: BigInt(options?.updateIntervalSeconds || 1),
              nanos: 0,
            },
            requestId: crypto.randomUUID(),
          },
          { signal }
        );

        // Process streaming updates
        // Keep only last 100 updates to prevent memory growth
        for await (const update of stream) {
          setUpdates((prev) => [...prev.slice(-99), update]);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error('Stream error'));
          console.error('[useMetricsStream] Error:', err);
        }
      } finally {
        setConnected(false);
      }
    };

    streamMetrics();

    // Cleanup: abort stream on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [
    options?.nodeIds,
    options?.edgeIds,
    options?.serviceTypes,
    options?.updateIntervalSeconds,
  ]);

  return {
    updates,
    connected,
    error,
  };
}
