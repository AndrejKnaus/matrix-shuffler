import { defineStore } from 'pinia'
import type { VisualizationConfig, VisualizationEncoding } from '@/types/visualizationConfig'

export const useVisualizationStore = defineStore('visualization', {
  state: (): { config: VisualizationConfig } => ({
    config: {
      width: 600,
      height: 600,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      colorScheme: 'blues',
      cellShape: 'circle',
      showLabels: true,
      encoding: 'color',
    },
  }),
  actions: {
    updateConfig(partialConfig: Partial<VisualizationConfig>) {
      this.config = { ...this.config, ...partialConfig }
    },
    setEncoding(encoding: VisualizationEncoding) {
      this.config.encoding = encoding
    },
  },
})
