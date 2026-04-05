<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import TopToolbar from './components/TopToolbar.vue'
import FileList from './components/FileList.vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import BottomPanel from './components/BottomPanel.vue'
import SaveDialog from './components/SaveDialog.vue'
import ToastContainer from './components/ToastContainer.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import type { PluginDefinition, CategoryDefinition, Position } from './types/api'
import { getNodes, listWorkflows, getCategories, renameWorkflow, deleteWorkflow } from './services/api'
import { useToast } from './composables/useToast'
import { useLog } from './composables/useLog'
import { useWorkflow } from './composables/useWorkflow'

const { logs, addLog, clearLogs } = useLog()
const toast = useToast()
provide('toast', toast)

const {
  nodes,
  edges,
  currentWorkflow,
  selectedNodeId,
  addNode,
  removeNode,
  updateNodeConfig,
  updateNodePosition,
  selectNode,
  addEdge,
  removeNode: deleteNode,
  removeEdge,
  newWorkflow,
  save,
  load,
  execute,
  isDirty
} = useWorkflow({ onLog: addLog })

const plugins = ref<PluginDefinition[]>([])
const categories = ref<CategoryDefinition[]>([])
const workflowList = ref<string[]>([])
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
  const plugin = plugins.value.find(p => p.id === data.id)
  if (!plugin) {
    addLog(`Plugin not found: ${data.id}`, 'error')
    return
  }
  addNode(plugin, position)
}

const handleUpdateNodeConfig = (nodeId: string, key: string, value: unknown) => {
  updateNodeConfig(nodeId, key, value)
}

const handlePositionChange = (nodeId: string, position: { x: number; y: number }) => {
  updateNodePosition(nodeId, position)
}

const handleConnect = (connection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => {
  addEdge(connection.source, connection.target, connection.sourceHandle, connection.targetHandle)
}

const handleDeleteNode = (nodeId: string) => {
  deleteNode(nodeId)
}

const handleDeleteEdge = (edgeId: string) => {
  removeEdge(edgeId)
}

const handleSave = async () => {
  if (currentWorkflow.value) {
    try {
      await save(plugins.value)
      toast.success('保存成功')
      await handleLoadData()
    } catch (e) {
      toast.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  } else {
    showSaveDialog.value = true
  }
}

const handleSaveConfirm = async (name: string) => {
  showSaveDialog.value = false
  currentWorkflow.value = name
  try {
    await save(plugins.value)
    toast.success('保存成功')
    await handleLoadData()
  } catch (e) {
    toast.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}

const handleSaveCancel = () => {
  showSaveDialog.value = false
}

const handleLoad = async (name: string) => {
  try {
    await load(name, plugins.value)
    addLog(`Loaded workflow: ${name}`, 'info')
  } catch (e) {
    addLog(`Failed to load: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

const handleNew = () => {
  newWorkflow()
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
      newWorkflow()
    }
    await handleLoadData()
    addLog(`Deleted "${name}"`, 'info')
  } catch (e) {
    addLog(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
  }
}

onMounted(() => {
  handleLoadData()
  initLogWebSocket()
})

let logWs: WebSocket | null = null

const initLogWebSocket = () => {
  if (logWs) {
    logWs.close()
  }
  const wsUrl = `ws://localhost:8000/ws/logs`
  logWs = new WebSocket(wsUrl)

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
    setTimeout(initLogWebSocket, 3000)
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
    const result = await execute()
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
          @select-node="selectNode"
          @delete-node="handleDeleteNode"
          @delete-edge="handleDeleteEdge"
          @update-node-config="handleUpdateNodeConfig"
          @connect="handleConnect"
          @position-change="handlePositionChange"
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
  right: 20px;
  z-index: 100;
}

.minimap-toggle {
  position: fixed;
  bottom: 170px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  z-index: 100;
}

.minimap-toggle:hover {
  background: var(--bg-tertiary);
  transform: scale(1.1);
}

.minimap-toggle.active {
  background: var(--accent-color);
  color: white;
}
</style>
