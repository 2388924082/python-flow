<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Edge, Connection } from '@vue-flow/core'
import DynamicNode from './nodes/DynamicNode.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import type { NodeData, Position as PosType, PluginDefinition, CategoryDefinition } from '../types/api'

defineProps<{
  nodes?: any[]
  edges?: Edge[]
  selectedNodeId?: string | null
  plugins?: PluginDefinition[]
  categories?: CategoryDefinition[]
  showMinimap?: boolean
}>()

const emit = defineEmits<{
  'edges-change': [changes: unknown[]]
  'select-node': [nodeId: string | null]
  'add-node': [data: NodeData, position: PosType]
  'position-change': [nodeId: string, position: PosType]
  'delete-node': [nodeId: string]
  'delete-edge': [edgeId: string]
  'update-node-config': [nodeId: string, key: string, value: unknown]
  'connect': [connection: { source: string; target: string }]
}>()

const { project } = useVueFlow()

const nodeTypes = {
  dynamic: DynamicNode as any
}

const onNodeClick = (_event: any) => {
  emit('select-node', _event.node.id)
}

const onPaneClick = () => {
  emit('select-node', null)
}

const onConnect = (connection: Connection) => {
  if (connection.source && connection.target) {
    emit('connect', { source: connection.source, target: connection.target })
  }
}

const onNodeDragStop = (event: any) => {
  if (event.node) {
    emit('position-change', event.node.id, event.node.position)
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()

  const pluginId = event.dataTransfer?.getData('application/vueflow')
  if (!pluginId) return

  const vueFlowPane = document.querySelector('.vue-flow__pane')
  if (!vueFlowPane) return

  const bounds = vueFlowPane.getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  emit('add-node', { id: pluginId } as NodeData, position)
}
</script>

<template>
  <div class="workflow-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      :nodes="nodes || []"
      :edges="edges || []"
      :node-types="nodeTypes"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="2"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @connect="onConnect"
      @node-drag-stop="onNodeDragStop"
    >
      <Background />
      <Controls />
      <MiniMap v-if="showMinimap" />
      <FloatingToolbar
        v-if="plugins && categories"
        :plugins="plugins"
        :categories="categories"
        class="floating-toolbar-in-canvas"
      />
    </VueFlow>
  </div>
</template>

<style scoped>
.workflow-canvas {
  flex: 1;
  height: 100%;
  background: var(--bg-primary);
  position: relative;
}

.vue-flow {
  --vf-node-bg: var(--bg-secondary);
  --vf-node-text: var(--text-primary);
  --vf-connection-path: var(--accent-color);
  --vf-handle: var(--accent-color);
}

.floating-toolbar-in-canvas {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}
</style>
