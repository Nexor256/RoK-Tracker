import { acceptHMRUpdate } from 'pinia'
import { createBatchStore } from './batch-store-factory'

export const useHonorStore = createBatchStore('honor')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHonorStore, import.meta.hot))
}
