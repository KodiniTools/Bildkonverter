<template>
  <aside class="right-sidebar">
    <div class="sidebar-section">
      <h3>Transformationen</h3>
      
      <button 
        class="transform-btn"
        :class="{ 'active': cropMode }"
        @click="$emit('toggle-crop')"
      >
        <i :class="cropMode ? 'fas fa-check' : 'fas fa-crop'"></i>
        <span>{{ cropMode ? 'Crop bestätigen' : 'Zuschneiden' }}</span>
      </button>
      
      <button 
        v-if="hasCropped"
        class="transform-btn undo-btn"
        @click="$emit('undo-crop')"
        title="Zuschnitt rückgängig machen und Original wiederherstellen"
      >
        <i class="fas fa-undo"></i>
        <span>Zuschnitt rückgängig</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  cropMode: {
    type: Boolean,
    required: true
  },
  hasCropped: {
    type: Boolean,
    required: true
  }
})

defineEmits(['toggle-crop', 'undo-crop'])
</script>

<style scoped>
.right-sidebar {
  width: 250px;
  background: var(--color-bg-secondary, #f9fafb);
  border-left: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 1.5rem;
}

.sidebar-section {
  margin-bottom: 1.5rem;
}

.sidebar-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary, #111827);
  font-weight: 600;
}

.transform-btn {
  width: 100%;
  padding: 1rem;
  background: var(--color-bg, #ffffff);
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: var(--color-text-primary, #111827);
  margin-bottom: 0.75rem;
}

.transform-btn:hover {
  border-color: var(--color-primary, #014f99);
  background: var(--color-bg-secondary, #f3f4f6);
}

.transform-btn.active {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border-color: #22c55e;
}

.transform-btn.active:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.transform-btn.undo-btn {
  border-color: #f59e0b;
  color: #f59e0b;
}

.transform-btn.undo-btn:hover {
  background: #fef3c7;
  border-color: #d97706;
  color: #d97706;
}

.transform-btn i {
  font-size: 1.2rem;
}

.transform-btn span {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

/* Dark Mode Support */
.dark-mode .right-sidebar {
  background: #1f2937;
  border-left-color: #374151;
}

.dark-mode .transform-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .transform-btn:hover {
  background: #4b5563;
}

.dark-mode .sidebar-section h3 {
  color: #f9fafb;
}
</style>
