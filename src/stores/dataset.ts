import { defineStore } from 'pinia'
import * as d3 from 'd3'

export interface DataRow extends Record<string, any> {}

export const useDatasetStore = defineStore('dataset', {
  state: () => ({
    fileName: null as string | null,
    rawData: null as string | null,
    parsedData: null as DataRow[] | null,
    error: null as string | null,
    delimiter: '' as string,
  }),
  actions: {
    async loadFile(file: File) {
      this.fileName = file.name
      this.error = null
      this.parsedData = null
      this.rawData = null
      this.delimiter = ''

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          this.rawData = text
          const fileExtension = file.name.split('.').pop()?.toLowerCase()

          if (fileExtension === 'csv') {
            this.delimiter = ','
            this.parsedData = d3.csvParse(text, d3.autoType)
          } else if (fileExtension === 'tsv') {
            this.delimiter = '\t'
            this.parsedData = d3.tsvParse(text, d3.autoType)
            /**}
          else if (fileExtension === 'json') {
            const jsonData = JSON.parse(text)
            if (Array.isArray(jsonData)) {
                this.parsedData = jsonData.map(row => {
                    // Ensure all parsed JSON objects are treated consistently by d3.autoType logic if needed later
                    // For now, direct assignment is fine.
                    const typedRow: DataRow = {};
                    for (const key in row) {
                        typedRow[key] = row[key]; // JSON types are preserved
                    }
                    return typedRow;
                });
            } else if (typeof jsonData === 'object' && jsonData !== null) {
                this.parsedData = [jsonData as DataRow]
                console.warn('Loaded JSON data is a single object, wrapped in an array.')
            } else {
                throw new Error('JSON data is not in a recognized format (array of objects or object).')
            }
          **/
          } else {
            this.error = `Unsupported file type for D3 parsing: ${fileExtension}`
            return
          }

          if (this.parsedData && this.parsedData.length === 0) {
            this.error = 'File is empty or could not be parsed into data rows.'
            this.parsedData = null
          }
        } catch (err) {
          console.error('Error processing file in store:', err)
          this.error =
            err instanceof Error
              ? `Error processing file: ${err.message}`
              : 'An unknown error occurred.'
          this.parsedData = null
          this.rawData = null
        }
      }

      reader.onerror = () => {
        this.error = 'Failed to read file.'
        this.rawData = null
        this.parsedData = null
      }

      reader.readAsText(file)
    },
    clearData() {
      this.fileName = null
      this.rawData = null
      this.parsedData = null
      this.error = null
      this.delimiter = ''
    },
  },
  getters: {
    hasData: (state) => state.parsedData !== null && state.parsedData.length > 0,
    columnNames: (state): string[] => {
      if (state.parsedData && state.parsedData.length > 0) {
        // For d3.csvParse/tsvParse with autoType, columns are on the parsed array
        if ((state.parsedData as any).columns) {
          return (state.parsedData as any).columns
        }
        // Fallback for JSON or other array of objects
        return Object.keys(state.parsedData[0])
      }
      return []
    },
    rowCount: (state) => state.parsedData?.length || 0,
  },
})
