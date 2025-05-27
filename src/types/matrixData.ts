export interface MatrixEntry {
  row: string
  col: string
  value: number
}

export interface MatrixData {
  rows: string[]
  cols: string[]
  values: MatrixEntry[]
}
