import type { MatrixData } from '@/stores/dataset'
import { ref } from 'vue'
import { useDatasetStore } from '@/stores/dataset'

export function useFileUpload() {
  const fileData = ref<string | null>(null)
  const fileError = ref<string | null>(null)
  const showFileData = ref(true)
  const datasetStore = useDatasetStore()

  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      fileError.value = 'No file selected.'
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (fileExtension !== 'csv' && fileExtension !== 'tsv') {
          fileError.value = `Unsupported file type: ${fileExtension}`
          return
        }

        const { rowNames, columnNames, data } = parseMatrixFile(text, fileExtension)

        let output = `Columns: ${columnNames.join(', ')}\n`
        output += `Number of data rows: ${rowNames.length}\n`
        output += `Number of columns: ${columnNames.length}\n\n`
        output += 'First 5 rows (excluding header):\n'

        for (let i = 0; i < Math.min(data.length, 5); i++) {
          output += rowNames[i] + ': ' + data[i].join(', ') + '\n'
        }

        fileData.value = output

        datasetStore.setParsedData(rowNames, columnNames, data)
        datasetStore.setNormalizationType('row')
        datasetStore.normalizeData()
      } catch (error) {
        console.error('Error processing file:', error)
        if (error instanceof Error) {
          fileError.value = `Error processing file: ${error.message}`
        } else {
          fileError.value = 'An unknown error occurred while processing the file.'
        }
      }
    }

    reader.onerror = () => {
      fileError.value = 'Failed to read file.'
    }

    reader.readAsText(file)
  }

  return { fileData, fileError, showFileData, handleFileUpload }
}

export const parseMatrixFile = (text: string, extension: 'csv' | 'tsv') => {
  const delimiter = extension === 'csv' ? ',' : '\t'

  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('File must have header and at least one data row.')

  const header = lines[0].split(delimiter)
  const rowNames: string[] = []
  const columnNames = header.slice(1)
  const data: number[][] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter)
    rowNames.push(parts[0])
    data.push(parts.slice(1).map(Number))
  }

  return { rowNames, columnNames, data }
}

export const generateRandomMatrix = (rowSize: number, columnSize: number): MatrixData => {
  const values = Array.from({ length: rowSize }, (_, rowIdx) =>
    Array.from({ length: columnSize }, (_, colIdx) => {
      const value = Math.floor(Math.random() * 100)
      return {
        row: `Row ${rowIdx + 1}`,
        column: `Col ${colIdx + 1}`,
        initialValue: value,
        normalizedValue: value / 100,
      }
    }),
  )
  return {
    rowNames: Array.from({ length: rowSize }, (_, i) => `Row ${i + 1}`),
    columnNames: Array.from({ length: columnSize }, (_, i) => `Col ${i + 1}`),
    values,
  }
}
