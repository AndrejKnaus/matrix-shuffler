<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Application, Container, Graphics, Text, HTMLText, BitmapText } from 'pixi.js'
import { useDatasetStore, type DataRow } from '@/stores/dataset'

const props = defineProps({
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 600,
  },
  matrixSize: {
    type: Number,
    default: 10,
  },
  cellSize: {
    type: Number,
    default: 40,
  },
  padding: {
    type: Number,
    default: 2,
  },
  useRandomData: {
    type: Boolean,
    default: true,
  },
})

const containerRef = ref<HTMLDivElement | null>(null)
const app = ref<Application | null>(null)
const datasetStore = useDatasetStore()

// Matrix data structure
const matrixData = ref<number[][]>([])

const rowContainers = ref<Container[]>([])
const cellContainers = ref<Container[][]>([])

// Generate random matrix data
function generateRandomMatrix(size: number): number[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.floor(Math.random() * 100)),
  )
}
function initializePixi() {
  if (!containerRef.value) {
    console.error('Container ref is null')
    return
  }

  // Clear existing application if any
  if (app.value) {
    console.log('Destroying existing PixiJS application')
    app.value.destroy(true)
  }

  console.log('Creating new PixiJS application')
  // Create new application
  app.value = new Application()
  app.value
    .init({
      background: '#ffffff',
      width: props.width,
      height: props.height,
      antialias: true,
    })
    .then(() => {
      if (!containerRef.value || !app.value) {
        console.error('Container ref or app is null after initialization')
        return
      }
      console.log('PixiJS application initialized', {
        width: app.value.screen.width,
        height: app.value.screen.height,
      })
      containerRef.value.appendChild(app.value.canvas)
      console.log('Canvas appended to container')

      // Create matrix visualization
      createMatrixVisualization()
      //testRender() // Use test render for debugging
    })
    .catch((error) => {
      console.error('Error initializing PixiJS:', error)
    })
}

function clearStage() {
  console.log('Clearing stage')
  if (!app.value) return

  while (app.value.stage.children.length > 0) {
    const child = app.value.stage.children[0]
    app.value.stage.removeChild(child)
    child.destroy()
  }
}

// Helper function to determine drag direction
const determineDragDirection = (dx: number, dy: number): 'row' | 'column' => {
  return Math.abs(dx) > Math.abs(dy) ? 'column' : 'row'
}

// Helper function to reset cell positions
const resetCellPositions = (cellSize: number, padding: number, matrixSize: number) => {
  rowContainers.value.forEach((rowContainer, rowIndex) => {
    rowContainer.y = rowIndex * (cellSize + padding)

    // Reset cell x positions within the row
    for (let col = 0; col < matrixSize; col++) {
      const cell = cellContainers.value[rowIndex][col]
      cell.x = col * (cellSize + padding)
    }
  })
}

// Create the matrix visualization
function createMatrixVisualization() {
  if (!app.value) {
    console.error('App is null in createMatrixVisualization')
    return
  }

  console.log('Generating random matrix data')
  matrixData.value = generateRandomMatrix(props.matrixSize)
  console.log('Matrix data generated', { rows: matrixData.value.length })

  clearStage()

  // Create container
  console.log('Creating container')
  const container = new Container()
  app.value.stage.addChild(container)

  const matrixSize = matrixData.value.length
  const cellSize = props.cellSize
  const padding = props.padding
  console.log('Matrix rendering config', { matrixSize, cellSize, padding })

  // Create the matrix
  renderMatrix(matrixSize, cellSize, padding, container)

  // Center the container
  centerContainer(container)

  // Add matrix dragging functionality (both row and column)
  let isDragging = false
  let dragMode: 'row' | 'column' | null = null
  let startX = 0
  let startY = 0
  let originalRowIndex = 0
  let originalColIndex = 0
  let originalY = 0
  let originalX = 0
  let selectedRowContainer: Container | null = null
  let selectedCells: Container[] = []

  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      const cell = cellContainers.value[row][col]

      cell.on('pointerdown', (event) => {
        if (isDragging) return

        // Prevent default browser behavior to avoid text selection during drag
        event.preventDefault?.()

        startX = event.global.x
        startY = event.global.y
        originalRowIndex = cell.rowIndex
        originalColIndex = cell.colIndex
        selectedRowContainer = rowContainers.value[cell.rowIndex]
        originalY = cell.rowIndex * (cellSize + padding)
        originalX = cell.x

        isDragging = true
        dragMode = null // Will be determined on first move

        console.log(`Pointer down on cell [${row}, ${col}]  [${startX}, ${startY}]`)
        console.log(
          `Original Y: selectedRowContainer ${selectedRowContainer.y}, cell ${cell.rowIndex * (cellSize + padding)}`,
        )
        console.log(
          `Original X: selectedRowContainer ${selectedRowContainer.x}, cell ${cell.colIndex * (cellSize + padding)}  ${cell.x}`,
        )
        console.log(
          `${row}, ${col} - Original indices: row ${originalRowIndex}, col ${originalColIndex}`,
        )

        // Initialize selected cells
        selectedCells = []

        app.value!.stage.eventMode = 'static'
        app.value!.stage.hitArea = app.value!.screen

        const onPointerMove = (moveEvent: any) => {
          if (!isDragging) return

          // Handle different event types (PixiJS events vs DOM events)
          let dx, dy

          if (moveEvent.global) {
            // PixiJS event
            //console.log('PixiJS pointer move event detected')
            dx = moveEvent.global.x - startX
            dy = moveEvent.global.y - startY
          } else {
            // Fallback if we can't determine coordinates
            console.warn('Could not determine pointer coordinates', moveEvent)
            return
          }

          // Determine drag mode on first significant movement
          if (!dragMode && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragMode = determineDragDirection(dx, dy)
            console.log(`Drag mode determined: ${dragMode}`)

            // Select all cells in the row or column
            if (dragMode === 'row') {
              // Store references to all cells in this row
              // no need we have rowContainer
              /*
            for (let c = 0; c < matrixSize; c++) {
              selectedCells.push(cellContainers.value[originalRowIndex][c])
            }
            */
            } else {
              // column mode
              // Store references to all cells in this column
              for (let r = 0; r < matrixSize; r++) {
                selectedCells.push(cellContainers.value[r][originalColIndex])
              }
            }
          }

          // Update positions based on drag mode
          if (dragMode === 'row') {
            selectedRowContainer!.y = originalY + dy

            const currentRowIndex = Math.round(selectedRowContainer!.y / (cellSize + padding))

            // Only swap if the position has changed from the current originalIndex
            if (
              currentRowIndex !== originalRowIndex &&
              currentRowIndex >= 0 &&
              currentRowIndex < matrixSize
            ) {
              console.log(`Moving row from ${originalRowIndex} to position ${currentRowIndex}`)

              // Reset all rows to their correct positions except the dragged one
              rowContainers.value.forEach((container, index) => {
                if (container !== selectedRowContainer) {
                  // If we're moving down, shift rows between originalRowIndex and currentRowIndex up
                  if (
                    currentRowIndex > originalRowIndex &&
                    index > originalRowIndex &&
                    index <= currentRowIndex
                  ) {
                    container.y = (index - 1) * (cellSize + padding)
                  }
                  // If we're moving up, shift rows between currentRowIndex and originalRowIndex down
                  else if (
                    currentRowIndex < originalRowIndex &&
                    index >= currentRowIndex &&
                    index < originalRowIndex
                  ) {
                    container.y = (index + 1) * (cellSize + padding)
                  }
                  // Otherwise, keep at normal position
                  else {
                    container.y = index * (cellSize + padding)
                  }
                }
              })

              // Update row containers array
              const removedRow = rowContainers.value.splice(originalRowIndex, 1)[0]
              rowContainers.value.splice(currentRowIndex, 0, removedRow)

              // Update cell containers array
              const removedCells = cellContainers.value.splice(originalRowIndex, 1)[0]
              cellContainers.value.splice(currentRowIndex, 0, removedCells)

              // Update data matrix
              const removedData = matrixData.value.splice(originalRowIndex, 1)[0]
              matrixData.value.splice(currentRowIndex, 0, removedData)

              for (let r = 0; r < matrixSize; r++) {
                for (let c = 0; c < matrixSize; c++) {
                  const cell = cellContainers.value[r][c]
                  cell.rowIndex = r
                  cell.colIndex = c
                }
              }

              // Update index for next movement
              originalRowIndex = currentRowIndex
            }
          } else if (dragMode === 'column') {
            const newX = originalX + dx
            selectedCells.forEach((cell) => {
              cell.x = newX
            })

            const currentColIndex = Math.round(newX / (cellSize + padding))
            // Only swap if the position has changed from the current originalIndex
            if (
              currentColIndex !== originalColIndex &&
              currentColIndex >= 0 &&
              currentColIndex < matrixSize
            ) {
              console.log(`Moving column from ${originalColIndex} to position ${currentColIndex}`)

              for (let r = 0; r < matrixSize; r++) {
                // Shift cells between originalColIndex and currentColIndex
                if (currentColIndex > originalColIndex) {
                  // Moving right: shift cells left
                  for (let c = originalColIndex + 1; c <= currentColIndex; c++) {
                    cellContainers.value[r][c].x = (c - 1) * (cellSize + padding)
                    cellContainers.value[r][c].colIndex = c - 1
                  }
                } else if (currentColIndex < originalColIndex) {
                  // Moving left: shift cells right
                  for (let c = currentColIndex; c < originalColIndex; c++) {
                    cellContainers.value[r][c].x = (c + 1) * (cellSize + padding)
                    cellContainers.value[r][c].colIndex = c + 1
                  }
                }
              }

              // Reset all cells in the column to their correct positions except the dragged ones
              for (let r = 0; r < matrixSize; r++) {
                const cell = cellContainers.value[r][originalColIndex]
                if (cell !== selectedCells[0]) {
                  cell.x = originalColIndex * (cellSize + padding)
                }
              }

              // Update cell containers array
              for (let r = 0; r < matrixSize; r++) {
                const removedCell = cellContainers.value[r].splice(originalColIndex, 1)[0]
                cellContainers.value[r].splice(currentColIndex, 0, removedCell)
                removedCell.colIndex = currentColIndex
              }

              // Update data matrix
              for (let r = 0; r < matrixSize; r++) {
                const removedData = matrixData.value[r].splice(originalColIndex, 1)[0]
                matrixData.value[r].splice(currentColIndex, 0, removedData)
              }

              // Update index for next movement
              originalColIndex = currentColIndex
            }
          }
        }
        // Clean up function to be called when drag ends
        const endDrag = () => {
          if (!isDragging) return

          isDragging = false
          dragMode = null
          selectedRowContainer = null
          selectedCells = []

          // Remove all event listeners
          document.removeEventListener('mousemove', onPointerMove)
          document.removeEventListener('touchmove', onPointerMove)
          app.value?.stage.off('pointermove', onPointerMove)
          app.value?.stage.off('pointerup', onPointerUp)
          app.value?.stage.off('pointerupoutside', onPointerUp)
          document.removeEventListener('mouseup', documentMouseUp)
          document.removeEventListener('touchend', documentMouseUp)

          // Make sure to reset positions correctly
          resetCellPositions(cellSize, padding, matrixSize)

          console.log('Drag ended')
        }

        // Handle pointerup on the stage
        const onPointerUp = () => {
          endDrag()
        }

        // Fallback handler for document-level mouse/touch events
        const documentMouseUp = () => {
          endDrag()
        }

        // Add both PixiJS and document-level event listeners for better reliability
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

  /*
  rowContainers.value.forEach((rowContainer) => {
    rowContainer.eventMode = 'dynamic'
    rowContainer.cursor = 'pointer'

    let startY = 0
    let originalY = 0
    let originalIndex = 0
    let hasSwapped = false

    rowContainer.on('pointerdown', (event) => {
      startY = event.global.y
      originalY = rowContainer.y
      originalIndex = rowContainers.value.indexOf(rowContainer)
      hasSwapped = false

      console.log(`Pointer down on row ${originalIndex}`)

      const onPointerMove = (moveEvent: any) => {
        const dy = moveEvent.global.y - startY
        rowContainer.y = originalY + dy

        const threshold = (cellSize + padding) / 2

        // Calculate the current position based on the y coordinate
        const currentPosition = Math.round(rowContainer.y / (cellSize + padding))

        // Only swap if the position has changed from the current originalIndex
        if (
          currentPosition !== originalIndex &&
          currentPosition >= 0 &&
          currentPosition < matrixSize
        ) {
          console.log(`Moving row from ${originalIndex} to position ${currentPosition}`)

          // Reset all rows to their correct positions except the dragged one
          rowContainers.value.forEach((container, index) => {
            if (container !== rowContainer) {
              // If we're moving down, shift rows between originalIndex and currentPosition up
              if (
                currentPosition > originalIndex &&
                index > originalIndex &&
                index <= currentPosition
              ) {
                container.y = (index - 1) * (cellSize + padding)
              }
              // If we're moving up, shift rows between currentPosition and originalIndex down
              else if (
                currentPosition < originalIndex &&
                index >= currentPosition &&
                index < originalIndex
              ) {
                container.y = (index + 1) * (cellSize + padding)
              }
              // Otherwise, keep at normal position
              else {
                container.y = index * (cellSize + padding)
              }
            }
          })

          // Update row containers array by removing and inserting at new position
          const removedRow = rowContainers.value.splice(originalIndex, 1)[0]
          rowContainers.value.splice(currentPosition, 0, removedRow)

          // Also update the data matrix
          const removedData = matrixData.value.splice(originalIndex, 1)[0]
          matrixData.value.splice(currentPosition, 0, removedData)

          // Update originalIndex for next movement
          originalIndex = currentPosition
        }
      }

      // Clean up function to be called when drag ends
      const endDrag = () => {
        rowContainer.off('pointermove', onPointerMove)
        // Ensure the row is at its correct final position
        rowContainer.y = rowContainers.value.indexOf(rowContainer) * (cellSize + padding)
        console.log(`Drag ended for row at position ${rowContainers.value.indexOf(rowContainer)}`)

        // Remove all event listeners
        app.value?.stage.off('pointerup', onPointerUp)
        app.value?.stage.off('pointerupoutside', onPointerUp)
        document.removeEventListener('mouseup', documentMouseUp)
        document.removeEventListener('touchend', documentMouseUp)
      }

      // Handle pointerup on the stage
      const onPointerUp = () => {
        endDrag()
      }

      // Fallback handler for document-level mouse/touch events
      const documentMouseUp = () => {
        endDrag()
      }

      // Add event listeners
      rowContainer.on('pointermove', onPointerMove)
      app.value?.stage.on('pointerup', onPointerUp)
      app.value?.stage.on('pointerupoutside', onPointerUp) // Add this to handle releasing outside the stage

      // Add document-level fallback event listeners
      document.addEventListener('mouseup', documentMouseUp)
      document.addEventListener('touchend', documentMouseUp)
    })
  })
*/
}

function renderMatrix(matrixSize: number, cellSize: number, padding: number, container: Container) {
  for (let row = 0; row < matrixSize; row++) {
    const rowContainer = new Container()
    rowContainers.value[row] = rowContainer
    cellContainers.value[row] = []

    for (let col = 0; col < matrixData.value[row].length; col++) {
      const value = matrixData.value[row][col]

      const cell = new Container()
      cell.rowIndex = row
      cell.colIndex = col

      const rect = new Graphics()

      // Color intensity based on value
      const normalizedValue = value / 100 // Assuming values are between 0-100
      const alpha = 0.2 + normalizedValue * 0.8 // Scale from 0.2 to 1.0

      const enableCircleEncoding: 'circle' | 'color' | 'both' | 'color-text' = 'color'

      if (enableCircleEncoding === 'circle') {
        rect.setStrokeStyle({ width: 1, color: 0x007acc })
        rect.fill({ color: 0xfff, alpha: 0 })
        rect.rect(0, 0, cellSize, cellSize)
        rect.endFill() // seems to be necessary to finalize the fill
        const valueIndicator = new Graphics()
        valueIndicator.fill({ color: 0x007acc, alpha: 0.8 })
        valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
        valueIndicator.endFill()
        cell.addChild(valueIndicator)
        cell.addChild(rect)
      } else if (enableCircleEncoding === 'color') {
        rect.setStrokeStyle({ width: 1, color: 0x007acc })
        rect.fill({ color: 0x007acc, alpha: alpha })
        rect.rect(0, 0, cellSize, cellSize)
        rect.endFill() // seems to be necessary to finalize the fill
        cell.addChild(rect)
      } else if (enableCircleEncoding === 'color-text') {
        rect.setStrokeStyle({ width: 1, color: 0x007acc })
        rect.fill({ color: 0x007acc, alpha: alpha })
        rect.rect(0, 0, cellSize, cellSize)
        rect.endFill() // seems to be necessary to finalize the fill
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
      } else if (enableCircleEncoding === 'both') {
        rect.setStrokeStyle({ width: 1, color: 0x007acc })
        rect.fill({ color: 0x007acc, alpha: alpha })
        rect.rect(0, 0, cellSize, cellSize)
        rect.endFill() // seems to be necessary to finalize the fill
        const valueIndicator = new Graphics()
        valueIndicator.fill({ color: 0x007acc, alpha: 0.8 })
        valueIndicator.circle(cellSize / 2, cellSize / 2, normalizedValue * (cellSize / 3))
        valueIndicator.endFill()
        cell.addChild(valueIndicator)
        cell.addChild(rect)
      }

      cell.x = col * (cellSize + padding)
      rowContainer.addChild(cell)

      cellContainers.value[row][col] = cell

      // Make the cell interactive
      cell.eventMode = 'dynamic'
      cell.cursor = 'pointer'
    }

    rowContainer.y = row * (cellSize + padding)
    container.addChild(rowContainer)
  }
}

function centerContainer(container: Container) {
  if (!app.value) {
    console.error('App is null in centerContainer')
    return
  }
  container.x = (app.value.screen.width - container.width) / 2
  container.y = (app.value.screen.height - container.height) / 2
}

// Add this function for simple test rendering
function testRender() {
  if (!app.value) return

  console.log('Doing a simple test render')

  // Clear the stage
  while (app.value.stage.children.length > 0) {
    const child = app.value.stage.children[0]
    app.value.stage.removeChild(child)
    child.destroy()
  }

  // Create a simple red rectangle to test rendering
  const graphics = new Graphics()
  graphics.fill({ color: 0xff0000 })
  graphics.rect(100, 100, 200, 200)
  graphics.endFill()

  app.value.stage.addChild(graphics)
  console.log('Test rectangle added to stage')
}

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted')
  // Add a small delay to ensure DOM is ready
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
