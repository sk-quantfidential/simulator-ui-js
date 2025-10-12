/**
 * Custodian Port - Interface for collateral and custodian operations
 * Adapters must implement this interface to provide custodian data
 */

import type { Collateral, CustodianAccount } from '@/domain/types'

export interface CustodianPort {
  /**
   * Get all collateral positions
   */
  getAllCollateral(): Promise<Collateral[]>

  /**
   * Get a specific collateral position
   */
  getCollateral(collateralId: string): Promise<Collateral>

  /**
   * Get custodian account information
   */
  getCustodianAccount(accountId: string): Promise<CustodianAccount>

  /**
   * Get all custodian accounts
   */
  getAllCustodianAccounts(): Promise<CustodianAccount[]>

  /**
   * Subscribe to collateral updates (SSE)
   */
  subscribeToCollateralUpdates(
    onUpdate: (collateral: Collateral) => void
  ): () => void
}
