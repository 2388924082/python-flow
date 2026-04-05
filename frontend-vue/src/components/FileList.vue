<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  workflowList: string[]
  activeWorkflow: string | null
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  select: [name: string]
  refresh: []
  toggleCollapse: []
  rename: [oldName: string, newName: string]
  delete: [name: string]
}>()

const contextMenu = ref<{ visible: boolean; x: number; y: number; name: string }>({
  visible: false,
  x: 0,
  y: 0,
  name: ''
})

const renameDialog = ref<{ visible: boolean; oldName: string; newName: string }>({
  visible: false,
  oldName: '',
  newName: ''
})

const deleteDialog = ref<{ visible: boolean; name: string }>({
  visible: false,
  name: ''
})

const showContextMenu = (e: MouseEvent, name: string) => {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    name
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
}

const handleRename = () => {
  renameDialog.value = {
    visible: true,
    oldName: contextMenu.value.name,
    newName: contextMenu.value.name
  }
  hideContextMenu()
}

const confirmRename = () => {
  if (renameDialog.value.newName && renameDialog.value.newName !== renameDialog.value.oldName) {
    emit('rename', renameDialog.value.oldName, renameDialog.value.newName)
  }
  renameDialog.value.visible = false
}

const cancelRename = () => {
  renameDialog.value.visible = false
}

const handleDelete = () => {
  deleteDialog.value = {
    visible: true,
    name: contextMenu.value.name
  }
  hideContextMenu()
}

const confirmDelete = () => {
  emit('delete', deleteDialog.value.name)
  deleteDialog.value.visible = false
}

const cancelDelete = () => {
  deleteDialog.value.visible = false
}
</script>

<template>
  <div class="file-list" v-show="!isCollapsed" @click="hideContextMenu">
    <div class="file-list-header">
      <span>文件列表</span>
      <button class="collapse-btn" @click="emit('toggleCollapse')">
        ◀
      </button>
    </div>
    <div class="file-list-content">
      <div
        v-for="name in workflowList"
        :key="name"
        class="file-item"
        :class="{ active: name === activeWorkflow }"
        @click="emit('select', name)"
        @contextmenu="showContextMenu($event, name)"
      >
        📄 {{ name }}
      </div>
      <div v-if="workflowList.length === 0" class="empty-message">
        暂无工作流
      </div>
    </div>
    <div v-if="contextMenu.visible" class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
      <div class="context-menu-item" @click="handleRename">重命名</div>
      <div class="context-menu-item danger" @click="handleDelete">删除</div>
    </div>
    <div v-if="renameDialog.visible" class="rename-dialog-overlay" @click.self="cancelRename">
      <div class="rename-dialog">
        <div class="rename-dialog-title">重命名</div>
        <input
          v-model="renameDialog.newName"
          class="rename-dialog-input"
          @keyup.enter="confirmRename"
          @keyup.esc="cancelRename"
          autofocus
        />
        <div class="rename-dialog-actions">
          <button class="btn-cancel" @click="cancelRename">取消</button>
          <button class="btn-confirm" @click="confirmRename">确定</button>
        </div>
      </div>
    </div>
    <div v-if="deleteDialog.visible" class="rename-dialog-overlay" @click.self="cancelDelete">
      <div class="rename-dialog">
        <div class="rename-dialog-title">确认删除</div>
        <div class="delete-dialog-message">确定删除 "{{ deleteDialog.name }}" 吗？此操作无法撤销。</div>
        <div class="rename-dialog-actions">
          <button class="btn-cancel" @click="cancelDelete">取消</button>
          <button class="btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-list {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

.file-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
}

.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-tertiary);
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

.file-item {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition-fast);
}

.file-item:hover {
  background: var(--bg-tertiary);
}

.file-item.active {
  background: var(--accent-color);
  color: white;
}

.empty-message {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.context-menu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xs) 0;
  z-index: 1000;
  min-width: 100px;
}

.context-menu-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: 13px;
  transition: background var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--bg-tertiary);
}

.context-menu-item.danger {
  color: var(--color-error);
}

.context-menu-item.danger:hover {
  background: rgba(244, 67, 54, 0.1);
}

.rename-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.rename-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  min-width: 280px;
  box-shadow: var(--shadow-lg);
}

.rename-dialog-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: var(--spacing-md);
}

.rename-dialog-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.rename-dialog-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.rename-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.btn-cancel,
.btn-confirm {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-primary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
}

.btn-confirm:hover {
  opacity: 0.9;
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover {
  opacity: 0.9;
}

.delete-dialog-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.5;
}
</style>
