<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: string
}>()

const fileData = ref<string | null>(null)
const fileError = ref<string | null>(null)

const handleFileUpload = (event: Event) => {
  fileData.value = null
  fileError.value = null
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
      let delimiter = ''

      if (fileExtension === 'csv') {
        delimiter = ','
      } else if (fileExtension === 'tsv') {
        delimiter = '\t'
      } else {
        // For now, we only explicitly handle CSV and TSV for row/column display
        // JSON would be parsed differently if specific structure is expected
        fileError.value = `Unsupported file type for row/column display: ${fileExtension}`
        // If you want to display raw JSON, you could do:
        // fileData.value = text;
        return
      }

      const rows = text.trim().split(/\r?\n/)
      if (rows.length === 0) {
        fileData.value = 'File is empty.'
        return
      }

      const header = rows[0].split(delimiter)
      const numColumns = header.length
      const numRows = rows.length

      let output = `Columns: ${header.join(', ')}\n`
      output += `Number of data rows: ${numRows - 1}\n` // Excluding header row
      output += `Number of columns: ${numColumns}\n\n`
      output += 'First 5 rows (including header):\n'

      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        output += rows[i] + '\n'
      }

      fileData.value = output
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
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>Please try to load your own dataset or select one of the available datasets</h3>

    <div class="file-upload">
      <label for="file-input" class="file-button"> Upload Your Dataset </label>
      <input
        type="file"
        id="file-input"
        accept=".csv,.json,.tsv"
        @change="handleFileUpload"
        style="display: none"
      />
    </div>

    <div v-if="fileData" class="file-output" style="max-height: 300px; overflow-y: auto;">
      <h4>File Content Summary:</h4>
      <pre>{{ fileData }}</pre>
    </div>

    <div v-if="fileError" class="file-error">
      <p>Error: {{ fileError }}</p>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

.file-upload {
  margin-top: 20px;
  text-align: center; /* Or left, depending on your layout preference */
}

.file-button {
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: inline-block; /* To allow text-align to work if parent is center */
}

.file-button:hover {
  background-color: #45a049;
}

.file-output {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  white-space: pre-wrap; /* Ensures newlines are respected */
  text-align: left;
}

.file-error {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ff0000;
  background-color: #ffe0e0;
  color: #ff0000;
  text-align: left;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
  .file-upload {
    text-align: left;
  }
}
</style>
