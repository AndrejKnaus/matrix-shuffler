<template>
  <div class="resizable-drawer" :style="{ width: width + 'px' }" ref="drawer">
    <slot />
    <div class="resizer" @mousedown="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const width = ref(300)
const isResizing = ref(false)

const drawer = ref<HTMLElement>()

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return
  width.value = Math.min(Math.max(e.clientX, 200), 600)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  position: relative;
  min-width: 200px;
  max-width: 600px;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid #ccc;
}

.resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
  background: transparent;
}
</style>
