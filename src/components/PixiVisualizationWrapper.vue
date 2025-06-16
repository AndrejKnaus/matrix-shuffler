<script setup lang="ts">
import { computed } from 'vue'
import PixiVisualization from './PixiVisualization.vue'
import { useDatasetStore, type MatrixData } from '@/stores/dataset'
import { useVisualizationStore } from '@/stores/visualization'
import { generateRandomMatrix } from '@/utils/utils'

const DEFAULT_ROW_SIZE = 5
const DEFAULT_COLUMN_SIZE = 7

const props = withDefaults(
  defineProps<{
    useRandomData?: boolean
    rowSize?: number
    columnSize?: number
  }>(),
  {
    useRandomData: false,
    rowSize: DEFAULT_ROW_SIZE,
    columnSize: DEFAULT_COLUMN_SIZE,
  },
)

const datasetStore = useDatasetStore()
const visualizationStore = useVisualizationStore()

const matrixData = computed<MatrixData | undefined>(() => {
  if (datasetStore.hasData) {
    return datasetStore.currentMatrix
  } else if (props.useRandomData) {
    return generateRandomMatrix(props.rowSize, props.columnSize)
  }
  return undefined
})
</script>

<template>
  <div class="pixi-matrix-outer">
    <PixiVisualization
      v-if="matrixData"
      :cellSize="visualizationStore.config.matrixCellDimension"
      :padding="visualizationStore.config.matrixCellSpacing"
      :matrixData="matrixData"
      :width="visualizationStore.config.width"
      :height="visualizationStore.config.height"
    />
    <div v-else class="no-data-container">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" class="no-data-icon">
        <rect
          x="8"
          y="16"
          width="48"
          height="32"
          rx="6"
          fill="#f3f3f3"
          stroke="#bdbdbd"
          stroke-width="2"
        />
        <text
          x="32"
          y="38"
          text-anchor="middle"
          fill="#bdbdbd"
          font-size="16"
          font-family="Arial"
          dy=".3em"
        >
          ?
        </text>
      </svg>
      <div class="no-data-message">
        <h3>No Data Available</h3>
        <p>
          Please import a dataset or select an example to begin visualizing your matrix.<br />
          Use the <strong>File</strong> menu above to get started.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixi-matrix-outer {
  padding: 16px;
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
