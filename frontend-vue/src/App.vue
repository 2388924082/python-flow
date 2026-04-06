<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import TopToolbar from './components/TopToolbar.vue'
import FileList from './components/FileList.vue'
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import BottomPanel from './components/BottomPanel.vue'
import SaveDialog from './components/SaveDialog.vue'
import ToastContainer from './components/ToastContainer.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import type { PluginDefinition, CategoryDefinition, Position } from './types/api'
import type { NodeItem, EdgeItem } from './types/internal'
import { getNodes, listWorkflows, getCategories, saveWorkflow, loadWorkflow as loadWorkflowApi, executeWorkflow, renameWorkflow, deleteWorkflow } from './services/api'
import { useToast } from './composables/useToast'
import { useLog } from './composables/useLog'

const { logs, addLog, clearLogs } = useLog()
const toast = useToast()
provide('toast', toast)

const plugins = ref<PluginDefinition[]>([])
const categories = ref<CategoryDefinition[]>([])
const workflowList = ref<string[]>([])
const nodes = ref<NodeItem[]>([])
const edges = ref<EdgeItem[]>([])
const selectedNodeId = ref<string | null>(null)
const currentWorkflow = ref<string | null>(null)
const showSaveDialog = ref(false)
const currentTaskId = ref<string | null>(null)
const fileListWidth = ref(200)
const fileListCollapsed = ref(false)
const bottomPanelHeight = ref(150)
const bottomPanelCollapsed = ref(false)
const showMinimap = ref(false)
const isResizingH = ref(false)
const isResizingV = ref(false)

const startResizeH = (_e: MouseEvent) => {
  isResizingH.value = true
  document.addEventListener('mousemove', handleResizeH)
  document.addEventListener('mouseup', stopResizeH)
}
const handleResizeH = (e: MouseEvent) => {
  if (isResizingH.value) {
    fileListWidth.value = Math.max(120, Math.min(400, e.clientX))
  }
}
const stopResizeH = () => {
  isResizingH.value = false
  document.removeEventListener('mousemove', handleResizeH)
  document.removeEventListener('mouseup', stopResizeH)
}

const startResizeV = (_e: MouseEvent) => {
  isResizingV.value = true
  document.addEventListener('mousemove', handleResizeV)
  document.addEventListener('mouseup', stopResizeV)
}
const handleResizeV = (e: MouseEvent) => {
  if (isResizingV.value) {
    const container = document.querySelector('.canvas-area') as HTMLElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const newHeight = Math.max(80, Math.min(400, rect.bottom - e.clientY))
      bottomPanelHeight.value = newHeight
    }
  }
}
const stopResizeV = () => {
  isResizingV.value = false
  document.removeEventListener('mousemove', handleResizeV)
  document.removeEventListener('mouseup', stopResizeV)
}

const handleAddNode = (data: { id: string }, position: Position) => {
  const id = `node_${Date.now()}`
  const plugin = plugins.value.find(p => p.id === data.id)
  if (!plugin) {
    addLog(`Plugin not found: ${data.id}`, 'error')
    return
  }

  const newNode: NodeItem = {
    id,
    type: 'dynamic',
    position,
    data: {
      ...plugin,
      configValues: plugin.config.reduce((acc: Record<string, unknown>, field: any) => {
        acc[field.key] = field.default
        return acc
      }, {})
    }
  }
  nodes.value = [...nodes.value, newNode]
  addLog(`Added node: ${plugin.name}`, 'info')
}

const handleSelectNode = (nodeId: string | null) => {
  selectedNodeId.value = nodeId
}

const handleDeleteNode = (nodeId: string) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = null
  }
  addLog(`Deleted node: ${nodeId}`, 'info')
}

const handleUpdateNodeConfig = (nodeId: string, key: string, value: unknown) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data.configValues[key] = value
    addLog(`Updated ${node.data.name}: ${key} = ${value}`, 'debug')
  }
}

const handleConnect = (connection: { source: string; target: string }) => {
  const id = `edge_${Date.now()}`
  edges.value.push({
    id,
    source: connection.source,
    target: connection.target
  })
  addLog(`Connected ${connection.source} -> ${connection.target}`, 'info')
}

provide('deleteNode', handleDeleteNode)

const handleSave = async () => {
  showSaveDialog.value = true
}

const handleSaveConfirm = async (name: string) => {
  showSaveDialog.value = false
  currentWorkflow.value = name
  const workflow = {
    name: currentWorkflow.value,
    version: '1.0',
    nodes: nodes.value.map(n => ({
      id: n.id,
      type: n.data.id || n.type,
      name: n.data.name,
      icon: n.data.icon,
      category: n.data.category,
      position: n.position,
      config: n.data.config,
      inputs: n.data.inputs,
      outputs: n.data.outputs,
      configValues: n.data.configValues
    })),
    edges: edges.value.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || '',
      targetHandle: e.targetHandle || ''
    }))
  }
  try {
    await saveWorkflow(currentWorkflow.value, workflow as any)
    addLog(`Saved workflow: ${currentWorkflow.value}`, 'info')
    const workflows = await listWorkflows()
    workflowList.value = workflows
  } catch (e) {
    addLog(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleSaveCancel = () => {
  showSaveDialog.value = false
}

const handleLoad = async (name: string) => {
  try {
    const workflow = await loadWorkflowApi(name)
    currentWorkflow.value = name

    const loadedNodes = workflow.nodes.map((n: any) => {
      const configValues = n.configValues || {}
      const plugin = plugins.value.find(p => p.id === n.type || p.name === n.name)
      return {
        id: n.id,
        type: 'dynamic',
        position: n.position || { x: 0, y: 0 },
        data: {
          id: n.id,
          name: n.name,
          icon: n.icon || (plugin?.icon || '📦'),
          category: n.category || (plugin?.category || ''),
          type: n.type,
          config: n.config || (plugin?.config || []),
          inputs: n.inputs || (plugin?.inputs || []),
          outputs: n.outputs || (plugin?.outputs || []),
          configValues: configValues
        }
      }
    })

    const loadedEdges = (workflow.edges || []).map((e: any) => ({
      id: e.id || `edge_${Date.now()}`,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null
    }))

    nodes.value = loadedNodes
    edges.value = loadedEdges
    addLog(`Loaded workflow: ${name}`, 'info')
  } catch (e) {
    addLog(`Failed to load: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleNew = () => {
  currentWorkflow.value = null
  nodes.value = []
  edges.value = []
  addLog('Created new workflow', 'info')
}

const handleLoadData = async () => {
  try {
    const [nodesData, categoriesData, workflows] = await Promise.all([
      getNodes(),
      getCategories(),
      listWorkflows()
    ])
    plugins.value = nodesData
    categories.value = categoriesData
    workflowList.value = workflows
    addLog(`Loaded ${nodesData.length} nodes and ${workflows.length} workflows`, 'info')
  } catch (e) {
    addLog(`Failed to load data: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleRename = async (oldName: string, newName: string) => {
  try {
    await renameWorkflow(oldName, newName)
    if (currentWorkflow.value === oldName) {
      currentWorkflow.value = newName
    }
    await handleLoadData()
    addLog(`Renamed "${oldName}" to "${newName}"`, 'info')
  } catch (e) {
    addLog(`Rename failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleDelete = async (name: string) => {
  try {
    await deleteWorkflow(name)
    if (currentWorkflow.value === name) {
      currentWorkflow.value = null
      nodes.value = []
      edges.value = []
    }
    await handleLoadData()
    addLog(`Deleted "${name}"`, 'info')
  } catch (e) {
    addLog(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

onMounted(async () => {
  handleLoadData()
  try {
    const res = await fetch('/api/info')
    const info = await res.json()
    const wsUrl = `ws://${window.location.hostname}:${info.wsPort}/ws/logs`
    initLogWebSocket(wsUrl)
  } catch (e) {
    initLogWebSocket(`ws://${window.location.host}/ws/logs`)
  }
})

let logWs: WebSocket | null = null
let wsUrl = `ws://${window.location.host}/ws/logs`

const initLogWebSocket = (url?: string) => {
  if (logWs) {
    logWs.close()
  }
  const targetUrl = url || wsUrl
  wsUrl = targetUrl
  logWs = new WebSocket(targetUrl)

  logWs.onopen = () => {
    addLog('Log stream connected', 'info')
  }

  logWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'log') {
        addLog(data.message, data.level as any, 'BE')
      }
    } catch (e) {
      console.error('Log WebSocket message parse error:', e)
    }
  }

  logWs.onerror = (error) => {
    console.error('Log WebSocket error:', error)
  }

  logWs.onclose = () => {
    logWs = null
    setTimeout(() => initLogWebSocket(), 3000)
  }
}

const handleExecute = async () => {
  if (!currentWorkflow.value) {
    addLog('No workflow to execute', 'warn')
    return
  }
  if (nodes.value.length === 0) {
    addLog('No nodes to execute', 'warn')
    return
  }
  try {
    addLog('Starting workflow execution...', 'info')
    const workflowData = {
      name: currentWorkflow.value,
      version: '1.0',
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.data.type || n.data.id || n.type,
        name: n.data.name,
        configValues: n.data.configValues,
        position: n.position
      })),
      edges: edges.value.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    }
    const result = await executeWorkflow(workflowData as any)
    currentTaskId.value = result.taskId
    addLog(`Execution started: ${result.taskId}`, 'info')
  } catch (e) {
    addLog(`Failed to execute: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleStop = () => {
  if (currentTaskId.value) {
    addLog('Stopping execution...', 'warn')
  }
  currentTaskId.value = null
}

const handleToggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}
</script>

<template>
  <div class="app-container">
    <TopToolbar
      :workflowName="currentWorkflow"
      :workflowList="workflowList"
      @save="handleSave"
      @load="handleLoad"
      @execute="handleExecute"
      @stop="handleStop"
      @new="handleNew"
    />
    <ThemeSwitcher class="theme-switcher" />
    <div class="minimap-toggle" :class="{ active: showMinimap }" @click="handleToggleMinimap" title="切换导航图">
      🗺️
    </div>
    <div class="main-content">
      <FileList
        :workflowList="workflowList"
        :activeWorkflow="currentWorkflow"
        :isCollapsed="fileListCollapsed"
        :style="{ width: fileListCollapsed ? '0' : fileListWidth + 'px' }"
        @select="handleLoad"
        @refresh="handleLoadData"
        @toggleCollapse="fileListCollapsed = !fileListCollapsed"
        @rename="handleRename"
        @delete="handleDelete"
      />
      <div v-if="fileListCollapsed" class="expand-btn-v" @click="fileListCollapsed = false">▶</div>
      <div v-else class="resize-handle-v" @mousedown="startResizeH"></div>
      <div class="canvas-area" :style="{ flex: 1 }">
        <WorkflowCanvas
          :nodes="nodes"
          :edges="edges"
          :selectedNodeId="selectedNodeId"
          :plugins="plugins"
          :categories="categories"
          :showMinimap="showMinimap"
          :style="{ flex: 1 }"
          @add-node="handleAddNode"
          @select-node="handleSelectNode"
          @delete-node="handleDeleteNode"
          @update-node-config="handleUpdateNodeConfig"
          @connect="handleConnect"
        />
        <div v-if="bottomPanelCollapsed" class="expand-btn-h" @click="bottomPanelCollapsed = false">▲</div>
        <template v-else>
          <div class="resize-handle-h" @mousedown="startResizeV"></div>
          <BottomPanel :logs="logs" :style="{ height: bottomPanelHeight + 'px' }" @clear="clearLogs" @toggleCollapse="bottomPanelCollapsed = true" />
        </template>
      </div>
    </div>
    <SaveDialog
      :visible="showSaveDialog"
      :initialName="currentWorkflow || ''"
      @confirm="handleSaveConfirm"
      @cancel="handleSaveCancel"
    />
    <ToastContainer />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.resize-handle-v {
  width: 4px;
  cursor: col-resize;
  background: var(--border-color);
}
.resize-handle-v:hover {
  background: var(--accent-color);
}

.expand-btn-v {
  width: 12px;
  cursor: pointer;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-secondary);
}
.expand-btn-v:hover {
  background: var(--accent-color);
  color: white;
}

.resize-handle-h {
  height: 4px;
  cursor: row-resize;
  background: var(--border-color);
}
.resize-handle-h:hover {
  background: var(--accent-color);
}

.expand-btn-h {
  height: 12px;
  cursor: pointer;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-secondary);
}
.expand-btn-h:hover {
  background: var(--accent-color);
  color: white;
}

.theme-switcher {
  position: fixed;
  top: 60px;
  right: 16px;
  z-index: 100;
}

.minimap-toggle {
  position: fixed;
  top: 100px;
  right: 16px;
  z-index: 100;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.minimap-toggle:hover {
  opacity: 1;
}

.minimap-toggle.active {
  opacity: 1;
}
</style>
