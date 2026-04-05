# Vue Flow 官方 API 文档

> 本文档整理自 [Vue Flow 官方文档](https://vueflow.dev/)，方便开发人员查阅。

## 目录

1. [Node（节点）](#1-node节点)
2. [Edge（边）](#2-edge边)
3. [Handle（连接点）](#3-handle连接点)
4. [Composables（组合式函数）](#4-composables组合式函数)
5. [VueFlow 组件](#5-vueflow-组件)
6. [附加组件](#6-附加组件)
7. [Events（事件）](#7-events事件)
8. [Props（属性）](#8-props属性)
9. [类型定义](#9-类型定义)

---

## 1. Node节点

### 1.1 Node 数据结构

```typescript
interface Node {
  id: string                    // 唯一标识符
  position: { x: number; y: number }  // 位置
  data: any                     // 自定义数据
  type?: string                 // 节点类型 (default | input | output | custom)
  label?: string | VNode | Component | Object  // 标签
  style?: CSSProperties          // 样式
  class?: string                 // 类名
  selected?: boolean             // 是否选中
  draggable?: boolean            // 是否可拖拽
  selectable?: boolean           // 是否可选择
  connectable?: boolean | HandleConnectableFunc  // 是否可连接
  parent?: string                // 父节点ID
  extent?: 'parent' | BoundaryRule  // 边界规则
  zIndex?: number                // z-index层级
  positionAbsolute?: { x: number; y: number }  // 绝对位置
  targetPosition?: Position      // 目标连接点位置 (Top | Right | Bottom | Left)
  sourcePosition?: Position      // 源连接点位置 (Top | Right | Bottom | Left)
  dragging?: boolean             // 是否正在拖拽
  resizing?: boolean             // 是否正在调整大小
  events?: NodeEvents            // 节点事件
  hidden?: boolean               // 是否隐藏
}
```

### 1.2 内置节点类型

| 类型 | 说明 | 特点 |
|------|------|------|
| `default` | 默认节点 | 包含 source 和 target 两个 handle |
| `input` | 输入节点 | 只有一个 source handle，默认在底部 |
| `output` | 输出节点 | 只有一个 target handle，默认在顶部 |

```typescript
import { Position } from '@vue-flow/core'

// 输入节点
{ id: '1', type: 'input', sourcePosition: Position.Bottom, data: { label: 'Input' } }

// 输出节点
{ id: '2', type: 'output', targetPosition: Position.Top, data: { label: 'Output' } }
```

### 1.3 自定义节点类型

**方式一：使用模板插槽**

```vue
<!-- App.vue -->
<template>
  <VueFlow :nodes="nodes" :edges="edges">
    <template #node-custom="nodeProps">
      <CustomNode v-bind="nodeProps" />
    </template>
  </VueFlow>
</template>
```

**方式二：使用 nodeTypes 对象**

```typescript
import { markRaw } from 'vue'
import CustomNode from './CustomNode.vue'

const nodeTypes = {
  custom: markRaw(CustomNode)  // 必须用 markRaw 包装！
}

<VueFlow :nodes="nodes" :node-types="nodeTypes" />
```

### 1.4 Node Props（传递给自定义节点的属性）

| Prop | 说明 | 类型 |
|------|------|------|
| `id` | 节点ID | string |
| `type` | 节点类型 | string |
| `data` | 节点数据 | any |
| `selected` | 是否选中 | boolean |
| `connectable` | 是否可连接 | boolean |
| `position` | 位置 | { x: number; y: number } |
| `dimensions` | DOM尺寸 | { width: number; height: number } |
| `label` | 标签 | string \| VNode \| Component |
| `dragging` | 是否正在拖拽 | boolean |
| `resizing` | 是否正在调整大小 | boolean |
| `zIndex` | z-index | number |
| `targetPosition` | 目标连接点位置 | Position |
| `sourcePosition` | 源连接点位置 | Position |
| `dragHandle` | 拖拽手柄选择器 | string |
| `events` | 节点事件 | NodeEvents |

### 1.5 Node 操作方法

```typescript
// 通过 useVueFlow
const instance = useVueFlow()

instance.addNodes(nodes)           // 添加节点
instance.removeNodes(nodeIds)      // 删除节点
instance.updateNodeData(nodeId, data)  // 更新节点数据
instance.updateNode(nodeId, changes)    // 更新节点属性
instance.findNode(nodeId)          // 查找节点
instance.setNodes(nodes)           // 设置所有节点
instance.fitView()                 // 自适应视图
instance.fitViewOptions()          // 带选项的自适应视图
```

---

## 2. Edge边

### 2.1 Edge 数据结构

```typescript
interface Edge {
  id: string                    // 唯一标识符
  source: string                // 源节点ID
  target: string                // 目标节点ID
  sourceHandle?: string          // 源Handle ID
  targetHandle?: string          // 目标Handle ID
  type?: string                 // 边类型 (default | step | smoothstep | straight | custom)
  label?: string | VNode | Component | Object  // 标签
  style?: CSSProperties          // 样式
  class?: string                 // 类名
  selected?: boolean             // 是否选中
  animated?: boolean             // 是否动画
  updatable?: boolean            // 是否可更新
  removable?: boolean            // 是否可删除
  markerStart?: string | MarkerType  // 起点标记
  markerEnd?: string | MarkerType | { type: MarkerType; width?: number; height?: number }
  curvature?: number             // 弯曲度
  interactionWidth?: number      // 交互区域宽度
  sourcePosition?: Position      // 源位置
  targetPosition?: Position      // 目标位置
  data?: any                     // 自定义数据
  events?: EdgeEvents            // 边事件
  hidden?: boolean               // 是否隐藏
}
```

### 2.2 内置边类型

| 类型 | 说明 |
|------|------|
| `default` (bezier) | 贝塞尔曲线，默认类型 |
| `step` | 阶梯线 |
| `smoothstep` | 圆角阶梯线 |
| `straight` | 直线 |

### 2.3 箭头标记 (MarkerType)

```typescript
import { MarkerType } from '@vue-flow/core'

// 方式一：简单用法
markerEnd: MarkerType.ArrowClosed

// 方式二：自定义大小
markerEnd: {
  type: MarkerType.ArrowClosed,
  width: 20,
  height: 20
}
```

**可用的 MarkerType：**
- `MarkerType.Arrow` - 普通箭头
- `MarkerType.ArrowClosed` - 实心箭头
- `MarkerType.Circle` - 圆圈
- `MarkerType.CircleDot` - 带点的圆圈
- `MarkerType.Custom` - 自定义

### 2.4 自定义边类型

**方式一：使用模板插槽**

```vue
<template>
  <VueFlow :edges="edges">
    <template #edge-custom="edgeProps">
      <CustomEdge v-bind="edgeProps" />
    </template>
  </VueFlow>
</template>
```

**方式二：使用 edgeTypes 对象**

```typescript
import { markRaw } from 'vue'
import CustomEdge from './CustomEdge.vue'

const edgeTypes = {
  custom: markRaw(CustomEdge)
}

<VueFlow :edges="edges" :edge-types="edgeTypes" />
```

### 2.5 Edge Props（传递给自定义边的属性）

| Prop | 说明 | 类型 |
|------|------|------|
| `id` | 边ID | string |
| `source` | 源节点 | GraphNode |
| `target` | 目标节点 | GraphNode |
| `sourceX` | 源X坐标 | number |
| `sourceY` | 源Y坐标 | number |
| `targetX` | 目标X坐标 | number |
| `targetY` | 目标Y坐标 | number |
| `sourcePosition` | 源位置 | Position |
| `targetPosition` | 目标位置 | Position |
| `type` | 边类型 | string |
| `label` | 标签 | string \| VNode \| Component |
| `style` | 样式 | CSSProperties |
| `selected` | 是否选中 | boolean |
| `animated` | 是否动画 | boolean |
| `updatable` | 是否可更新 | boolean |
| `markerStart` | 起点标记 | string |
| `markerEnd` | 终点标记 | string |
| `curvature` | 弯曲度 | number |
| `data` | 自定义数据 | any |

### 2.6 内置边组件

Vue Flow 提供了以下内置边组件，可以直接使用或作为自定义边的基础：

```typescript
import { BezierEdge, StepEdge, SmoothstepEdge, StraightEdge } from '@vue-flow/core'

// 在自定义边组件中使用
<template>
  <BezierEdge
    :source-x="sourceX"
    :source-y="sourceY"
    :target-x="targetX"
    :target-y="targetY"
    :source-position="sourcePosition"
    :target-position="targetPosition"
  />
</template>
```

---

## 3. Handle连接点

### 3.1 Handle 位置

```typescript
import { Position } from '@vue-flow/core'

// 可选位置
Position.Top
Position.Right
Position.Bottom
Position.Left
```

### 3.2 Handle 组件

```vue
<script setup>
import { Handle } from '@vue-flow/core'
import { Position } from '@vue-flow/core'
</script>

<template>
  <!-- 源连接点（输出） -->
  <Handle
    id="source-1"
    type="source"
    :position="Position.Right"
  />

  <!-- 目标连接点（输入） -->
  <Handle
    id="target-1"
    type="target"
    :position="Position.Left"
  />
</template>
```

### 3.3 Handle Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `id` | 连接点ID | string | 随机 |
| `type` | 连接点类型 | 'source' \| 'target' | 'source' |
| `position` | 位置 | Position | Position.Top |
| `connectable` | 是否可连接 | boolean \| number \| Function | true |
| `isValidConnection` | 验证连接函数 | Function | 内置验证 |
| `style` | 样式 | CSSProperties | - |
| `class` | 类名 | string | - |
| `ref` | DOM引用 | Ref | - |

### 3.4 多连接点

同一类型（source/target）的多个连接点需要不同的 ID：

```vue
<Handle id="source-a" type="source" :position="Position.Right" style="top: 10px" />
<Handle id="source-b" type="source" :position="Position.Right" style="bottom: 10px; top: auto;" />

<Handle id="target-a" type="target" :position="Position.Left" style="top: 10px" />
<Handle id="target-b" type="target" :position="Position.Left" style="bottom: 10px; top: auto;" />
```

### 3.5 限制连接数量

```vue
<script setup>
const handleConnectable = (node, connectedEdges) => {
  return connectedEdges.length < 3  // 最多3个连接
}
</script>

<template>
  <Handle type="source" :position="Position.Right" :connectable="handleConnectable" />
</template>
```

### 3.6 连接模式

```typescript
import { ConnectionMode } from '@vue-flow/core'

// Loose 模式（默认）：允许任意连接
<VueFlow :connection-mode="ConnectionMode.Loose" />

// Strict 模式：只允许 source -> target
<VueFlow :connection-mode="ConnectionMode.Strict" />
```

### 3.7 动态更新 Handle

如果动态添加/删除 handle，需要调用 `updateNodeInternals`：

```typescript
const { updateNodeInternals } = useVueFlow()

// 更新指定节点
updateNodeInternals(['node-id'])

// 或者在组件中 emit
emit('updateNodeInternals')
```

---

## 4. Composables组合式函数

### 4.1 useVueFlow

这是 Vue Flow 最核心的 composable，提供对内部状态的访问和操作。

```typescript
import { useVueFlow } from '@vue-flow/core'

const {
  // 状态
  nodes,
  edges,
  transform,
  selectedNodes,
  selectedEdges,

  // 方法
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  setNodes,
  setEdges,
  updateNodeData,
  updateNode,
  updateEdgeData,
  findNode,
  findEdge,
  getNodes,
  getEdges,
  setCenter,
  fitView,
  zoomIn,
  zoomOut,
  setViewport,
  getViewport,

  // 连接相关
  onConnect,
  onDisconnect,

  // 交互状态
  connectionStartHandle,
  snapToGrid,
  gridSize,

  // 视图状态
  viewport,
  dimensions,

  // 节点操作
  updateNodeInternals,

  // 事件监听
  onInit,
  onNodesChange,
  onEdgesChange,
  onNodeDrag,
  onNodeDragStart,
  onNodeDragStop,
  // ... 更多事件
} = useVueFlow()
```

### 4.2 useHandleConnections

获取连接到特定 Handle 的所有连接。

```typescript
const targetConnections = useHandleConnections({
  type: 'target',  // required
  // 或
  type: 'source'
})

// 指定特定 handle
const connections = useHandleConnections({
  id: 'handle-1',
  nodeId: '1',
  type: 'target',
  onConnect: (connections) => { /* ... */ },
  onDisconnect: (connections) => { /* ... */ }
})
```

### 4.3 useNodeConnections

获取连接到特定节点的所有连接。

```typescript
const targetConnections = useNodeConnections({
  handleType: 'target'  // required
})

const sourceConnections = useNodeConnections({
  handleType: 'source'
})
```

### 4.4 useNodesData

根据节点 ID 获取节点数据。

```typescript
const connections = useHandleConnections({ type: 'target' })

const data = useNodesData(() => connections.value.map(c => c.source))

// 带类型守卫
const data = useNodesData(
  () => connections.value.map(c => c.source),
  (node): node is MyNode => node.type === 'custom'
)
```

### 4.5 useNodeId

获取当前节点组件的 ID（必须在节点组件内使用）。

```typescript
const nodeId = useNodeId()
console.log(nodeId.value) // '1'
```

### 4.6 useHandle

创建自定义 Handle（高级用法）。

```typescript
import { useHandle } from '@vue-flow/core'

const { handlePointerDown, handleClick } = useHandle({
  nodeId,
  handleId: 'my-handle',
  type: 'source',
  isValidConnection: (connection) => true
})
```

---

## 5. VueFlow 组件

### 5.1 基础用法

```vue
<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    @node-click="onNodeClick"
    @edge-click="onEdgeClick"
  />
</template>
```

### 5.2 完整 Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `nodes` | 节点数组 | Node[] | [] |
| `edges` | 边数组 | Edge[] | [] |
| `nodeTypes` | 节点类型映射 | Record<string, Component> | 内置类型 |
| `edgeTypes` | 边类型映射 | Record<string, Component> | 内置类型 |
| `defaultEdgeOptions` | 默认边选项 | Edge[] | - |
| `defaultNodeOptions` | 默认节点选项 | Node | - |
| `defaultViewport` | 默认视图 | { x: number, y: number, zoom: number } | { x: 100, y: 100, zoom: 1 } |
| `minZoom` | 最小缩放 | number | 0 |
| `maxZoom` | 最大缩放 | number | 2 |
| `zoomOnScroll` | 滚轮缩放 | boolean | true |
| `zoomOnPinch` | 触摸缩放 | boolean | true |
| `panOnScroll` | 滚轮平移 | boolean | false |
| `panOnScrollSpeed` | 滚轮平移速度 | number | 0.5 |
| `panOnDrag` | 拖拽平移 | boolean \| 'mouse' \| 'touch' | true |
| `selectionOnDrag` | 拖拽选择 | boolean | false |
| `selectionMode` | 选择模式 | SelectionMode | SelectionMode.Partial |
| `multiSelectionKeyCode` | 多选键 | string \| null | 'Shift' |
| `deleteKeyCode` | 删除键 | string \| null | 'Backspace' |
| `翘曲 OnDrag` | 拖拽时翘曲 | boolean | true |
| `翘曲 OnDragSensitivity` | 拖拽灵敏度 | number | 1 |
| `noWheelClassName` | 禁用滚轮的类名 | string | 'nowheel' |
| `noDragClassName` | 禁用拖拽的类名 | string | 'nodrag' |
| `elementsSelectable` | 元素可选择 | boolean | true |
| `nodesConnectable` | 节点可连接 | boolean | true |
| `nodesDraggable` | 节点可拖拽 | boolean | true |
| `elementsTuishable` | 元素可平移 | boolean | true |
| `connectOnClick` | 点击连接 | boolean | true |
| `connectionMode` | 连接模式 | ConnectionMode | ConnectionMode.Loose |
| `snapToGrid` | 吸附网格 | boolean | false |
| `snapGrid` | 网格大小 | [number, number] | [15, 15] |
| `onlyRenderVisibleElements` | 只渲染可见 | boolean | false |
| `extent` | 边界范围 | 'parent' \| BoundaryRule | - |
| `default` | 默认插槽 | Component | - |
| `node` | 节点插槽 | Component | - |
| `edge` | 边插槽 | Component | - |
| `connection-line` | 连接线插槽 | Component | - |
| `arrowhead-marker` | 箭头标记插槽 | Component | - |
| `background` | 背景插槽 | Component | - |

### 5.3 v-model 双向绑定

```vue
<!-- 双向绑定 nodes -->
<VueFlow v-model:nodes="nodes" />

<!-- 双向绑定 edges -->
<VueFlow v-model:edges="edges" />

<!-- 双向绑定 viewport -->
<VueFlow v-model:viewport="viewport" />
```

---

## 6. 附加组件

### 6.1 Background 背景

```vue
<script setup>
import { Background } from '@vue-flow/background'
</script>

<template>
  <VueFlow>
    <Background pattern="dots" :gap="20" :size="2" />
  </VueFlow>
</template>
```

**Background Props：**

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `variant` | 背景样式 | 'dots' \| 'lines' | 'dots' |
| `gap` | 间距 | number | 20 |
| `size` | 大小 | number | 0.5 |
| `color` | 颜色 | string | - |

### 6.2 Minimap 小地图

```vue
<script setup>
import { Minimap } from '@vue-flow/minimap'
</script>

<template>
  <VueFlow>
    <MiniMap />
  </VueFlow>
</template>
```

**MiniMap Props：**

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `nodeColor` | 节点颜色 | string \| Function | - |
| `nodeStrokeWidth` | 节点边框宽度 | number | 0 |
| `maskColor` | 遮罩颜色 | string | - |
| `pannable` | 可平移 | boolean | false |
| `zoomable` | 可缩放 | boolean | false |

### 6.3 Controls 控制面板

```vue
<script setup>
import { Controls } from '@vue-flow/controls'
</script>

<template>
  <VueFlow>
    <Controls />
  </VueFlow>
</template>
```

### 6.4 Panel 面板

```vue
<script setup>
import { Panel } from '@vue-flow/core'
</script>

<template>
  <VueFlow>
    <Panel position="top-left | top-center | top-right | bottom-left | bottom-center | bottom-right">
      <button>Custom Panel</button>
    </Panel>
  </VueFlow>
</template>
```

---

## 7. Events事件

### 7.1 Node 事件

| 事件 | 说明 | 参数 |
|------|------|------|
| `onNodeClick` | 节点点击 | (event: MouseEvent, node: Node) |
| `onNodeDoubleClick` | 节点双击 | (event: MouseEvent, node: Node) |
| `onNodeContextMenu` | 节点右键菜单 | (event: MouseEvent, node: Node) |
| `onNodeMouseEnter` | 鼠标进入 | (event: MouseEvent, node: Node) |
| `onNodeMouseLeave` | 鼠标离开 | (event: MouseEvent, node: Node) |
| `onNodeMouseMove` | 鼠标移动 | (event: MouseEvent, node: Node) |
| `onNodeDragStart` | 节点拖拽开始 | (event: MouseEvent, node: Node) |
| `onNodeDrag` | 节点拖拽中 | (event: MouseEvent, node: Node) |
| `onNodeDragStop` | 节点拖拽结束 | (event: MouseEvent, node: Node) |
| `onNodesChange` | 节点变化 | (changes: NodeChange[]) |

### 7.2 Edge 事件

| 事件 | 说明 | 参数 |
|------|------|------|
| `onEdgeClick` | 边点击 | (event: MouseEvent, edge: Edge) |
| `onEdgeDoubleClick` | 边双击 | (event: MouseEvent, edge: Edge) |
| `onEdgeContextMenu` | 边右键菜单 | (event: MouseEvent, edge: Edge) |
| `onEdgeMouseEnter` | 鼠标进入 | (event: MouseEvent, edge: Edge) |
| `onEdgeMouseLeave` | 鼠标离开 | (event: MouseEvent, edge: Edge) |
| `onEdgeMouseMove` | 鼠标移动 | (event: MouseEvent, edge: Edge) |
| `onEdgeUpdate` | 边更新 | (event: MouseEvent, edge: Edge) |
| `onEdgeUpdateStart` | 边更新开始 | (event: MouseEvent, edge: Edge) |
| `onEdgeUpdateEnd` | 边更新结束 | (event: MouseEvent, edge: Edge) |
| `onEdgesChange` | 边变化 | (changes: EdgeChange[]) |

### 7.3 Connection 事件

| 事件 | 说明 | 参数 |
|------|------|------|
| `onConnect` | 连接建立 | (connection: Connection) |
| `onDisconnect` | 连接断开 | (connection: Connection) |
| `onConnectionStart` | 连接开始 | (event: MouseEvent, params: ConnectionStartParams) |
| `onConnectionEnd` | 连接结束 | (event: MouseEvent, params: ConnectionStartParams) |

### 7.4 Pane 事件

| 事件 | 说明 | 参数 |
|------|------|------|
| `onPaneClick` | 画布点击 | (event: MouseEvent) |
| `onPaneDoubleClick` | 画布双击 | (event: MouseEvent) |
| `onPaneContextMenu` | 画布右键菜单 | (event: MouseEvent) |
| `onViewportChange` | 视图变化 | (viewport: Viewport) |

### 7.5 其他事件

| 事件 | 说明 | 参数 |
|------|------|------|
| `onInit` | 初始化完成 | (instance: VueFlowInstance) |
| `onNodesInitialize` | 节点初始化完成 | () |
| `onEdgesInitialize` | 边初始化完成 | () |
| `onMoveStart` | 移动开始 | (event: MouseEvent | TouchEvent, viewport: Viewport) |
| `onMove` | 移动中 | (event: MouseEvent | TouchEvent, viewport: Viewport) |
| `onMoveEnd` | 移动结束 | (event: MouseEvent | TouchEvent, viewport: Viewport) |

### 7.6 事件监听方式

**方式一：直接绑定**

```vue
<VueFlow
  @node-click="onNodeClick"
  @edge-click="onEdgeClick"
  @connect="onConnect"
/>
```

**方式二：使用 useVueFlow**

```typescript
const {
  onNodeClick,
  onEdgeClick,
  onConnect
} = useVueFlow()

onNodeClick(({ event, node }) => {
  console.log('node clicked', node)
})

onConnect((connection) => {
  console.log('connection', connection)
})
```

---

## 8. Props属性

### 8.1 VueFlow Props 分类

#### 节点/边相关

```typescript
nodes: Node[]                    // 节点数组
edges: Edge[]                    // 边数组
nodeTypes: Record<string, Component>  // 节点类型组件
edgeTypes: Record<string, Component>  // 边类型组件
defaultEdgeOptions: Edge         // 默认边选项
defaultNodeOptions: Node         // 默认节点选项
elementsSelectable: boolean      // 元素是否可选择
nodesConnectable: boolean        // 节点是否可连接
nodesDraggable: boolean          // 节点是否可拖拽
elementsSelectable: boolean      // 元素是否可选
```

#### 缩放相关

```typescript
minZoom: number                  // 最小缩放 (默认: 0)
maxZoom: number                  // 最大缩放 (默认: 2)
zoomOnScroll: boolean            // 滚轮缩放 (默认: true)
zoomOnPinch: boolean              // 触摸缩放 (默认: true)
zoomActivationKeyCode: KeyCode   // 激活缩放的键
panOnScroll: boolean             // 滚轮平移 (默认: false)
panOnScrollSpeed: number         // 滚轮平移速度 (默认: 0.5)
```

#### 平移相关

```typescript
panOnDrag: boolean | 'mouse' | 'touch'  // 拖拽平移 (默认: true)
panOnPinche: boolean              // 触摸平移
selectionOnDrag: boolean          // 拖拽选择 (默认: false)
selectionMode: SelectionMode      // 选择模式
```

#### 网格相关

```typescript
snapToGrid: boolean               // 吸附网格 (默认: false)
snapGrid: [number, number]        // 网格大小 (默认: [15, 15])
```

#### 连接相关

```typescript
connectOnClick: boolean            // 点击连接 (默认: true)
connectionMode: ConnectionMode     // 连接模式 (默认: Loose)
connectionLineType: ConnectionLineType  // 连接线类型
connectionRadius: number           // 连接半径
```

#### 其他

```typescript
defaultViewport: Viewport           // 默认视图
onlyRenderVisibleElements: boolean // 只渲染可见元素 (默认: false)
noWheelClassName: string           // 禁用滚轮类名 (默认: 'nowheel')
noDragClassName: string            // 禁用拖拽类名 (默认: 'nodrag')
deleteKeyCode: string              // 删除键 (默认: 'Backspace')
multiSelectionKeyCode: string      // 多选键 (默认: 'Shift')
```

---

## 9. 类型定义

### 9.1 Position

```typescript
enum Position {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left'
}
```

### 9.2 ConnectionMode

```typescript
enum ConnectionMode {
  Loose = 'loose',    // 允许任意连接
  Strict = 'strict'   // 只允许 source -> target
}
```

### 9.3 SelectionMode

```typescript
enum SelectionMode {
  Partial = 'partial',
  Full = 'full',
  Isolation = 'isolation'
}
```

### 9.4 MarkerType

```typescript
enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed',
  Circle = 'circle',
  CircleDot = 'circleDot',
  Custom = 'custom'
}
```

### 9.5 Viewport

```typescript
interface Viewport {
  x: number
  y: number
  zoom: number
}
```

### 9.6 Connection

```typescript
interface Connection {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}
```

### 9.7 NodeChange / EdgeChange

```typescript
type NodeChange =
  | { type: 'add'; node: Node }
  | { type: 'remove'; id: string }
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'position'; id: string; position: Position; dragging?: boolean }
  | { type: 'dimensions'; id: string; dimensions: Dimensions }
  | { type: 'remove'; id: string }

type EdgeChange =
  | { type: 'add'; edge: Edge }
  | { type: 'remove'; id: string }
  | { type: 'select'; id: string; selected: boolean }
```

---

## 10. 常用功能示例

### 10.1 拖拽节点时不触发拖拽

在节点内的交互元素上添加 `nodrag` 类：

```vue
<template>
  <div class="custom-node">
    <input class="nodrag" v-model="inputValue" />
    <button class="nodrag">Click me</button>
  </div>
</template>
```

### 10.2 节点内滚动不触发画布缩放

添加 `nowheel` 类：

```vue
<template>
  <div class="custom-node">
    <ul class="nowheel">
      <li v-for="item in items">{{ item }}</li>
    </ul>
  </div>
</template>
```

### 10.3 自适应视图

```typescript
const { fitView } = useVueFlow()

// 在节点添加后调用
fitView()

// 带选项
fitView({ padding: 0.2, maxZoom: 1 })
```

### 10.4 查找并高亮路径

```typescript
import { findPath } from '@vue-flow/core'

const path = findPath({
  nodes: getNodes(),
  edges: getEdges(),
  path: [{ x: 100, y: 100 }, { x: 200, y: 200 }]
})
```

### 10.5 获取节点的所有连接边

```typescript
import { getConnectedEdges } from '@vue-flow/core'

const connectedEdges = getConnectedEdges(nodeId, edges)
```

### 10.6 使用内置工具函数

```typescript
import {
  getOutgoers,      // 获取节点的所有目标节点
  getIncomers,      // 获取节点的所有源节点
  getConnectedEdges, // 获取节点的所有连接边
  getNodesInside,   // 获取指定区域内的节点
  getRectOfNodes,   // 获取节点的边界矩形
  getTransformForBounds  // 获取变换矩阵
} from '@vue-flow/core'
```

---

## 11. 注意事项

1. **markRaw 包装**：自定义节点/边组件必须用 `markRaw` 包装，否则 Vue 会发出警告

2. **节点唯一ID**：每个节点必须有唯一的 `id`

3. **响应式**：通过 `useVueFlow` 获取的状态是响应式的，直接修改会触发更新

4. **连接线**：Handle 的位置决定了连接线的弯曲方向

5. **更新内部状态**：动态修改 handle 位置后需要调用 `updateNodeInternals`

6. **选择模式**：`selectionOnDrag` 为 `true` 时，拖拽会进入框选模式

---

## 12. 官方资源

- 官方文档：https://vueflow.dev/
- GitHub：https://github.com/bcakmakoglu/vue-flow
- 示例：https://vueflow.dev/examples/
