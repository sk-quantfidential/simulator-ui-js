/**
 * gRPC-Web Client Configuration
 *
 * Provides Connect-ES transport for browser-based gRPC communication
 * with the audit-correlator topology service.
 */

import { createConnectTransport } from '@connectrpc/connect-web';
import type { Transport } from '@connectrpc/connect';

/**
 * Base URL for the audit-correlator gRPC service
 *
 * In development: Points to local audit-correlator instance
 * In production: Should point to deployed service endpoint
 */
const AUDIT_CORRELATOR_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIT_CORRELATOR_URL || 'http://localhost:50051';

/**
 * Create gRPC-Web transport for Connect-ES v2
 *
 * Features:
 * - Browser-compatible HTTP/1.1 or HTTP/2
 * - Automatic request/response serialization
 * - CORS-friendly
 * - Request logging via interceptors
 *
 * Note: In Connect-ES v2, timeouts are configured per-request, not on transport.
 */
export const grpcTransport: Transport = createConnectTransport({
  baseUrl: AUDIT_CORRELATOR_BASE_URL,

  // Use JSON encoding for better browser debugging
  // (can switch to binary for production performance)
  useBinaryFormat: false,

  // Interceptors for logging, error handling, and custom headers
  interceptors: [
    // Add custom headers to all requests
    (next) => async (req) => {
      req.header.set('X-Client', 'simulator-ui-js');
      req.header.set('X-Client-Version', '1.0.0');
      return await next(req);
    },

    // Request/response logging interceptor with detailed error info
    (next) => async (req) => {
      console.log(`[gRPC Request] ${req.service.typeName}.${req.method.name}`, {
        url: req.url,
        baseUrl: AUDIT_CORRELATOR_BASE_URL,
        signal: req.signal?.aborted ? 'aborted' : 'active',
        headers: Object.fromEntries(req.header.entries()),
      });

      try {
        const response = await next(req);
        console.log(`[gRPC Response] ${req.service.typeName}.${req.method.name}`, {
          status: 'success',
        });
        return response;
      } catch (error) {
        console.error(`[gRPC Error] ${req.service.typeName}.${req.method.name}`, {
          error,
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: (error as any)?.code,
          errorDetails: (error as any)?.rawMessage,
          url: req.url,
          baseUrl: AUDIT_CORRELATOR_BASE_URL,
        });
        throw error;
      }
    },
  ],
});

/**
 * Configuration for the topology service client
 */
export const topologyServiceConfig = {
  transport: grpcTransport,
  baseUrl: AUDIT_CORRELATOR_BASE_URL,
} as const;
