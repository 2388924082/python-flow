<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Edge, Connection } from '@vue-flow/core'
import DynamicNode from './nodes/DynamicNode.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import CanvasModeToggle from './CanvasModeToggle.vue'
import ContextMenu from './ContextMenu.vue'
import type { NodeData, Position as PosType, PluginDefinition, CategoryDefinition } from '../types/api'

interface MenuItem {
  label: string
  icon?: string
  action?: () => void
  danger?: boolean
  children?: MenuItem[]
}

const props = defineProps<{
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
  'connect': [connection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }]
}>()

const { project } = useVueFlow()

const nodeTypes = {
  dynamic: markRaw(DynamicNode) as any
}

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20
  }
}

const isPanMode = ref(false)
const selectedEdgeId = ref<string | null>(null)

const onModeChange = (mode: 'select' | 'pan') => {
  isPanMode.value = mode === 'pan'
}

const contextMenu = ref<{
  visible: boolean
  x: number
  y: number
  items: MenuItem[]
}>({
  visible: false,
  x: 0,
  y: 0,
  items: []
})

const getPluginsByCategory = (categoryId: string) => {
  if (!props.plugins) return []
  return props.plugins.filter(p => p.category === categoryId)
}

const sortedCategories = computed(() => {
  if (!props.categories) return []
  return [...props.categories].sort((a, b) => a.order - b.order)
})

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  const pluginItems: MenuItem[] = sortedCategories.value.map(cat => ({
    label: cat.name,
    icon: cat.icon,
    children: getPluginsByCategory(cat.id).map(p => ({
      label: p.name,
      icon: p.icon,
      action: () => {
        const vueFlowPane = document.querySelector('.vue-flow__pane')
        if (vueFlowPane) {
          const bounds = vueFlowPane.getBoundingClientRect()
          const position = project({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
          })
          emit('add-node', { id: p.id } as NodeData, position)
        }
      }
    }))
  }))

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        label: '新建节点',
        icon: '🆕',
        children: pluginItems
      },
      {
        label: '粘贴',
        icon: '📋',
        action: () => {
          console.log('[WorkflowCanvas] paste')
        }
      }
    ]
  }
}

const onNodeContextMenu = (event: any) => {
  event.event.preventDefault()

  contextMenu.value = {
    visible: true,
    x: event.event.clientX,
    y: event.event.clientY,
    items: [
      {
        label: '删除',
        icon: '🗑️',
        danger: true,
        action: () => {
          emit('delete-node', event.node.id)
        }
      },
      {
        label: '复制',
        icon: '📋',
        action: () => {
          console.log('[WorkflowCanvas] copy node:', event.node.id)
        }
      }
    ]
  }
}

const onEdgeContextMenu = (event: any) => {
  event.event.preventDefault()
  selectedEdgeId.value = event.edge.id

  contextMenu.value = {
    visible: true,
    x: event.event.clientX,
    y: event.event.clientY,
    items: [
      {
        label: '删除',
        icon: '🗑️',
        danger: true,
        action: () => {
          emit('delete-edge', event.edge.id)
          selectedEdgeId.value = null
        }
      }
    ]
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const handleMenuItemClick = (item: MenuItem) => {
  if (item.action) {
    item.action()
  }
  closeContextMenu()
}

const onNodeClick = (_event: any) => {
  emit('select-node', _event.node.id)
}

const onPaneClick = () => {
  emit('select-node', null)
}

const onConnect = (connection: Connection) => {
  if (connection.source && connection.target) {
    emit('connect', {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle
    })
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
      :default-edge-options="defaultEdgeOptions"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :pan-on-drag="isPanMode"
      :selection-on-drag="!isPanMode"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @pane-context-menu="onPaneContextMenu"
      @node-context-menu="onNodeContextMenu"
      @edge-context-menu="onEdgeContextMenu"
      @connect="onConnect"
      @node-drag-stop="onNodeDragStop"
    >
      <Background />
      <Controls />
      <MiniMap v-if="showMinimap" pannable zoomable />
      <FloatingToolbar
        v-if="plugins && categories"
        :plugins="plugins"
        :categories="categories"
        class="floating-toolbar-in-canvas"
      />
      <CanvasModeToggle @mode-change="onModeChange" />
    </VueFlow>
    <ContextMenu
      v-if="contextMenu.visible"
      :items="contextMenu.items"
      mode="scroll"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px', position: 'fixed' }"
      @close="closeContextMenu"
      @item-click="handleMenuItemClick"
    />
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
