import { defineStore } from 'pinia'

export interface MatrixCell {
  row: string
  column: string
  initialValue: number
  normalizedValue?: number
}

export interface MatrixData {
  rowNames: string[]
  columnNames: string[]
  values: MatrixCell[][]
}

export interface NormalizationState {
  type: 'none' | 'row' | 'column'
  min: number
  max: number
}

export const useDatasetStore = defineStore('dataset', {
  state: () => ({
    rowNames: [] as string[],
    columnNames: [] as string[],
    initialData: [] as number[][], // Raw parsed data
    normalizationType: 'none' as 'none' | 'row' | 'column', // Normalization type
    normalizationRanges: {} as Record<string, 'zero-max' | 'min-max'>, // key: row/col name
    normalizedData: [] as number[][], // Normalized data
    rowOrder: [] as number[], // Current row order (saved as index of rowNames)
    columnOrder: [] as number[], // Current column order (saved as index of columnNames)
    hasData: Boolean(false), // Flag to check if data is set
  }),
  actions: {
    setParsedData(rowNames: string[], columnNames: string[], data: number[][]) {
      this.rowNames = rowNames
      this.columnNames = columnNames
      this.initialData = data
      this.normalizationType = 'none' // Reset normalization type
      this.normalizationRanges = {} // Reset normalization ranges
      this.normalizedData = [] // Reset normalized data
      this.rowOrder = rowNames.map((name) => rowNames.indexOf(name))
      this.columnOrder = columnNames.map((name) => columnNames.indexOf(name))
      this.hasData = true
      console.log(`Data set with ${rowNames.length} rows and ${columnNames.length} columns.`)
    },
    setNormalizationType(type: 'none' | 'row' | 'column') {
      this.normalizationType = type
      this.normalizationRanges = {} // Reset ranges when changing type
    },
    setNormalizationRange(key: string, range: 'zero-max' | 'min-max') {
      this.normalizationRanges[key] = range
    },
    normalizeData() {
      if (this.normalizationType === 'none') {
        this.normalizedData = []
        return
      }

      const data = this.initialData
      const numRows = data.length
      const numCols = data[0]?.length ?? 0
      const normalized: number[][] = []

      if (this.normalizationType === 'row') {
        for (let i = 0; i < numRows; i++) {
          const row = data[i]
          const rangeType = this.normalizationRanges[this.rowNames[i]] || 'min-max'
          const min = Math.min(...row)
          const max = Math.max(...row)
          console.log(
            `Normalizing row ${this.rowNames[i]}: min=${min}, max=${max}, rangeType=${rangeType}`,
          )
          normalized[i] = row.map((val) => {
            if (rangeType === 'min-max') {
              return max !== min ? (val - min) / (max - min) : 0
            } else {
              return max !== 0 ? val / max : 0
            }
          })
        }
      } else if (this.normalizationType === 'column') {
        for (let j = 0; j < numCols; j++) {
          const col = data.map((row) => row[j])
          const rangeType = this.normalizationRanges[this.columnNames[j]] || 'min-max'
          const min = Math.min(...col)
          const max = Math.max(...col)
          console.log(
            `Normalizing column ${this.columnNames[j]}: min=${min}, max=${max}, rangeType=${rangeType}`,
          )
          for (let i = 0; i < numRows; i++) {
            if (!normalized[i]) normalized[i] = []
            if (rangeType === 'min-max') {
              normalized[i][j] = max !== min ? (data[i][j] - min) / (max - min) : 0
            } else {
              normalized[i][j] = max !== 0 ? data[i][j] / max : 0
            }
          }
        }
      }
      console.log('Normalization complete:', normalized)
      this.normalizedData = normalized
    },
    setRowOrder(order: number[]) {
      this.rowOrder = order
    },
    setColumnOrder(order: number[]) {
      this.columnOrder = order
    },
    reset() {
      this.initialData = []
      this.normalizedData = []
      this.rowOrder = []
      this.columnOrder = []
      this.hasData = false
    },
    resetOrder() {
      this.rowOrder = this.rowNames.map((name) => this.rowNames.indexOf(name))
      this.columnOrder = this.columnNames.map((name) => this.columnNames.indexOf(name))
    },
  },
  getters: {
    // Returns the current matrix (normalized if available, else initial), in the current order
    currentMatrix: (state): MatrixData => {
      const values: MatrixCell[][] = state.rowOrder.map((rowIdx) =>
        state.columnOrder.map((colIdx) => ({
          row: state.rowNames[rowIdx],
          column: state.columnNames[colIdx],
          initialValue: state.initialData[rowIdx]?.[colIdx] ?? 0,
          normalizedValue:
            state.normalizedData.length > 0 ? state.normalizedData[rowIdx]?.[colIdx] : undefined,
        })),
      )
      return {
        rowNames: state.rowOrder.map((i) => state.rowNames[i]),
        columnNames: state.columnOrder.map((i) => state.columnNames[i]),
        values: values,
      }
    },
  },
})
