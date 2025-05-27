import { defineStore } from 'pinia'
import type { VisualizationConfig } from '@/types/visualizationConfig'

export const useVisualizationStore = defineStore('visualization', {
  state: (): { config: VisualizationConfig } => ({
    config: {
      width: 600,
      height: 600,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      colorScheme: 'blues',
      cellShape: 'circle',
      showLabels: true,
    },
  }),
  actions: {
    updateConfig(partialConfig: Partial<VisualizationConfig>) {
      this.config = { ...this.config, ...partialConfig }
    },
  },
})
