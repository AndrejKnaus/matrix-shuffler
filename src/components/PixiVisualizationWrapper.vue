<script setup lang="ts">
import { computed } from 'vue'
import PixiVisualization from './PixiVisualization.vue'
import { useDatasetStore, type MatrixData } from '@/stores/dataset'
import { generateRandomMatrix } from '@/utils/utils'

const DEFAULT_ROW_SIZE = 15
const DEFAULT_COLUMN_SIZE = 50
const DEFAULT_CELL_SIZE = 40
const DEFAULT_PADDING = 2

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
  <PixiVisualization
    v-if="matrixData"
    :cellSize="DEFAULT_CELL_SIZE"
    :padding="DEFAULT_PADDING"
    :matrixData="matrixData"
  />
  <div v-else>No data available</div>
</template>
