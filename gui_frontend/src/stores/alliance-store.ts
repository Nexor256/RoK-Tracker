import { acceptHMRUpdate } from 'pinia'
import { createBatchStore } from './batch-store-factory'

export const useAllianceStore = createBatchStore('alliance')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAllianceStore, import.meta.hot))
}
