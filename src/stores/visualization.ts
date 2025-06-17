import type { VisualizationConfig, VisualizationEncoding } from '@/types/visualizationConfig'

import { defineStore } from 'pinia'

export interface VisualizationSettings {
  colorScheme: string
  minColor: string
  maxColor: string
  normalization: 'none' | 'row' | 'column' | 'global'
  labelRotation: number
}

export const useVisualizationStore = defineStore('visualization', {
  state: (): {
    config: VisualizationConfig
    settings: VisualizationSettings
  } => ({
    config: {
      width: 600,
      height: 600,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      colorScheme: 'blues',
      cellShape: 'circle',
      showLabels: true,
      encoding: 'color',
      matrixCellDimension: 40,
      matrixCellSpacing: 2,
    },
    settings: {
      colorScheme: 'blues',
      minColor: '#e3f0fb',
      maxColor: '#7daee6',
      normalization: 'none',
      labelRotation: 90,
    },
  }),
  actions: {
    updateConfig(partialConfig: Partial<VisualizationConfig>) {
      this.config = { ...this.config, ...partialConfig }
    },
    setEncoding(encoding: VisualizationEncoding) {
      this.config.encoding = encoding
    },
    updateSettings(partialSettings: Partial<VisualizationSettings>) {
      this.settings = { ...this.settings, ...partialSettings }
    },
    setNormalization(normalization: 'none' | 'row' | 'column' | 'global') {
      this.settings.normalization = normalization
    },
  },
})
