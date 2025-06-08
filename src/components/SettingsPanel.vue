<template>
  <div class="settings-panel" :class="{ 'panel-open': isOpen }">
    <div class="panel-header">
      <h3>Settings</h3>
      <button @click="togglePanel" class="toggle-btn">
        {{ isOpen ? '×' : '⚙️' }}
      </button>
    </div>

    <div class="panel-content" v-show="isOpen">
      <div class="setting-group">
        <h4>Normalization</h4>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="localSettings.normalization"
              value="none"
              @change="applySettings"
            />
            None
          </label>
          <label>
            <input
              type="radio"
              v-model="localSettings.normalization"
              value="row"
              @change="applySettings"
            />
            Row-wise
          </label>
          <label>
            <input
              type="radio"
              v-model="localSettings.normalization"
              value="column"
              @change="applySettings"
            />
            Column-wise
          </label>
          <label>
            <input
              type="radio"
              v-model="localSettings.normalization"
              value="global"
              @change="applySettings"
            />
            Global
          </label>
        </div>
      </div>

      <div class="setting-group">
        <h4>Visualization Colors</h4>
        <div class="color-inputs">
          <div class="color-input-group">
            <label>Min Color:</label>
            <input
              type="color"
              v-model="localSettings.minColor"
              @change="applySettings"
            />
            <span class="color-preview" :style="{ backgroundColor: localSettings.minColor }"></span>
          </div>
          <div class="color-input-group">
            <label>Max Color:</label>
            <input
              type="color"
              v-model="localSettings.maxColor"
              @change="applySettings"
            />
            <span class="color-preview" :style="{ backgroundColor: localSettings.maxColor }"></span>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h4>Color Scheme Presets</h4>
        <div class="color-schemes">
          <button
            @click="applyColorScheme('blues')"
            class="color-scheme-btn"
            :class="{ active: localSettings.colorScheme === 'blues' }"
          >
            Blues
          </button>
          <button
            @click="applyColorScheme('reds')"
            class="color-scheme-btn"
            :class="{ active: localSettings.colorScheme === 'reds' }"
          >
            Reds
          </button>
          <button
            @click="applyColorScheme('greens')"
            class="color-scheme-btn"
            :class="{ active: localSettings.colorScheme === 'greens' }"
          >
            Greens
          </button>
          <button
            @click="applyColorScheme('viridis')"
            class="color-scheme-btn"
            :class="{ active: localSettings.colorScheme === 'viridis' }"
          >
            Viridis
          </button>
        </div>
      </div>

      <div class="setting-group">
        <button @click="resetSettings" class="btn-reset">
          Reset to Defaults
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useVisualizationStore, type VisualizationSettings } from '@/stores/visualization'
import { useDatasetStore } from '@/stores/dataset'

const visualizationStore = useVisualizationStore()
const datasetStore = useDatasetStore()
const isOpen = ref(false)

const localSettings = reactive<VisualizationSettings>({
  colorScheme: 'blues',
  minColor: '#f0f8ff',
  maxColor: '#1e40af',
  normalization: 'none'
})

const colorSchemes = {
  blues: { minColor: '#f0f8ff', maxColor: '#1e40af' },
  reds: { minColor: '#fef2f2', maxColor: '#dc2626' },
  greens: { minColor: '#f0fdf4', maxColor: '#16a34a' },
  viridis: { minColor: '#440154', maxColor: '#fde725' }
}

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const applySettings = () => {
  visualizationStore.updateSettings(localSettings)

  if (localSettings.normalization !== 'none') {
    datasetStore.setNormalizationType(localSettings.normalization)
    datasetStore.normalizeData()
  } else {
    datasetStore.setNormalizationType('none')
  }
}

const applyColorScheme = (scheme: keyof typeof colorSchemes) => {
  localSettings.colorScheme = scheme
  localSettings.minColor = colorSchemes[scheme].minColor
  localSettings.maxColor = colorSchemes[scheme].maxColor
  applySettings()
}

const resetSettings = () => {
  localSettings.colorScheme = 'blues'
  localSettings.minColor = '#f0f8ff'
  localSettings.maxColor = '#1e40af'
  localSettings.normalization = 'none'
  applySettings()
}

onMounted(() => {
  // Initialize local settings from store
  Object.assign(localSettings, visualizationStore.settings)
})
</script>

<style scoped>
.settings-panel {
  position: fixed;
  top: 60px;
  right: 0;
  width: 300px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px 0 0 8px;
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  //transform: translateX(calc(100% - 100px));
  transition: transform 0.3s ease;
}

.settings-panel.panel-open {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.panel-header h3 {
  margin: 0;
  color: var(--color-text);
}

.toggle-btn {
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  color: white;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  z-index: 1002;
}

.toggle-btn:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.panel-content {
  padding: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group h4 {
  margin: 0 0 12px 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-text);
}

.color-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input-group label {
  min-width: 80px;
  color: var(--color-text);
  font-size: 14px;
}

.color-input-group input[type="color"] {
  width: 40px;
  height: 30px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
}

.color-preview {
  width: 20px;
  height: 20px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
}

.color-schemes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.color-scheme-btn {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}

.color-scheme-btn:hover {
  background: var(--color-background-soft);
}

.color-scheme-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-reset {
  width: 100%;
  padding: 10px;
  background: var(--color-accent);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--color-border);
}
</style>
