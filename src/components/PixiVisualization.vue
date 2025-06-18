<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Application,
  Container,
  Graphics,
  BitmapText,
  FederatedPointerEvent,
  Rectangle,
} from 'pixi.js'
import { useVisualizationStore } from '../stores/visualization'
import { type MatrixCell, type MatrixData } from '@/stores/dataset'

interface MatrixProps {
  cellSize: number
  padding: number
  matrixData: MatrixData
  width: number
  height: number
}

interface ExtendedContainer extends Container {
  rowIndex: number
  colIndex: number
  destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void
}

const props = withDefaults(defineProps<MatrixProps>(), {
  cellSize: 40,
  padding: 2,
})

const visualizationStore = useVisualizationStore()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const app = ref<Application | null>(null)
const rowContainers = ref<ExtendedContainer[]>([])
const cellContainers = ref<ExtendedContainer[][]>([])
const rowSize = ref(0)
const columnSize = ref(0)
const rowLabelPadding = ref(0)
const columnLabelObjects = ref<BitmapText[]>([])
const columnLabelPadding = ref(0)
const isPanning = ref(false)
let panStart = { x: 0, y: 0 }
let containerStart = { x: 0, y: 0 }
const panModifier = 'Space'

// Tooltip state
const tooltip = ref<{ x: number; y: number; content: string } | null>(null)
const hoveredCell = ref<{ event: FederatedPointerEvent; cellInfo: MatrixCell } | null>(null)
const isTooltipModifierPressed = ref(false)

interface DragState {
  isDragging: boolean
  dragMode: 'row' | 'column' | null
  startX: number
  startY: number
  originalRowIndex: number
  originalColIndex: number
  originalY: number
  originalX: number
  selectedRowContainer: ExtendedContainer | null
  selectedCells: ExtendedContainer[]
}

const dragState = ref<DragState>({
  isDragging: false,
  dragMode: null,
  startX: 0,
  startY: 0,
  originalRowIndex: 0,
  originalColIndex: 0,
  originalY: 0,
  originalX: 0,
  selectedRowContainer: null,
  selectedCells: [],
})

const exportCanvasAsPNG = (filename: string = 'matrix-shuffler.png') => {
  console.log('Exporting canvas as PNG...')
  if (!app.value) return
  const canvas = app.value.renderer.extract.canvas(app.value.stage)
  const base64 = canvas.toDataURL('image/png')
  // Create a download link
  const link = document.createElement('a')
  link.href = base64
  link.download = filename
  link.click()
}

defineExpose({ exportCanvasAsPNG })

const initializePixi = async () => {
  if (!containerRef.value) {
    console.error('Container ref is null')
    return
  }

  try {
    if (app.value) {
      app.value.destroy(true)
    }

    app.value = new Application()
    await app.value.init({
      background: '#ffffff',
      width: props.width,
      height: props.height,
      antialias: true,
      resolution: window.devicePixelRatio,
    })

    if (!containerRef.value || !app.value) {
      throw new Error('Container ref or app is null after initialization')
    }

    containerRef.value.appendChild(app.value.canvas)
    createMatrixVisualization()
  } catch (error) {
    console.error('Error initializing PixiJS:', error)
  }
}

const clearStage = () => {
  if (!app.value) return

  while (app.value.stage.children.length > 0) {
    const child = app.value.stage.children[0] as Container
    app.value.stage.removeChild(child)
    child.destroy()
  }

  // Reset container arrays to prevent stale references
  cellContainers.value = []
  rowContainers.value = []
  columnLabelObjects.value = []
}

const setupDragHandling = (cellSize: number, padding: number) => {
  for (let row = 0; row < props.matrixData.rowNames.length; row++) {
    for (let col = 0; col < props.matrixData.columnNames.length; col++) {
      const cell = cellContainers.value[row][col]
      const cellInfo = props.matrixData.values[row][col]

      cell.on('pointerdown', (event: FederatedPointerEvent) => {
        if (dragState.value.isDragging || !app.value) return

        if (isPanning.value) {
          //event.stopPropagation()
          return
        }

        event.preventDefault?.()

        dragState.value = {
          isDragging: true,
          dragMode: null,
          startX: event.global.x,
          startY: event.global.y,
          originalRowIndex: cell.rowIndex,
          originalColIndex: cell.colIndex,
          originalY: cell.rowIndex * (cellSize + padding),
          originalX: cell.x,
          selectedRowContainer: rowContainers.value[cell.rowIndex],
          selectedCells: [],
        }

        app.value.stage.eventMode = 'static'
        app.value.stage.hitArea = app.value.screen

        const onPointerMove = (moveEvent: FederatedPointerEvent) => {
          if (!dragState.value.isDragging) return

          const dx = moveEvent.global.x - dragState.value.startX
          const dy = moveEvent.global.y - dragState.value.startY

          if (!dragState.value.dragMode && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragState.value.dragMode = determineDragDirection(dx, dy)

            if (dragState.value.dragMode === 'column') {
              for (let r = 0; r < props.matrixData.rowNames.length; r++) {
                dragState.value.selectedCells.push(
                  cellContainers.value[r][dragState.value.originalColIndex],
                )
              }
            }
          }

          if (dragState.value.dragMode === 'row') {
            handleRowDrag(dy, cellSize, padding)
          } else if (dragState.value.dragMode === 'column') {
            handleColumnDrag(dx, cellSize, padding)
          }
        }

        const onDOMMove = (e: MouseEvent | TouchEvent) => {
          if (!app.value) return
          const rect = app.value.canvas.getBoundingClientRect()
          const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
          const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
          const point = {
            global: {
              x: ((x - rect.left) * app.value.canvas.width) / rect.width,
              y: ((y - rect.top) * app.value.canvas.height) / rect.height,
            },
          } as FederatedPointerEvent
          onPointerMove(point)
        }

        const resetColumnLabelPositions = (cellSize: number, padding: number) => {
          for (let col = 0; col < columnLabelObjects.value.length; col++) {
            const colLabel = columnLabelObjects.value[col]
            colLabel.x = col * (cellSize + padding) + rowLabelPadding.value + cellSize / 2
          }
        }

        const endDrag = () => {
          if (!dragState.value.isDragging) return

          dragState.value = {
            isDragging: false,
            dragMode: null,
            startX: 0,
            startY: 0,
            originalRowIndex: 0,
            originalColIndex: 0,
            originalY: 0,
            originalX: 0,
            selectedRowContainer: null,
            selectedCells: [],
          }

          document.removeEventListener('mousemove', onDOMMove)
          document.removeEventListener('touchmove', onDOMMove)
          app.value?.stage.off('pointermove', onPointerMove)
          app.value?.stage.off('pointerup', onPointerUp)
          app.value?.stage.off('pointerupoutside', onPointerUp)
          document.removeEventListener('mouseup', documentMouseUp)
          document.removeEventListener('touchend', documentMouseUp)

          resetCellPositions(cellSize, padding)
          resetColumnLabelPositions(cellSize, padding)
        }

        const onPointerUp = () => {
          endDrag()
        }

        const documentMouseUp = () => {
          endDrag()
        }

        app.value?.stage.on('pointermove', onPointerMove)
        document.addEventListener('mousemove', onDOMMove)
        document.addEventListener('touchmove', onDOMMove)

        app.value?.stage.on('pointerup', onPointerUp)
        app.value?.stage.on('pointerupoutside', onPointerUp)
        document.addEventListener('mouseup', documentMouseUp)
        document.addEventListener('touchend', documentMouseUp)
      })

      cell.on('pointermove', (event: FederatedPointerEvent) => {
        hoveredCell.value = { event, cellInfo: cellInfo }
        if (isTooltipModifierPressed.value) {
          tooltip.value = {
            x: event.global.x + 10,
            y: event.global.y + 10,
            content: `Row: ${cellInfo.row}\nColumn: ${cellInfo.column}\nValue: ${cellInfo.initialValue}\nNormalized: ${roundTooltipNumber(cellInfo.normalizedValue)}`,
          }
        } else if (isPanning.value) {
          cell.cursor = 'grabbing'
        } else {
          tooltip.value = null
          cell.cursor = 'pointer'
        }
      })
      cell.on('pointerout', () => {
        hoveredCell.value = null
        tooltip.value = null
      })
    }
  }
}

const handleRowDrag = (dy: number, cellSize: number, padding: number) => {
  if (!dragState.value.selectedRowContainer) return

  const newY = dragState.value.originalY + dy + columnLabelPadding.value
  dragState.value.selectedRowContainer.y = newY

  const currentRowIndex = Math.round((dragState.value.originalY + dy) / (cellSize + padding))

  if (
    currentRowIndex !== dragState.value.originalRowIndex &&
    currentRowIndex >= 0 &&
    currentRowIndex < rowSize.value
  ) {
    rowContainers.value.forEach((container, index) => {
      if (container !== dragState.value.selectedRowContainer) {
        if (
          currentRowIndex > dragState.value.originalRowIndex &&
          index > dragState.value.originalRowIndex &&
          index <= currentRowIndex
        ) {
          container.y = (index - 1) * (cellSize + padding) + columnLabelPadding.value
        } else if (
          currentRowIndex < dragState.value.originalRowIndex &&
          index >= currentRowIndex &&
          index < dragState.value.originalRowIndex
        ) {
          container.y = (index + 1) * (cellSize + padding) + columnLabelPadding.value
        } else {
          container.y = index * (cellSize + padding) + columnLabelPadding.value
        }
      }
    })

    const removedRow = rowContainers.value.splice(dragState.value.originalRowIndex, 1)[0]
    rowContainers.value.splice(currentRowIndex, 0, removedRow)

    const removedCells = cellContainers.value.splice(dragState.value.originalRowIndex, 1)[0]
    cellContainers.value.splice(currentRowIndex, 0, removedCells)

    // eslint-disable-next-line vue/no-mutating-props
    const removedData = props.matrixData.values.splice(dragState.value.originalRowIndex, 1)[0]
    // eslint-disable-next-line vue/no-mutating-props
    props.matrixData.values.splice(currentRowIndex, 0, removedData)

    updateCellIndices()

    dragState.value.originalRowIndex = currentRowIndex
  }
}

const handleColumnDrag = (dx: number, cellSize: number, padding: number) => {
  const newX = dragState.value.originalX + dx - rowLabelPadding.value
  dragState.value.selectedCells.forEach((cell) => {
    cell.x = newX + rowLabelPadding.value
  })

  const draggedLabel = columnLabelObjects.value[dragState.value.originalColIndex]
  if (draggedLabel) {
    draggedLabel.x = newX + rowLabelPadding.value + cellSize / 2
  }

  const currentColIndex = Math.round(newX / (cellSize + padding))

  if (
    currentColIndex !== dragState.value.originalColIndex &&
    currentColIndex >= 0 &&
    currentColIndex < columnSize.value
  ) {
    for (let r = 0; r < rowSize.value; r++) {
      if (currentColIndex > dragState.value.originalColIndex) {
        for (let c = dragState.value.originalColIndex + 1; c <= currentColIndex; c++) {
          cellContainers.value[r][c].x = (c - 1) * (cellSize + padding) + rowLabelPadding.value
          cellContainers.value[r][c].colIndex = c - 1
        }
      } else if (currentColIndex < dragState.value.originalColIndex) {
        for (let c = currentColIndex; c < dragState.value.originalColIndex; c++) {
          cellContainers.value[r][c].x = (c + 1) * (cellSize + padding) + rowLabelPadding.value
          cellContainers.value[r][c].colIndex = c + 1
        }
      }
    }

    for (let r = 0; r < rowSize.value; r++) {
      const cell = cellContainers.value[r][dragState.value.originalColIndex]
      if (cell !== dragState.value.selectedCells[0]) {
        cell.x = dragState.value.originalColIndex * (cellSize + padding) + rowLabelPadding.value
      }
    }

    for (let r = 0; r < rowSize.value; r++) {
      const removedCell = cellContainers.value[r].splice(dragState.value.originalColIndex, 1)[0]
      cellContainers.value[r].splice(currentColIndex, 0, removedCell)
      removedCell.colIndex = currentColIndex
    }

    for (let r = 0; r < rowSize.value; r++) {
      const removedData = props.matrixData.values[r].splice(dragState.value.originalColIndex, 1)[0]
      props.matrixData.values[r].splice(currentColIndex, 0, removedData)
    }

    const removedLabel = columnLabelObjects.value.splice(dragState.value.originalColIndex, 1)[0]
    columnLabelObjects.value.splice(currentColIndex, 0, removedLabel)
    for (let col = 0; col < columnLabelObjects.value.length; col++) {
      const colLabel = columnLabelObjects.value[col]
      colLabel.x = col * (cellSize + padding) + rowLabelPadding.value + cellSize / 2
    }

    dragState.value.originalColIndex = currentColIndex
  }
}

const updateCellIndices = () => {
  for (let r = 0; r < rowSize.value; r++) {
    for (let c = 0; c < columnSize.value; c++) {
      const cell = cellContainers.value[r][c]
      cell.rowIndex = r
      cell.colIndex = c
    }
  }
}

const renderMatrix = (cellSize: number, padding: number, container: Container) => {
  // Make the main container interactive
  container.eventMode = 'static'
  container.hitArea = app.value?.screen

  // Pre-calculate min/max for auto-normalization if needed
  const allValues = props.matrixData.values
    .flat()
    .map((cell) => cell.initialValue)
    .filter((v) => !isNaN(v))
  const needsAutoNormalization = props.matrixData.values.some((row) =>
    row.some((cell) => cell.normalizedValue === undefined),
  )

  let globalMin = Math.min(...allValues)
  let globalMax = Math.max(...allValues)

  if (needsAutoNormalization) {
    // Check for extreme outliers - if the range is too wide, use percentile-based normalization
    const range = globalMax - globalMin
    const sortedValues = [...allValues].sort((a, b) => a - b)
    const p5 = sortedValues[Math.floor(sortedValues.length * 0.05)] // 5th percentile
    const p95 = sortedValues[Math.floor(sortedValues.length * 0.95)] // 95th percentile
    const percentileRange = p95 - p5

    // If the full range is more than 10x the percentile range, use percentile-based normalization
    if (range > percentileRange * 10) {
      globalMin = p5
      globalMax = p95
    }
  }

  let maxLabelWidth = 0
  const tempLabels: BitmapText[] = []
  for (let row = 0; row < props.matrixData.rowNames.length; row++) {
    const tempLabel = new BitmapText({
      text: props.matrixData.rowNames[row],
      style: {
        fontFamily: 'Arial',
        align: 'left',
        fontSize: 14,
        fill: '#000000',
      },
    })

    tempLabels.push(tempLabel)
    if (tempLabel.width > maxLabelWidth) {
      maxLabelWidth = tempLabel.width
    }
  }
  const labelPadding = 10
  rowLabelPadding.value = maxLabelWidth + labelPadding

  let maxLabelHeight = 0
  const columnLabelContainer = new Container()
  columnLabelObjects.value = []
  for (let col = 0; col < props.matrixData.columnNames.length; col++) {
    const labelText = props.matrixData.columnNames[col]
    const colLabel = new BitmapText({
      text: labelText,
      style: {
        fontFamily: 'Arial',
        align: 'left',
        fontSize: 14,
        fill: '#000000',
      },
    })
    //colLabel.rotation = -Math.PI / 2 // Rotate the label 90 degrees counter-clockwise
    const rotationDegrees = visualizationStore.settings.labelRotation
    colLabel.rotation = -(rotationDegrees * Math.PI) / 180
    colLabel.x = col * (cellSize + padding) + rowLabelPadding.value + cellSize / 2
    colLabel.y = 0
    colLabel.anchor = { x: 0, y: 0.5 }

    const rotatedHeight = colLabel.width
    if (rotatedHeight > maxLabelHeight) {
      maxLabelHeight = rotatedHeight
    }

    columnLabelContainer.addChild(colLabel)
    columnLabelObjects.value[col] = colLabel
  }

  columnLabelContainer.x = 0
  columnLabelContainer.y = maxLabelHeight
  container.addChild(columnLabelContainer)
  columnLabelPadding.value = maxLabelHeight + labelPadding

  for (let row = 0; row < props.matrixData.rowNames.length; row++) {
    const rowContainer = new Container() as ExtendedContainer
    rowContainer.rowIndex = row
    rowContainer.colIndex = -1
    rowContainer.eventMode = 'static'
    rowContainers.value[row] = rowContainer
    cellContainers.value[row] = []

    const rowLabel = tempLabels[row]
    rowLabel.x = 0
    rowLabel.y = cellSize * 0.25 // Vertically center if needed
    rowContainer.addChild(rowLabel)

    for (let col = 0; col < props.matrixData.columnNames.length; col++) {
      const value = props.matrixData.values[row][col]
      const cell = createCell(
        row,
        col,
        value,
        cellSize,
        padding,
        needsAutoNormalization,
        globalMin,
        globalMax,
      )
      rowContainer.addChild(cell)
      cellContainers.value[row][col] = cell
    }

    rowContainer.y = row * (cellSize + padding) + columnLabelPadding.value
    container.addChild(rowContainer)
  }
}

// Helper function to convert CSS hex color to PIXI color
const hexToPixiColor = (hex: string): number => {
  return parseInt(hex.replace('#', ''), 16)
}

// Helper function to interpolate between min and max colors based on value
const getInterpolatedColor = (value: number): number => {
  try {
    // Clamp value between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, isNaN(value) ? 0 : value))

    const minColor = hexToPixiColor(visualizationStore.settings.minColor)
    const maxColor = hexToPixiColor(visualizationStore.settings.maxColor)

    // Simple linear interpolation - for more complex color spaces, could use a library
    const r1 = (minColor >> 16) & 255
    const g1 = (minColor >> 8) & 255
    const b1 = minColor & 255

    const r2 = (maxColor >> 16) & 255
    const g2 = (maxColor >> 8) & 255
    const b2 = maxColor & 255

    const r = Math.round(r1 + (r2 - r1) * clampedValue)
    const g = Math.round(g1 + (g2 - g1) * clampedValue)
    const b = Math.round(b1 + (b2 - b1) * clampedValue)

    return (r << 16) | (g << 8) | b
  } catch (error) {
    return 0x1e40af // Default blue color
  }
}

const createCell = (
  row: number,
  col: number,
  value: MatrixCell,
  cellSize: number,
  padding: number,
  needsAutoNormalization: boolean = false,
  globalMin: number = 0,
  globalMax: number = 1,
): ExtendedContainer => {
  try {
    const cell = new Container() as ExtendedContainer
    cell.rowIndex = row
    cell.colIndex = col
    cell.eventMode = 'dynamic'
    cell.cursor = 'pointer'

    const rect = new Graphics()

    const initialValue = isNaN(value.initialValue) ? 0 : value.initialValue
    let normalizedValue =
      value.normalizedValue !== undefined && !isNaN(value.normalizedValue)
        ? value.normalizedValue
        : initialValue

    // If no normalization was applied (normalizedValue equals initialValue),
    // we need to normalize for display purposes using pre-calculated global min/max
    if (value.normalizedValue === undefined && needsAutoNormalization) {
      if (globalMax !== globalMin) {
        // Clamp values to the normalization range to handle outliers
        const clampedValue = Math.max(globalMin, Math.min(globalMax, initialValue))
        normalizedValue = (clampedValue - globalMin) / (globalMax - globalMin)
      } else {
        normalizedValue = 0.5
      }
    }

    const alpha = Math.max(0, Math.min(1, normalizedValue)) // Clamp alpha between 0 and 1

    const encoding: 'circle' | 'color' | 'circle-color' | 'color-text' =
      visualizationStore.config.encoding

    switch (encoding) {
      case 'circle':
        createCircleCell(cell, rect, initialValue, cellSize, normalizedValue)
        break
      case 'color':
        createColorCell(cell, rect, alpha, cellSize)
        break
      case 'color-text':
        createColorTextCell(cell, rect, initialValue, alpha, cellSize)
        break
      case 'circle-color':
        createCircleColor(cell, rect, initialValue, alpha, cellSize, normalizedValue)
        break
    }

    cell.x = col * (cellSize + padding) + rowLabelPadding.value

    return cell
  } catch (error) {
    console.error('Error creating cell at', row, col, ':', error)
    // Return a simple fallback cell
    const fallbackCell = new Container() as ExtendedContainer
    const rect = new Graphics()
    rect.fill({ color: 0xcccccc, alpha: 0.5 })
    rect.rect(0, 0, cellSize, cellSize)
    fallbackCell.addChild(rect)
    fallbackCell.x = col * (cellSize + padding) + rowLabelPadding.value
    fallbackCell.rowIndex = row
    fallbackCell.colIndex = col
    return fallbackCell
  }
}

const createCircleCell = (
  cell: Container,
  rect: Graphics,
  value: number,
  cellSize: number,
  normalizedValue: number,
) => {
  const borderColor = getInterpolatedColor(normalizedValue)
  rect.setStrokeStyle({ width: 1, color: borderColor, alignment: 0.5 }) // Align stroke to pixel boundaries
  rect.fill({ color: 0xfff, alpha: 0 })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()

  const valueIndicator = new Graphics()
  const fillColor = getInterpolatedColor(normalizedValue)
  valueIndicator.fill({ color: fillColor, alpha: 0.9 })
  valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
  valueIndicator.endFill()

  cell.addChild(valueIndicator)
  cell.addChild(rect)
}

const createColorCell = (cell: Container, rect: Graphics, alpha: number, cellSize: number) => {
  const borderColor = getInterpolatedColor(alpha)
  const fillColor = getInterpolatedColor(alpha)
  rect.setStrokeStyle({ width: 1, color: borderColor })
  rect.fill({ color: fillColor, alpha: alpha })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()
  cell.addChild(rect)
}

const createColorTextCell = (
  cell: Container,
  rect: Graphics,
  value: number,
  alpha: number,
  cellSize: number,
) => {
  const borderColor = getInterpolatedColor(alpha)
  const fillColor = getInterpolatedColor(alpha)
  rect.setStrokeStyle({ width: 1, color: borderColor })
  rect.fill({ color: fillColor, alpha: alpha })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()

  const text = new BitmapText({
    text: value.toString(),
    style: {
      fontFamily: 'Arial',
      align: 'center',
      fontSize: 14,
      fill: '#000000',
    },
  })
  text.anchor.set(0.5)
  text.x = cellSize / 2
  text.y = cellSize / 2

  cell.addChild(rect)
  cell.addChild(text)
}

const createCircleColor = (
  cell: Container,
  rect: Graphics,
  value: number,
  alpha: number,
  cellSize: number,
  normalizedValue: number,
) => {
  const borderColor = getInterpolatedColor(alpha)
  const fillColor = getInterpolatedColor(alpha)
  rect.setStrokeStyle({ width: 1, color: borderColor })
  rect.fill({ color: fillColor, alpha: alpha })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()

  const valueIndicator = new Graphics()
  const circleColor = getInterpolatedColor(normalizedValue)
  valueIndicator.fill({ color: circleColor, alpha: 0.9 })
  valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
  valueIndicator.endFill()

  cell.addChild(valueIndicator)
  cell.addChild(rect)
}

const centerContainer = (container: Container) => {
  if (!app.value) {
    return
  }

  // Calculate scale to fit the content within the viewport
  const availableWidth = app.value.screen.width * 0.9 // Leave 10% margin
  const availableHeight = app.value.screen.height * 0.9 // Leave 10% margin

  const scaleX = container.width > 0 ? availableWidth / container.width : 1
  const scaleY = container.height > 0 ? availableHeight / container.height : 1

  // For large datasets, use a minimum scale to ensure visibility
  const minScale = 0.1 // Don't scale smaller than 10%
  const scale = 1 //Math.max(minScale, Math.min(scaleX, scaleY, 1)) // Don't scale up, only down

  container.scale.set(scale)

  // Center after scaling
  const scaledWidth = container.width * scale
  const scaledHeight = container.height * scale

  container.x = (app.value.screen.width - scaledWidth) / 2
  container.y = (app.value.screen.height - scaledHeight) / 2
}

// Matrix visualization creation
const createMatrixVisualization = () => {
  if (!app.value) {
    return
  }

  if (!props.matrixData || !props.matrixData.rowNames || !props.matrixData.columnNames) {
    return
  }

  const rows = props.matrixData.rowNames.length
  const cols = props.matrixData.columnNames.length

  // Use configured cell size, fallback to automatic calculation
  let cellSize = visualizationStore.config.matrixCellDimension || props.cellSize
  const padding = visualizationStore.config.matrixCellSpacing || props.padding

  if (!cellSize) {
    const viewportWidth = app.value.screen.width
    const viewportHeight = app.value.screen.height
    const availableWidth = viewportWidth * 0.8
    const availableHeight = viewportHeight * 0.8

    const maxCellSizeByWidth = Math.floor(availableWidth / cols)
    const maxCellSizeByHeight = Math.floor(availableHeight / rows)
    cellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight)

    // Minimum cell size for large datasets
    const minCellSize = rows > 20 || cols > 20 ? 6 : 10
    cellSize = Math.max(cellSize, minCellSize)
  }

  rowSize.value = props.matrixData.rowNames.length
  columnSize.value = props.matrixData.columnNames.length

  try {
    clearStage()

    const container = new Container()
    const exportPadding = 20

    // Create a sub-container for the matrix and center it in the padded area
    const matrixContainer = new Container()
    renderMatrix(cellSize, padding, matrixContainer)

    const contentWidth = cols * (cellSize + padding) + rowLabelPadding.value
    const contentHeight = rows * (cellSize + padding) + columnLabelPadding.value

    // Set the renderer size to fit content + padding
    const totalWidth = contentWidth + exportPadding * 2
    const totalHeight = contentHeight + exportPadding * 2
    //app.value.renderer.resize(totalWidth, totalHeight)
    app.value.screen.width = totalWidth
    app.value.screen.height = totalHeight

    // Draw white background with padding
    const bg = new Graphics()
    bg.fill({ color: 0xffffff, alpha: 1 })
    bg.rect(0, 0, totalWidth, totalHeight)
    bg.endFill()
    container.addChild(bg)

    matrixContainer.x = exportPadding
    matrixContainer.y = exportPadding
    container.addChild(matrixContainer)

    app.value.stage.addChild(container)
    setupDragHandling(cellSize, padding)
    resizePixi()
  } catch (error) {
    console.error('Error creating matrix visualization:', error)
  }
}

const determineDragDirection = (dx: number, dy: number): 'row' | 'column' => {
  return Math.abs(dx) > Math.abs(dy) ? 'column' : 'row'
}

const resetCellPositions = (cellSize: number, padding: number) => {
  rowContainers.value.forEach((rowContainer, rowIndex) => {
    rowContainer.y = rowIndex * (cellSize + padding) + columnLabelPadding.value
    for (let col = 0; col < props.matrixData.columnNames.length; col++) {
      const cell = cellContainers.value[rowIndex][col]
      cell.x = col * (cellSize + padding) + rowLabelPadding.value
    }
  })
}

const roundTooltipNumber = (value: number | undefined): string => {
  return value !== undefined ? Number(value.toFixed(3)).toString() : '-'
}

const handlePanStart = (event: KeyboardEvent) => {
  if (event.key === panModifier && !isPanning.value) {
    isPanning.value = true
    if (app.value) {
      app.value.stage.cursor = 'grab'
    }
  }
}

const handlePanEnd = (event: KeyboardEvent) => {
  if (event.key === panModifier && isPanning.value) {
    isPanning.value = false
    if (app.value) {
      app.value.stage.cursor = 'default'
    }
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.metaKey || e.altKey) {
    isTooltipModifierPressed.value = true
    if (hoveredCell.value) {
      const { event, cellInfo } = hoveredCell.value
      tooltip.value = {
        x: event.global.x + 10,
        y: event.global.y + 10,
        content: `Row: ${cellInfo.row}\nColumn: ${cellInfo.column}\nValue: ${cellInfo.initialValue}\nNormalized: ${roundTooltipNumber(cellInfo.normalizedValue)}`,
      }
    }
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (!e.metaKey && !e.altKey) {
    isTooltipModifierPressed.value = false
    tooltip.value = null
  }
}

const resizePixi = () => {
  if (!app.value || !containerRef.value) return

  const width = containerRef.value.clientWidth || window.innerWidth
  const height = containerRef.value.clientHeight || window.innerHeight

  app.value.renderer.resize(width, height)
  app.value.screen.width = width
  app.value.screen.height = height

  if (app.value.stage.children.length > 0) {
    centerContainer(app.value.stage.children[0] as Container)
  }
}

onMounted(async () => {
  await nextTick()
  await initializePixi()
  resizePixi()

  window.addEventListener('resize', resizePixi)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') isPanning.value = true
    if (e.code === 'KeyR') {
      if (app.value && app.value.stage.children.length > 0) {
        centerContainer(app.value.stage.children[0] as Container)
      }
    }
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === panModifier) isPanning.value = false
  })
})

watch(
  () => props.matrixData,
  (newVal) => {
    if (newVal && app.value) {
      createMatrixVisualization()
    }
  },
  { deep: true },
)

watch(
  () => visualizationStore.config.encoding,
  (newVal) => {
    if (newVal && app.value) {
      createMatrixVisualization()
    }
  },
  { deep: true },
)

watch(
  () => visualizationStore.settings,
  (newVal) => {
    if (newVal && app.value) {
      createMatrixVisualization()
    }
  },
  { deep: true },
)

watch(
  () => props.matrixData.values,
  (newVal) => {
    if (newVal && app.value) {
      createMatrixVisualization()
    }
  },
  { deep: true },
)

function onPanPointerDown(e: FederatedPointerEvent) {
  if (!isPanning.value || !app.value) return
  const container = app.value.stage.children[0] as Container
  panStart = { x: e.global.x, y: e.global.y }
  containerStart = { x: container.x, y: container.y }

  function onMove(ev: FederatedPointerEvent) {
    const dx = ev.global.x - panStart.x
    const dy = ev.global.y - panStart.y
    container.x = containerStart.x + dx
    container.y = containerStart.y + dy
  }

  function onUp() {
    if (!app.value) return
    app.value.stage.off('pointermove', onMove)
    app.value.stage.off('pointerup', onUp)
    app.value.stage.off('pointerupoutside', onUp)
    app.value.stage.cursor = 'grab'
  }

  app.value.stage.on('pointermove', onMove)
  app.value.stage.on('pointerup', onUp)
  app.value.stage.on('pointerupoutside', onUp)
  app.value.stage.cursor = 'grabbing'
}

watch(isPanning, (active) => {
  if (!app.value) return
  if (active) {
    app.value.stage.eventMode = 'static'
    app.value.stage.cursor = 'grab'
    app.value.stage.on('pointerdown', onPanPointerDown)
  } else {
    app.value.stage.eventMode = 'auto'
    app.value.stage.cursor = 'default'
    app.value.stage.off('pointerdown', onPanPointerDown)
  }
})

onUnmounted(() => {
  if (app.value) {
    app.value.destroy(true)
    app.value = null
  }
  window.removeEventListener('resize', resizePixi)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="pixi-matrix-container">
    <div ref="containerRef" class="canvas-container" style="position: relative">
      <div
        v-if="tooltip"
        class="pixi-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        {{ tooltip.content }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixi-matrix-container,
.canvas-container {
  flex: 1 1 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: none;
  margin: 0;
  padding: 0;
}
.pixi-tooltip {
  position: absolute;
  pointer-events: none;
  background: #fff;
  color: #222;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  z-index: 1000;
  white-space: pre;
  border: #222 solid 0.5px;
}
</style>
