/**
 * Chaos Port - Interface for chaos testing and scenario execution
 * Adapters must implement this interface to provide chaos testing functionality
 */

import type { ChaosScenario, ChaosTestRun } from '@/domain/types'

export interface ChaosPort {
  /**
   * Get all available chaos scenarios
   */
  getAvailableScenarios(): Promise<ChaosScenario[]>

  /**
   * Get a specific scenario by ID
   */
  getScenario(scenarioId: string): Promise<ChaosScenario>

  /**
   * Start a chaos test run
   */
  startChaosTest(scenarioId: string, parameters?: Record<string, any>): Promise<ChaosTestRun>

  /**
   * Stop a running chaos test
   */
  stopChaosTest(runId: string): Promise<void>

  /**
   * Get status of a test run
   */
  getTestRunStatus(runId: string): Promise<ChaosTestRun>

  /**
   * Get all test runs
   */
  getAllTestRuns(limit?: number): Promise<ChaosTestRun[]>

  /**
   * Subscribe to test run updates (SSE)
   */
  subscribeToTestRunUpdates(
    runId: string,
    onUpdate: (run: ChaosTestRun) => void
  ): () => void
}
