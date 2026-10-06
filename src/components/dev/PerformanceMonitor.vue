<template>
  <div v-if="isDevelopment && isVisible" class="performance-monitor">
    <div class="monitor-header">
      <h4>
        <AppIcon name="tachometer-alt" />
        Performance Monitor
      </h4>
      <div class="monitor-actions">
        <button
          class="btn-icon"
          :title="isMinimized ? 'Expand' : 'Minimize'"
          :aria-label="isMinimized ? 'Expand' : 'Minimize'"
          @click="toggleMinimize"
        >
          <AppIcon :name="isMinimized ? 'chevron-up' : 'chevron-down'" />
        </button>
        <button class="btn-icon" title="Close" aria-label="Close" @click="isVisible = false">
          <AppIcon name="times" />
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
import { ref, onMounted, onUnmounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const isDevelopment = import.meta.env.DEV;
const isVisible = ref(true);
const isMinimized = ref(false);
const fps = ref(60);
const memoryUsage = ref(0);
const componentCount = ref(0);
const renderTime = ref(0);
const fpsCanvas = ref(null);

let fpsHistory = [];
let lastTime = performance.now();
let frameCount = 0;
let animationId = null;

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

function getFpsClass(fpsValue) {
  if (fpsValue >= 55) return 'stat-good';
  if (fpsValue >= 30) return 'stat-warning';
  return 'stat-bad';
}

function updateFps() {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    fps.value = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;

    fpsHistory.push(fps.value);
    if (fpsHistory.length > 60) {
      fpsHistory.shift();
    }

    drawGraph();
    updateMemory();
  }

  animationId = requestAnimationFrame(updateFps);
}

function updateMemory() {
  if (performance.memory) {
    memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1048576);
  }
}

function drawGraph() {
  if (!fpsCanvas.value) return;

  const ctx = fpsCanvas.value.getContext('2d');
  const width = fpsCanvas.value.width;
  const height = fpsCanvas.value.height;

  ctx.clearRect(0, 0, width, height);

  // Farben aus den Design-Tokens (wechseln mit dem Theme)
  const styles = getComputedStyle(fpsCanvas.value);
  const gridColor = styles.getPropertyValue('--ds-border').trim();
  const lineColor = styles.getPropertyValue('--ds-accent').trim();

  // Draw grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 60; i += 15) {
    const y = height - (i / 60) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw FPS line
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();

  fpsHistory.forEach((value, index) => {
    const x = (index / 60) * width;
    const y = height - (value / 60) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

onMounted(() => {
  if (isDevelopment) {
    updateFps();
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style lang="scss" scoped>
/* Schwebendes Panel (Popover-Ebene): surface-1, 1-px-Rahmen, radius-lg,
   Overlay-Schatten. Kennzahlen als Kacheln auf surface-2. */
.performance-monitor {
  position: fixed;
  bottom: var(--ds-space-6);
  right: var(--ds-space-6);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-overlay);
  z-index: 9998;
  min-width: 320px;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-2) var(--ds-space-4);
  border-bottom: var(--ds-border-width) solid var(--ds-border);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin: 0;
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);

    .app-icon {
      color: var(--ds-text-2);
    }
  }
}

.monitor-actions {
  display: flex;
  gap: var(--ds-space-1);
}

/* UiIconButton ghost, Größe sm */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  background: transparent;
  color: var(--ds-text-2);
  cursor: pointer;
  border-radius: var(--ds-radius-sm);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.monitor-body {
  padding: var(--ds-space-4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-3);
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);

  .stat-label {
    font-size: var(--ds-text-xs);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }

  .stat-value {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);

    &.stat-good {
      color: var(--ds-success);
    }

    &.stat-warning {
      color: var(--ds-warning);
    }

    &.stat-bad {
      color: var(--ds-danger);
    }
  }
}

.graph-container {
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-2);

  canvas {
    display: block;
    width: 100%;
  }
}
</style>
