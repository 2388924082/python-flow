<script setup lang="ts">
import { computed, inject } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'

interface ConfigField {
  key: string
  name: string
  type: string
  default?: unknown
  options?: string[]
}

interface Props {
  id: string
  data: {
    name?: string
    icon?: string
    config?: ConfigField[]
    inputs?: Array<{ key: string; name: string }>
    outputs?: Array<{ key: string; name: string }>
    configValues?: Record<string, unknown>
  }
  selected?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-config': [key: string, value: unknown]
}>()

const deleteNode = inject<(nodeId: string) => void>('deleteNode')

const configFields = computed(() => props.data.config || [])

const getFieldComponent = (field: ConfigField) => {
  switch (field.type) {
    case 'text':
      return 'textarea'
    case 'boolean':
      return 'input'
    case 'select':
      return 'select'
    default:
      return 'input'
  }
}

const getFieldType = (field: ConfigField) => {
  if (field.type === 'number') return 'number'
  if (field.type === 'boolean') return 'checkbox'
  return 'text'
}

const getFieldValue = (key: string) => {
  return props.data.configValues?.[key] ?? ''
}

const onFieldChange = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  let value: unknown = target.value

  const field = props.data.config?.find((f) => f.key === key)
  if (field?.type === 'number') {
    value = parseFloat(target.value) || 0
  } else if (field?.type === 'boolean') {
    value = (target as HTMLInputElement).checked
  }

  emit('update-config', key, value)
}

const handleDelete = () => {
  if (deleteNode && props.id) {
    deleteNode(props.id)
  }
}
</script>

<template>
  <div class="dynamic-node" :class="{ selected }">
    <div class="node-header">
      <span class="node-icon">{{ data.icon }}</span>
      <span class="node-name">{{ data.name }}</span>
      <button class="menu-btn" @click.stop>⋮</button>
    </div>

    <div class="node-body">
      <div
        v-for="input in data.inputs"
        :key="input.key"
        class="input-handle-wrapper"
      >
        <Handle
          type="target"
          :position="Position.Left"
          :id="input.key"
          class="handle"
        />
        <span class="handle-label">{{ input.name }}</span>
      </div>

      <div class="config-fields">
        <div
          v-for="field in configFields"
          :key="field.key"
          class="config-field"
        >
          <label class="field-label">{{ field.name }}</label>
          <component
            :is="getFieldComponent(field)"
            :type="getFieldType(field)"
            :value="getFieldValue(field.key)"
            :checked="getFieldValue(field.key)"
            class="field-input"
            @change="onFieldChange(field.key, $event)"
            @input="onFieldChange(field.key, $event)"
            @mousedown.stop
          >
            <template v-if="field.type === 'select' && field.options">
              <option
                v-for="option in field.options"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </template>
          </component>
        </div>
      </div>

      <div
        v-for="output in data.outputs"
        :key="output.key"
        class="output-handle-wrapper"
      >
        <span class="handle-label">{{ output.name }}</span>
        <Handle
          type="source"
          :position="Position.Right"
          :id="output.key"
          class="handle"
        />
      </div>
    </div>

    <div class="node-footer">
      <button class="btn-action btn-execute" @click.stop>▶ 执行</button>
      <button class="btn-action btn-delete" @click.stop="handleDelete">🗑</button>
    </div>

    <NodeToolbar v-if="selected && id" :node-id="id" />
  </div>
</template>

<style scoped>
.dynamic-node {
  min-width: 150px;
  max-width: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-size: 11px;
}

.dynamic-node.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(77, 124, 254, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.node-icon {
  font-size: 16px;
}

.node-name {
  flex: 1;
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-btn {
  width: 18px;
  height: 18px;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.menu-btn:hover {
  background: var(--bg-tertiary);
}

.node-body {
  padding: var(--spacing-sm);
  position: relative;
}

.input-handle-wrapper,
.output-handle-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.handle-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.handle {
  width: 8px !important;
  height: 8px !important;
  background: var(--accent-color) !important;
  border: none !important;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.field-input {
  width: 100%;
  padding: 3px 6px;
  font-size: 11px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.field-input:focus {
  border-color: var(--accent-color);
  outline: none;
}

textarea.field-input {
  resize: vertical;
  min-height: 40px;
}

input[type="checkbox"] {
  width: auto;
  accent-color: var(--accent-color);
}

.node-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-top: 1px solid var(--border-color);
}

.btn-action {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 12px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.btn-execute {
  background: var(--accent-color);
  color: white;
}

.btn-execute:hover {
  background: var(--accent-hover);
}

.btn-delete {
  color: var(--text-secondary);
}

.btn-delete:hover {
  background: var(--bg-tertiary);
  color: var(--error-color);
}
</style>
