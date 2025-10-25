<template>
  <div v-if="isDevelopment && isVisible" class="performance-monitor">
    <div class="monitor-header">
      <h4>
        <i class="fas fa-tachometer-alt"></i>
        Performance Monitor
      </h4>
      <div class="monitor-actions">
        <button @click="toggleMinimize" class="btn-icon" :title="isMinimized ? 'Expand' : 'Minimize'">
          <i :class="isMinimized ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </button>
        <button @click="isVisible = false" class="btn-icon" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div v-if="!isMinimized" class="monitor-body">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">FPS</span>
          <span class="stat-value" :class="getFpsClass(fps)">{{ fps }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Memory</span>
          <span class="stat-value">{{ memoryUsage }} MB</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Components</span>
          <span class="stat-value">{{ componentCount }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Render Time</span>
          <span class="stat-value">{{ renderTime }} ms</span>
        </div>
      </div>

      <div class="graph-container">
        <canvas ref="fpsCanvas" width="300" height="60"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const isDevelopment = import.meta.env.DEV
const isVisible = ref(true)
const isMinimized = ref(false)
const fps = ref(60)
const memoryUsage = ref(0)
const componentCount = ref(0)
const renderTime = ref(0)
const fpsCanvas = ref(null)

let fpsHistory = []
let lastTime = performance.now()
let frameCount = 0
let animationId = null

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function getFpsClass(fpsValue) {
  if (fpsValue >= 55) return 'stat-good'
  if (fpsValue >= 30) return 'stat-warning'
  return 'stat-bad'
}

function updateFps() {
  frameCount++
  const currentTime = performance.now()
  const elapsed = currentTime - lastTime

  if (elapsed >= 1000) {
    fps.value = Math.round((frameCount * 1000) / elapsed)
    frameCount = 0
    lastTime = currentTime

    fpsHistory.push(fps.value)
    if (fpsHistory.length > 60) {
      fpsHistory.shift()
    }

    drawGraph()
    updateMemory()
  }

  animationId = requestAnimationFrame(updateFps)
}

function updateMemory() {
  if (performance.memory) {
    memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1048576)
  }
}

function drawGraph() {
  if (!fpsCanvas.value) return

  const ctx = fpsCanvas.value.getContext('2d')
  const width = fpsCanvas.value.width
  const height = fpsCanvas.value.height

  ctx.clearRect(0, 0, width, height)

  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 60; i += 15) {
    const y = height - (i / 60) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw FPS line
  ctx.strokeStyle = '#007bff'
  ctx.lineWidth = 2
  ctx.beginPath()

  fpsHistory.forEach((value, index) => {
    const x = (index / 60) * width
    const y = height - (value / 60) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

onMounted(() => {
  if (isDevelopment) {
    updateFps()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style lang="scss" scoped>
.performance-monitor {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 9998;
  min-width: 320px;
  backdrop-filter: blur(10px);
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;

    i {
      color: #007bff;
    }
  }
}

.monitor-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-icon {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
}

.monitor-body {
  padding: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xs);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-sm);

  .stat-label {
    font-size: var(--font-size-xs);
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 2px;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    
    &.stat-good {
      color: #28a745;
    }
    
    &.stat-warning {
      color: #ffc107;
    }
    
    &.stat-bad {
      color: #dc3545;
    }
  }
}

.graph-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs);

  canvas {
    display: block;
    width: 100%;
  }
}
</style>
