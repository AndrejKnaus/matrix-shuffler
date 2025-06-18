<script setup lang="ts">
import { ref } from 'vue'
// import Introduction from './components/Introduction.vue'
import PixiVisualizationWrapper from './components/PixiVisualizationWrapper.vue'
import DataTable from './components/DataTable.vue'
import SettingsPanel from './components/SettingsPanel.vue'

import { useVisualizationStore } from './stores/visualization'

import { useFileUpload } from '@/utils/utils'

const showImportModal = ref(false)

const visualizationStore = useVisualizationStore()

const changeEncoding = (encoding: string) => {
  visualizationStore.setEncoding(encoding as 'circle' | 'color' | 'circle-color' | 'color-text')
}

const handleImportData = () => {
  showImportModal.value = true
}

const closeImportModal = () => {
  showImportModal.value = false
}

const { fileError } = useFileUpload()
const dataTableRef = ref()
const pixiVisRef = ref<typeof PixiVisualizationWrapper | null>(null)
const importedDisplayName = ref<string | null>(null)

const handleDataChange = () => {
  // Data updated in visualization
}

const exportAsPNG = () => {
  const name = importedDisplayName.value
    ? importedDisplayName.value.replace(/\.[^/.]+$/, '.png')
    : 'exported_image.png'
  pixiVisRef.value?.$refs?.pixiVisualizationRef?.exportCanvasAsPNG?.(name)
}

const handleTranspose = () => {
  dataTableRef.value?.transposeData()
}

const handleCSVImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  // Ensure DataTable panel is shown so ref is available
  showDataTablePanel.value = true

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      if (csv) {
        // Parse CSV data
        const lines = csv.split('\n').filter((line) => line.trim())
        const data = lines.map((line) => {
          const values = line.split(',').map((val) => val.trim())
          return values.map((val, index) => {
            // First column is usually text (item names), others are numbers
            if (index === 0) return val
            const num = parseFloat(val)
            return isNaN(num) ? val : num
          })
        })

        if (dataTableRef.value && data.length > 0) {
          const displayName = file.name?.replace(/\.[^/.]+$/, '') || 'Imported CSV'
          importedDisplayName.value = displayName
          dataTableRef.value.loadFromCSV(data, displayName)
        }
      }
    }
    reader.readAsText(file)
  }
  closeImportModal()
}

const showSettingsPanel = ref(false)
const toggleSettingsPanel = () => {
  showSettingsPanel.value = !showSettingsPanel.value
}

const showDataTablePanel = ref(false)
const toggleDataTablePanel = () => {
  showDataTablePanel.value = !showDataTablePanel.value
}

const dataTablePanelWidth = ref(340)
const minDataTablePanelWidth = 220
const maxDataTablePanelWidth = 1200
let isResizingDataTablePanel = false

const startResizeDataTablePanel = (e: MouseEvent) => {
  isResizingDataTablePanel = true
  document.body.style.cursor = 'ew-resize'
  window.addEventListener('mousemove', resizeDataTablePanel)
  window.addEventListener('mouseup', stopResizeDataTablePanel)
}

const resizeDataTablePanel = (e: MouseEvent) => {
  if (!isResizingDataTablePanel) return
  const newWidth = Math.min(maxDataTablePanelWidth, Math.max(minDataTablePanelWidth, e.clientX))
  dataTablePanelWidth.value = newWidth
}

const stopResizeDataTablePanel = () => {
  isResizingDataTablePanel = false
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', resizeDataTablePanel)
  window.removeEventListener('mouseup', stopResizeDataTablePanel)
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <nav class="main-nav">
        <ul>
          <li class="dropdown">
            <a href="#" class="dropbtn">File</a>
            <div class="dropdown-content">
              <a href="#" @click.prevent="handleImportData">Import Data</a>
              <a href="#">Load Example Dataset</a>
              <a href="#">Export Data</a>
              <a href="#" @click="exportAsPNG">Export as PNG</a>
              <a href="#">Export as SVG</a>
            </div>
          </li>
          <li class="dropdown">
            <a href="#" class="dropbtn">View</a>
            <div class="dropdown-content">
              <a href="#" @click.prevent="changeEncoding('circle')">Display as Circles</a>
              <a href="#" @click.prevent="changeEncoding('color')">Display as Colors</a>
              <a href="#" @click.prevent="changeEncoding('circle-color')"
                >Display as Circle+Color</a
              >
              <a href="#" @click.prevent="changeEncoding('color-text')">Display as Color+Text</a>
            </div>
          </li>
          <li class="dropdown">
            <a href="#" class="dropbtn">Actions</a>
            <div class="dropdown-content">
              <a href="#">Reset Data Order</a>
              <a href="#">Apply Reordering Algorithm</a>
              <a href="#" @click.prevent="handleTranspose">Transpose Matrix</a>
            </div>
          </li>

          <li class="dropdown">
            <a href="#" class="dropbtn">Help</a>
            <div class="dropdown-content">
              <a href="#">About</a>
              <a
                href="https://github.com/AndrejKnaus/matrix-shuffler"
                target="_blank"
                rel="noopener"
                >Github</a
              >
            </div>
          </li>
        </ul>
      </nav>
    </header>

    <main class="content-area">
      <div class="wrapper">
        <div class="main-content">
          <!-- Data Table Panel -->
          <div>
            <button
              class="data-toggle-btn"
              @click="toggleDataTablePanel"
              :aria-expanded="showDataTablePanel"
              :class="{ 'panel-open': showDataTablePanel }"
              :style="showDataTablePanel ? `left: ${dataTablePanelWidth}px;` : 'left: 0;'"
            >
              🗂️
            </button>
            <transition name="slide-side-panel">
              <div
                v-if="showDataTablePanel"
                class="side-panel-data"
                :style="`width: ${dataTablePanelWidth}px;`"
              >
                <DataTable ref="dataTableRef" @dataChanged="handleDataChange" />
                <div
                  class="resize-handle"
                  @mousedown="startResizeDataTablePanel"
                  title="Resize panel"
                ></div>
              </div>
            </transition>
          </div>
          <!-- PixiJS Visualization View -->

          <div class="visualization-view">
            <PixiVisualizationWrapper ref="pixiVisRef" :useRandomData="false" />
          </div>
        </div>

        <button
          class="settings-toggle-btn"
          @click="toggleSettingsPanel"
          :aria-expanded="showSettingsPanel"
          :class="{ 'panel-open': showSettingsPanel }"
          :style="showSettingsPanel ? 'right: 360px;' : 'right: 0;'"
        >
          ⚙️
        </button>
        <transition name="slide-side-panel">
          <div v-if="showSettingsPanel" class="side-panel">
            <SettingsPanel />
          </div>
        </transition>
      </div>
    </main>

    <SettingsPanel v-if="showSettingsPanel" />

    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <button class="modal-close-button" @click="closeImportModal">&times;</button>
        <h3>Import Data</h3>
        <p>Select the dataset</p>
        <!-- Example: File input for import -->
        <input type="file" accept=".csv,.tsv" @change="handleCSVImport" />
        <div v-if="fileError" class="file-error">
          <p>Error: {{ fileError }}</p>
        </div>
        <!--
        <div
          v-if="fileData && showFileData"
          class="file-output"
          style="max-height: 300px; overflow-y: auto"
        >
          <h4>File Content Summary:</h4>
          <pre>{{ fileData }}</pre>
        </div>
        -->
        <div class="modal-actions">
          <button @click="closeImportModal">Cancel</button>
          <button @click="closeImportModal">Import</button>
          <!--
          <button v-if="fileData" @click="showFileData = !showFileData" style="margin-left: 10px">
            {{ showFileData ? 'Hide' : 'Show' }} File Summary
          </button>
          -->
        </div>
      </div>
    </div>

    <!--
  <RouterView />
  --></div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-header {
  width: 100%;
  background-color: var(--color-primary);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-nav ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: flex-start; /* Or center, space-around, etc. */
}

.main-nav li {
  position: relative; /* For dropdown positioning */
}

.main-nav a.dropbtn {
  display: block;
  color: white;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
}

.main-nav li a:hover,
.dropdown:hover .dropbtn {
  background-color: var(--color-primary-light);
  color: var(--color-on-hover);
  transition: 0.1s;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: var(--color-background-soft);
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1400;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {
  background-color: #ddd;
}

/* Show the dropdown menu on hover */
.dropdown:hover .dropdown-content {
  display: block;
}

.content-area {
  flex: 1 1 0;
  width: 100%;
  height: calc(100vh - 60px); /* header height */
  margin-top: 52px; /* header height */
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Ensure modal is on top */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 80%;
  position: relative;
}

.modal-close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #333;
}

.modal-actions {
  margin-top: 20px;
  text-align: right;
}

.modal-actions button {
  margin-left: 10px;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button:first-child {
  background-color: #eee;
  border: 1px solid #ccc;
}

.modal-actions button:last-child {
  background-color: var(--color-primary-light); /* Example primary action color */
  color: white;
  border: 1px solid var(--color-primary);
}

/* Removed - now defined below in main-content section */

.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.main-content {
  display: flex;
  height: 100%;
  padding: 8px;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
}

.data-panel {
  flex: 0 0 auto;
  min-height: 250px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Responsive layout for wider screens */
@media (min-width: 768px) {
  .main-content {
    flex-direction: row;
    padding: 16px;
  }

  .data-panel {
    flex: 0 0 350px;
    min-height: 0;
    max-height: none;
    max-width: 350px;
  }
}

@media (min-width: 1024px) {
  .data-panel {
    flex: 0 0 400px;
    max-width: 400px;
  }
}

@media (min-width: 1200px) {
  .data-panel {
    flex: 0 0 420px;
    max-width: 420px;
  }
}

.visualization-view {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-toggle-btn {
  position: fixed;
  top: 80px;
  right: 0;
  z-index: 1200;
  background: var(--color-primary-light);
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  padding: 12px 16px;
  font-size: 22px;
  cursor: pointer;
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}

.settings-toggle-btn.panel-open {
  right: 340px;
}

.data-toggle-btn {
  position: fixed;
  top: 80px;
  left: 0;
  z-index: 1200;
  background: var(--color-primary-light);
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  font-size: 22px;
  cursor: pointer;
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}

.data-toggle-btn.panel-open {
  left: 340px;
}

.data-toggle-btn[aria-expanded='true'] {
  background: var(--color-primary);
}

.side-panel {
  position: fixed;
  top: 52px;
  right: 0;
  width: 340px;
  height: calc(100vh - 52px);
  background: white;
  border-left: 1px solid var(--color-border);
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1300;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.side-panel-data {
  position: fixed;
  top: 52px;
  left: 0;
  /* width is now dynamic via inline style */
  height: calc(100vh - 52px);
  background: white;
  border-right: 1px solid var(--color-border);
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1300;
  display: flex;
  flex-direction: column;
}

.close-side-panel {
  position: absolute;
  top: 10px;
  left: 50px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #333;
  cursor: pointer;
  z-index: 1400;
}

.slide-side-panel-enter-from,
.slide-side-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-side-panel-enter-to,
.slide-side-panel-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 7px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  z-index: 1400;
  transition: background 0.2s;
}
.resize-handle:hover {
  background: rgba(0, 0, 0, 0.07);
}
</style>
