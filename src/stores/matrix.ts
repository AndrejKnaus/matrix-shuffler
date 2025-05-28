import { defineStore } from 'pinia'

interface MatrixState {
  matrixData: number[][]
  hasData: boolean
}

export const useMatrixStore = defineStore('matrix', {
  state: (): MatrixState => ({
    matrixData: [],
    hasData: false
  }),

  actions: {
    setMatrixData(data: number[][]) {
      this.matrixData = data
      this.hasData = true
    },

    clearMatrixData() {
      this.matrixData = []
      this.hasData = false
    }
  }
})
