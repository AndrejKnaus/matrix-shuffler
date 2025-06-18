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

export type SortDirection = 'asc' | 'desc'
export type SortMethod = 'sum' | 'mean' | 'median' | 'max' | 'min' | 'variance' | 'alphabetical'

export const useDatasetStore = defineStore('dataset', {
  state: () => ({
    rowNames: [] as string[],
    columnNames: [] as string[],
    initialData: [] as number[][], // Raw parsed data
    normalizationType: 'none' as 'none' | 'row' | 'column' | 'global', // Normalization type
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
    },
    setNormalizationType(type: 'none' | 'row' | 'column' | 'global') {
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
          normalized[i] = row.map((val) => {
            if (rangeType === 'min-max') {
              if (max !== min) {
                return (val - min) / (max - min)
              } else {
                // When all values are identical, set them to 0.5 (middle value) instead of 0
                return 0.5
              }
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
          for (let i = 0; i < numRows; i++) {
            if (!normalized[i]) normalized[i] = []
            if (rangeType === 'min-max') {
              if (max !== min) {
                normalized[i][j] = (data[i][j] - min) / (max - min)
              } else {
                // When all values are identical, set them to 0.5 (middle value) instead of 0
                normalized[i][j] = 0.5
              }
            } else {
              normalized[i][j] = max !== 0 ? data[i][j] / max : 0
            }
          }
        }
      } else if (this.normalizationType === 'global') {
        // Global normalization - find min/max across entire dataset
        const allValues = data.flat()
        const globalMin = Math.min(...allValues)
        const globalMax = Math.max(...allValues)

        for (let i = 0; i < numRows; i++) {
          normalized[i] = data[i].map((val) => {
            if (globalMax !== globalMin) {
              return (val - globalMin) / (globalMax - globalMin)
            } else {
              return 0.5
            }
          })
        }
      }
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

    // 2D Sorting Algorithms

    // Helper function to calculate statistic for a row or column
    calculateStatistic(values: number[], method: SortMethod): number {
      if (method === 'alphabetical') return 0 // Not applicable for numeric calculation

      const validValues = values.filter((v) => !isNaN(v) && isFinite(v))
      if (validValues.length === 0) return 0

      switch (method) {
        case 'sum':
          return validValues.reduce((a, b) => a + b, 0)
        case 'mean':
          return validValues.reduce((a, b) => a + b, 0) / validValues.length
        case 'median':
          const sorted = [...validValues].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
        case 'max':
          return Math.max(...validValues)
        case 'min':
          return Math.min(...validValues)
        case 'variance':
          const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length
          return (
            validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length
          )
        default:
          return 0
      }
    },

    // Sort rows by specified method and direction
    sortRows(method: SortMethod, direction: SortDirection = 'desc') {
      if (!this.hasData || this.initialData.length === 0) return

      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData

      if (method === 'alphabetical') {
        // Sort by row names alphabetically
        const sortedIndices = [...this.rowOrder].sort((a, b) => {
          const nameA = this.rowNames[a].toLowerCase()
          const nameB = this.rowNames[b].toLowerCase()
          const comparison = nameA.localeCompare(nameB)
          return direction === 'asc' ? comparison : -comparison
        })
        this.rowOrder = sortedIndices
      } else {
        // Sort by statistical method
        const rowStats = this.rowOrder.map((rowIdx) => ({
          index: rowIdx,
          stat: this.calculateStatistic(data[rowIdx], method),
        }))

        rowStats.sort((a, b) => {
          const comparison = a.stat - b.stat
          return direction === 'asc' ? comparison : -comparison
        })

        this.rowOrder = rowStats.map((item) => item.index)
      }
    },

    // Sort columns by specified method and direction
    sortColumns(method: SortMethod, direction: SortDirection = 'desc') {
      if (!this.hasData || this.initialData.length === 0) return

      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData

      if (method === 'alphabetical') {
        // Sort by column names alphabetically
        const sortedIndices = [...this.columnOrder].sort((a, b) => {
          const nameA = this.columnNames[a].toLowerCase()
          const nameB = this.columnNames[b].toLowerCase()
          const comparison = nameA.localeCompare(nameB)
          return direction === 'asc' ? comparison : -comparison
        })
        this.columnOrder = sortedIndices
      } else {
        // Sort by statistical method
        const colStats = this.columnOrder.map((colIdx) => {
          const columnValues = data.map((row) => row[colIdx])
          return {
            index: colIdx,
            stat: this.calculateStatistic(columnValues, method),
          }
        })

        colStats.sort((a, b) => {
          const comparison = a.stat - b.stat
          return direction === 'asc' ? comparison : -comparison
        })

        this.columnOrder = colStats.map((item) => item.index)
      }
    },

    // Sort both rows and columns by the same method
    sortMatrix(method: SortMethod, direction: SortDirection = 'desc') {
      this.sortRows(method, direction)
      this.sortColumns(method, direction)
    },

    // Reverse current row order
    reverseRows() {
      this.rowOrder.reverse()
    },

    // Reverse current column order
    reverseColumns() {
      this.columnOrder.reverse()
    },

    // Shuffle rows randomly
    shuffleRows() {
      for (let i = this.rowOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this.rowOrder[i], this.rowOrder[j]] = [this.rowOrder[j], this.rowOrder[i]]
      }
    },

    // Shuffle columns randomly
    shuffleColumns() {
      for (let i = this.columnOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this.columnOrder[i], this.columnOrder[j]] = [this.columnOrder[j], this.columnOrder[i]]
      }
    },

    // Advanced: Seriation algorithm to reveal patterns
    // This reorders rows and columns to bring similar patterns together
    applySeriation() {
      if (!this.hasData || this.initialData.length === 0) return

      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData

      // Simple seriation using hierarchical clustering approach
      // Calculate similarity matrix for rows
      const rowSimilarities: number[][] = []
      for (let i = 0; i < data.length; i++) {
        rowSimilarities[i] = []
        for (let j = 0; j < data.length; j++) {
          if (i === j) {
            rowSimilarities[i][j] = 1
          } else {
            // Calculate correlation coefficient
            const rowA = data[i]
            const rowB = data[j]
            rowSimilarities[i][j] = this.calculateCorrelation(rowA, rowB)
          }
        }
      }

      // Calculate similarity matrix for columns
      const colSimilarities: number[][] = []
      for (let i = 0; i < data[0].length; i++) {
        colSimilarities[i] = []
        for (let j = 0; j < data[0].length; j++) {
          if (i === j) {
            colSimilarities[i][j] = 1
          } else {
            const colA = data.map((row) => row[i])
            const colB = data.map((row) => row[j])
            colSimilarities[i][j] = this.calculateCorrelation(colA, colB)
          }
        }
      }

      // Apply simple greedy seriation
      this.rowOrder = this.greedySeriation(rowSimilarities)
      this.columnOrder = this.greedySeriation(colSimilarities)
    },

    // Helper function to calculate correlation coefficient
    calculateCorrelation(a: number[], b: number[]): number {
      const n = a.length
      if (n !== b.length) return 0

      const sumA = a.reduce((sum, val) => sum + val, 0)
      const sumB = b.reduce((sum, val) => sum + val, 0)
      const sumAB = a.reduce((sum, val, i) => sum + val * b[i], 0)
      const sumA2 = a.reduce((sum, val) => sum + val * val, 0)
      const sumB2 = b.reduce((sum, val) => sum + val * val, 0)

      const numerator = n * sumAB - sumA * sumB
      const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB))

      return denominator === 0 ? 0 : numerator / denominator
    },

    // Greedy seriation algorithm
    greedySeriation(similarities: number[][]): number[] {
      const n = similarities.length
      if (n === 0) return []

      const used = new Array(n).fill(false)
      const result: number[] = []

      // Start with the element that has the highest sum of similarities
      let maxSum = -1
      let startIdx = 0
      for (let i = 0; i < n; i++) {
        const sum = similarities[i].reduce((acc, val) => acc + val, 0)
        if (sum > maxSum) {
          maxSum = sum
          startIdx = i
        }
      }

      result.push(startIdx)
      used[startIdx] = true

      // Greedily add the most similar unused element
      while (result.length < n) {
        let maxSim = -1
        let nextIdx = -1

        for (let i = 0; i < n; i++) {
          if (used[i]) continue

          // Calculate similarity to already selected elements
          let avgSim = 0
          for (const selectedIdx of result) {
            avgSim += similarities[i][selectedIdx]
          }
          avgSim /= result.length

          if (avgSim > maxSim) {
            maxSim = avgSim
            nextIdx = i
          }
        }

        if (nextIdx >= 0) {
          result.push(nextIdx)
          used[nextIdx] = true
        } else {
          // Add any remaining unused element
          for (let i = 0; i < n; i++) {
            if (!used[i]) {
              result.push(i)
              used[i] = true
              break
            }
          }
        }
      }

      return result
    },

    // Sort rows by similarity to a specific row
    sortRowsBySimilarity(targetRowIndex: number, direction: SortDirection = 'desc') {
      if (!this.hasData || targetRowIndex < 0 || targetRowIndex >= this.initialData.length) return

      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData
      const targetRow = data[targetRowIndex]

      const rowSimilarities = this.rowOrder.map((rowIdx) => ({
        index: rowIdx,
        similarity:
          rowIdx === targetRowIndex ? 1 : this.calculateCorrelation(data[rowIdx], targetRow),
      }))

      rowSimilarities.sort((a, b) => {
        const comparison = a.similarity - b.similarity
        return direction === 'asc' ? comparison : -comparison
      })

      this.rowOrder = rowSimilarities.map((item) => item.index)
    },

    // Sort columns by similarity to a specific column
    sortColumnsBySimilarity(targetColIndex: number, direction: SortDirection = 'desc') {
      if (!this.hasData || targetColIndex < 0 || targetColIndex >= this.initialData[0]?.length)
        return

      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData
      const targetCol = data.map((row) => row[targetColIndex])

      const colSimilarities = this.columnOrder.map((colIdx) => {
        const col = data.map((row) => row[colIdx])
        return {
          index: colIdx,
          similarity: colIdx === targetColIndex ? 1 : this.calculateCorrelation(col, targetCol),
        }
      })

      colSimilarities.sort((a, b) => {
        const comparison = a.similarity - b.similarity
        return direction === 'asc' ? comparison : -comparison
      })

      this.columnOrder = colSimilarities.map((item) => item.index)
    },

    // 2D Sort (TwoDimSort) algorithm
    twoDimSort() {
      if (!this.hasData || this.initialData.length === 0) return
      // Work on a copy of the current order
      let rowOrder = [...this.rowOrder]
      let columnOrder = [...this.columnOrder]
      const data = this.normalizedData.length > 0 ? this.normalizedData : this.initialData
      let finish = false
      let runtimes = 0
      const maxRuns = 500
      let prevRowOrder: number[] = []
      let prevColOrder: number[] = []
      // Helper: deep compare arrays
      const arraysEqual = (a: number[], b: number[]) =>
        a.length === b.length && a.every((v, i) => v === b[i])
      while (!finish) {
        runtimes++
        // Sort by row weights
        const rowWeights = calculateRowWeights(data, rowOrder, columnOrder)
        for (let i = 0; i < rowOrder.length - 1; i++) {
          if (rowWeights[i] > rowWeights[i + 1]) {
            const tmpWeight = rowWeights[i]
            rowWeights[i] = rowWeights[i + 1]
            rowWeights[i + 1] = tmpWeight
            const tmpOrder = rowOrder[i]
            rowOrder[i] = rowOrder[i + 1]
            rowOrder[i + 1] = tmpOrder
          }
        }
        // Sort by column weights
        const colWeights = calculateColWeights(data, rowOrder, columnOrder)
        for (let i = 0; i < columnOrder.length - 1; i++) {
          if (colWeights[i] > colWeights[i + 1]) {
            const tmpWeight = colWeights[i]
            colWeights[i] = colWeights[i + 1]
            colWeights[i + 1] = tmpWeight
            const tmpOrder = columnOrder[i]
            columnOrder[i] = columnOrder[i + 1]
            columnOrder[i + 1] = tmpOrder
          }
        }
        // Check for convergence
        if (arraysEqual(rowOrder, prevRowOrder) && arraysEqual(columnOrder, prevColOrder)) {
          finish = true
        } else {
          prevRowOrder = [...rowOrder]
          prevColOrder = [...columnOrder]
        }
        if (runtimes >= maxRuns) finish = true
      }
      this.rowOrder = rowOrder
      this.columnOrder = columnOrder
      // --- Helper functions ---
      function calculateColWeights(
        matrix: number[][],
        rowOrder: number[],
        columnOrder: number[],
      ): number[] {
        // Normalize each row to sum to 1
        const normMatrix: number[][] = rowOrder.map((rowIdx) => {
          const row = columnOrder.map((colIdx) => matrix[rowIdx][colIdx])
          const sum = row.reduce((a, b) => a + b, 0)
          return sum === 0 ? row.map(() => 0) : row.map((v) => v / sum)
        })
        // Column weights: sum of each column
        const colWeights = columnOrder.map((_, j) =>
          normMatrix.reduce((sum, row) => sum + row[j], 0),
        )
        return colWeights
      }
      function calculateRowWeights(
        matrix: number[][],
        rowOrder: number[],
        columnOrder: number[],
      ): number[] {
        // Normalize each column to sum to 1
        const normMatrix: number[][] = rowOrder.map((rowIdx) =>
          columnOrder.map((colIdx) => matrix[rowIdx][colIdx]),
        )
        const numRows = normMatrix.length
        const numCols = normMatrix[0]?.length || 0
        // For each column, normalize
        for (let j = 0; j < numCols; j++) {
          let colSum = 0
          for (let i = 0; i < numRows; i++) colSum += normMatrix[i][j]
          if (colSum !== 0) {
            for (let i = 0; i < numRows; i++) normMatrix[i][j] /= colSum
          }
        }
        // Row weights: sum of each row
        const rowWeights = normMatrix.map((row) => row.reduce((a, b) => a + b, 0))
        return rowWeights
      }
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
