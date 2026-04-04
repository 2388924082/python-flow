<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  initialName?: string
}>()

const emit = defineEmits<{
  confirm: [name: string]
  cancel: []
}>()

const inputName = ref(props.initialName || '')

watch(() => props.initialName, (val) => {
  inputName.value = val || ''
})

const handleConfirm = () => {
  if (inputName.value.trim()) {
    emit('confirm', inputName.value.trim())
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleConfirm()
  } else if (e.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-content">
        <div class="modal-header">保存工作流</div>
        <div class="modal-body">
          <input
            v-model="inputName"
            type="text"
            class="modal-input"
            placeholder="请输入工作流名称"
            @keydown="handleKeydown"
            autofocus
          />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="emit('cancel')">取消</button>
          <button class="btn btn-primary" @click="handleConfirm">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  min-width: 300px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: var(--spacing-md);
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: var(--spacing-md);
}

.modal-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.modal-footer {
  padding: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
}
</style>
