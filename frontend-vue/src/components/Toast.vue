<script setup lang="ts">
import type { ToastType } from '../composables/useToast'

defineProps<{
  message: string
  type: ToastType
}>()

defineEmits<{
  close: []
}>()

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success': return '✓'
    case 'error': return '✕'
    case 'info': return 'ℹ'
  }
}
</script>

<template>
  <div class="toast" :class="type">
    <span class="toast-icon">{{ getIcon(type) }}</span>
    <span class="toast-message">{{ message }}</span>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast.success {
  border-color: var(--success-color);
}

.toast.success .toast-icon {
  color: var(--success-color);
}

.toast.error {
  border-color: var(--error-color);
}

.toast.error .toast-icon {
  color: var(--error-color);
}

.toast.info {
  border-color: var(--accent-color);
}

.toast.info .toast-icon {
  color: var(--accent-color);
}

.toast-icon {
  font-size: 14px;
  font-weight: bold;
}
</style>