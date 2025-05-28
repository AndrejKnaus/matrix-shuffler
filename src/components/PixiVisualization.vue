<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Application, Container, Graphics, BitmapText } from 'pixi.js'
import { useMatrixStore } from '../stores/matrix'
import { useVisualizationStore } from '../stores/visualization'

interface MatrixProps {
  width: number
  height: number
  matrixSize: number
  cellSize: number
  padding: number
  useRandomData: boolean
}

const props = withDefaults(defineProps<MatrixProps>(), {
  width: 800,
  height: 600,
  matrixSize: 10,
  cellSize: 40,
  padding: 2,
  useRandomData: true
})

const matrixStore = useMatrixStore()
const visualizationStore = useVisualizationStore()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const app = ref<Application | null>(null)
const matrixData = ref<number[][]>([])
const rowContainers = ref<Container[]>([])
const cellContainers = ref<Container[][]>([])

interface DragState {
  isDragging: boolean
  dragMode: 'row' | 'column' | null
  startX: number
  startY: number
  originalRowIndex: number
  originalColIndex: number
  originalY: number
  originalX: number
  selectedRowContainer: Container | null
  selectedCells: Container[]
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
  selectedCells: []
})

const generateRandomMatrix = (size: number): number[][] => {
  if (matrixStore.hasData) {
    return matrixStore.matrixData
  }
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.floor(Math.random() * 100))
  )
}

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
    const child = app.value.stage.children[0]
    app.value.stage.removeChild(child)
    child.destroy()
  }
}

const setupDragHandling = (matrixSize: number, cellSize: number, padding: number) => {
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      const cell = cellContainers.value[row][col]

      cell.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
        if (dragState.value.isDragging) return

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
          selectedCells: []
        }

        app.value!.stage.eventMode = 'static'
        app.value!.stage.hitArea = app.value!.screen

        const onPointerMove = (moveEvent: PIXI.FederatedPointerEvent) => {
          if (!dragState.value.isDragging) return

          const dx = moveEvent.global.x - dragState.value.startX
          const dy = moveEvent.global.y - dragState.value.startY

          if (!dragState.value.dragMode && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragState.value.dragMode = determineDragDirection(dx, dy)

            if (dragState.value.dragMode === 'column') {
              for (let r = 0; r < matrixSize; r++) {
                dragState.value.selectedCells.push(cellContainers.value[r][dragState.value.originalColIndex])
              }
            }
          }

          if (dragState.value.dragMode === 'row') {
            handleRowDrag(dy, cellSize, padding, matrixSize)
          } else if (dragState.value.dragMode === 'column') {
            handleColumnDrag(dx, cellSize, padding, matrixSize)
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
            selectedCells: []
          }

          document.removeEventListener('mousemove', onPointerMove)
          document.removeEventListener('touchmove', onPointerMove)
          app.value?.stage.off('pointermove', onPointerMove)
          app.value?.stage.off('pointerup', onPointerUp)
          app.value?.stage.off('pointerupoutside', onPointerUp)
          document.removeEventListener('mouseup', documentMouseUp)
          document.removeEventListener('touchend', documentMouseUp)

          resetCellPositions(cellSize, padding, matrixSize)
        }

        const onPointerUp = () => {
          endDrag()
        }

        const documentMouseUp = () => {
          endDrag()
        }

        app.value?.stage.on('pointermove', onPointerMove)
        document.addEventListener('mousemove', onPointerMove)
        document.addEventListener('touchmove', onPointerMove)

        app.value?.stage.on('pointerup', onPointerUp)
        app.value?.stage.on('pointerupoutside', onPointerUp)
        document.addEventListener('mouseup', documentMouseUp)
        document.addEventListener('touchend', documentMouseUp)
      })
    }
  }
}

const handleRowDrag = (dy: number, cellSize: number, padding: number, matrixSize: number) => {
  if (!dragState.value.selectedRowContainer) return

  dragState.value.selectedRowContainer.y = dragState.value.originalY + dy

  const currentRowIndex = Math.round(dragState.value.selectedRowContainer.y / (cellSize + padding))

  if (
    currentRowIndex !== dragState.value.originalRowIndex &&
    currentRowIndex >= 0 &&
    currentRowIndex < matrixSize
  ) {
    rowContainers.value.forEach((container, index) => {
      if (container !== dragState.value.selectedRowContainer) {
        if (
          currentRowIndex > dragState.value.originalRowIndex &&
          index > dragState.value.originalRowIndex &&
          index <= currentRowIndex
        ) {
          container.y = (index - 1) * (cellSize + padding)
        } else if (
          currentRowIndex < dragState.value.originalRowIndex &&
          index >= currentRowIndex &&
          index < dragState.value.originalRowIndex
        ) {
          container.y = (index + 1) * (cellSize + padding)
        } else {
          container.y = index * (cellSize + padding)
        }
      }
    })

    const removedRow = rowContainers.value.splice(dragState.value.originalRowIndex, 1)[0]
    rowContainers.value.splice(currentRowIndex, 0, removedRow)

    const removedCells = cellContainers.value.splice(dragState.value.originalRowIndex, 1)[0]
    cellContainers.value.splice(currentRowIndex, 0, removedCells)

    const removedData = matrixData.value.splice(dragState.value.originalRowIndex, 1)[0]
    matrixData.value.splice(currentRowIndex, 0, removedData)

    updateCellIndices(matrixSize)

    dragState.value.originalRowIndex = currentRowIndex
  }
}

const handleColumnDrag = (dx: number, cellSize: number, padding: number, matrixSize: number) => {
  const newX = dragState.value.originalX + dx
  dragState.value.selectedCells.forEach((cell) => {
    cell.x = newX
  })

  const currentColIndex = Math.round(newX / (cellSize + padding))

  if (
    currentColIndex !== dragState.value.originalColIndex &&
    currentColIndex >= 0 &&
    currentColIndex < matrixSize
  ) {
    for (let r = 0; r < matrixSize; r++) {
      if (currentColIndex > dragState.value.originalColIndex) {
        for (let c = dragState.value.originalColIndex + 1; c <= currentColIndex; c++) {
          cellContainers.value[r][c].x = (c - 1) * (cellSize + padding)
          cellContainers.value[r][c].colIndex = c - 1
        }
      } else if (currentColIndex < dragState.value.originalColIndex) {
        for (let c = currentColIndex; c < dragState.value.originalColIndex; c++) {
          cellContainers.value[r][c].x = (c + 1) * (cellSize + padding)
          cellContainers.value[r][c].colIndex = c + 1
        }
      }
    }

    for (let r = 0; r < matrixSize; r++) {
      const cell = cellContainers.value[r][dragState.value.originalColIndex]
      if (cell !== dragState.value.selectedCells[0]) {
        cell.x = dragState.value.originalColIndex * (cellSize + padding)
      }
    }

    for (let r = 0; r < matrixSize; r++) {
      const removedCell = cellContainers.value[r].splice(dragState.value.originalColIndex, 1)[0]
      cellContainers.value[r].splice(currentColIndex, 0, removedCell)
      removedCell.colIndex = currentColIndex
    }

    for (let r = 0; r < matrixSize; r++) {
      const removedData = matrixData.value[r].splice(dragState.value.originalColIndex, 1)[0]
      matrixData.value[r].splice(currentColIndex, 0, removedData)
    }

    dragState.value.originalColIndex = currentColIndex
  }
}

const updateCellIndices = (matrixSize: number) => {
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const cell = cellContainers.value[r][c]
      cell.rowIndex = r
      cell.colIndex = c
    }
  }
}

const renderMatrix = (matrixSize: number, cellSize: number, padding: number, container: Container) => {
  for (let row = 0; row < matrixSize; row++) {
    const rowContainer = new Container()
    rowContainers.value[row] = rowContainer
    cellContainers.value[row] = []

    for (let col = 0; col < matrixData.value[row].length; col++) {
      const value = matrixData.value[row][col]
      const cell = createCell(row, col, value, cellSize, padding)
      rowContainer.addChild(cell)
      cellContainers.value[row][col] = cell
    }

    rowContainer.y = row * (cellSize + padding)
    container.addChild(rowContainer)
  }
}

const createCell = (row: number, col: number, value: number, cellSize: number, padding: number) => {
  const cell = new Container()
  cell.rowIndex = row
  cell.colIndex = col

  const rect = new Graphics()
  const normalizedValue = value / 100
  const alpha = 0.2 + normalizedValue * 0.8

  const enableCircleEncoding: 'circle' | 'color' | 'both' | 'color-text' = 'color'

  switch (enableCircleEncoding) {
    case 'circle':
      createCircleCell(cell, rect, value, cellSize, normalizedValue)
      break
    case 'color':
      createColorCell(cell, rect, alpha, cellSize)
      break
    case 'color-text':
      createColorTextCell(cell, rect, value, alpha, cellSize)
      break
    case 'both':
      createBothCell(cell, rect, value, alpha, cellSize, normalizedValue)
      break
  }

  cell.x = col * (cellSize + padding)
  cell.eventMode = 'dynamic'
  cell.cursor = 'pointer'

  return cell
}

const createCircleCell = (cell: Container, rect: Graphics, value: number, cellSize: number, normalizedValue: number) => {
  rect.setStrokeStyle({ width: 1, color: 0x404040 })
  rect.fill({ color: 0xfff, alpha: 0 })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()

  const valueIndicator = new Graphics()
  valueIndicator.fill({ color: 0x404040, alpha: 0.9 })
  valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
  valueIndicator.endFill()

  cell.addChild(valueIndicator)
  cell.addChild(rect)
}

const createColorCell = (cell: Container, rect: Graphics, alpha: number, cellSize: number) => {
  rect.setStrokeStyle({ width: 1, color: 0x404040 })
  rect.fill({ color: 0x404040, alpha: alpha * 1.2 })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()
  cell.addChild(rect)
}

const createColorTextCell = (cell: Container, rect: Graphics, value: number, alpha: number, cellSize: number) => {
  rect.setStrokeStyle({ width: 1, color: 0x404040 })
  rect.fill({ color: 0x404040, alpha: alpha * 1.2 })
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

const createBothCell = (cell: Container, rect: Graphics, value: number, alpha: number, cellSize: number, normalizedValue: number) => {
  rect.setStrokeStyle({ width: 1, color: 0x404040 })
  rect.fill({ color: 0x404040, alpha: alpha * 1.2 })
  rect.rect(0, 0, cellSize, cellSize)
  rect.endFill()

  const valueIndicator = new Graphics()
  valueIndicator.fill({ color: 0x404040, alpha: 0.9 })
  valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
  valueIndicator.endFill()

  cell.addChild(valueIndicator)
  cell.addChild(rect)
}

const centerContainer = (container: Container) => {
  if (!app.value) {
    console.error('App is null in centerContainer')
    return
  }
  container.x = (app.value.screen.width - container.width) / 2
  container.y = (app.value.screen.height - container.height) / 2
}

// Matrix visualization creation
const createMatrixVisualization = () => {
  if (!app.value) {
    console.error('App is null in createMatrixVisualization')
    return
  }

  matrixData.value = generateRandomMatrix(props.matrixSize)
  clearStage()

  const container = new Container()
  app.value.stage.addChild(container)

  const matrixSize = matrixData.value.length
  const cellSize = visualizationStore.config.cellSize || props.cellSize
  const padding = visualizationStore.config.padding || props.padding

  renderMatrix(matrixSize, cellSize, padding, container)
  centerContainer(container)
  setupDragHandling(matrixSize, cellSize, padding)

  // Update store with current matrix data
  matrixStore.setMatrixData(matrixData.value)
}

const determineDragDirection = (dx: number, dy: number): 'row' | 'column' => {
  return Math.abs(dx) > Math.abs(dy) ? 'column' : 'row'
}

const resetCellPositions = (cellSize: number, padding: number, matrixSize: number) => {
  rowContainers.value.forEach((rowContainer, rowIndex) => {
    rowContainer.y = rowIndex * (cellSize + padding)
    for (let col = 0; col < matrixSize; col++) {
      const cell = cellContainers.value[rowIndex][col]
      cell.x = col * (cellSize + padding)
    }
  })
}

onMounted(() => {
  setTimeout(() => {
    initializePixi()
  }, 100)
})

onUnmounted(() => {
  if (app.value) {
    app.value.destroy(true)
    app.value = null
  }
})
</script>

<template>
  <div class="pixi-matrix-container">
    <div ref="containerRef" class="canvas-container"></div>
  </div>
</template>

<style scoped>
.pixi-matrix-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.canvas-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
}
</style>
