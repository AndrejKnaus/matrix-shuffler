<script setup lang="ts">
import { useFileUpload } from '@/utils/utils'

defineProps<{
  msg: string
}>()

const { fileData, fileError, showFileData, handleFileUpload } = useFileUpload()
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>Please try to load your own dataset or select one of the available datasets</h3>

    <div class="btn-group">
      <div class="file-upload">
        <label for="file-input" class="file-button"> Upload Your Dataset </label>
        <input
          type="file"
          id="file-input"
          accept=".csv,.tsv"
          @change="handleFileUpload"
          style="display: none"
        />
      </div>
      <div class="show-hide-summary-btn">
        <button
          class="file-button"
          :disabled="!fileData"
          @click="fileData && (showFileData = !showFileData)"
          style="user-select: none; padding: 14px 10px"
          type="button"
        >
          {{ showFileData ? 'Hide' : 'Show' }} File Summary
        </button>
      </div>
    </div>

    <div v-if="fileData">
      <div v-if="showFileData" class="file-output" style="max-height: 300px; overflow-y: auto">
        <h4>File Content Summary:</h4>
        <pre>{{ fileData }}</pre>
      </div>
    </div>

    <div v-if="fileError" class="file-error">
      <p>Error: {{ fileError }}</p>
    </div>
  </div>
</template>

<style scoped>
.greetings {
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.btn-group {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 12px;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

.file-upload {
  display: flex;
  align-items: center;
}

.file-button {
  padding: 10px 15px;
  background-color: var(--color-primary);
  color: var(--color-text-light, white);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  display: inline-block;
  transition: background 0.2s;
}

.file-button:disabled,
.file-button[disabled] {
  background-color: #bdbdbd;
  color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.show-hide-summary-btn {
  display: flex;
  align-items: center;
}

.show-hide-summary-btn .file-button:disabled {
  pointer-events: none;
}

.file-button:hover {
  background-color: var(--color-primary-light);
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
  .greetings {
    margin-left: 20%;
    margin-right: 20%;
  }
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
  .file-upload {
    text-align: left;
  }
}
</style>
