import { acceptHMRUpdate } from 'pinia'
import { createBatchStore } from './batch-store-factory'

export const useSeedStore = createBatchStore('seed')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeedStore, import.meta.hot))
}
