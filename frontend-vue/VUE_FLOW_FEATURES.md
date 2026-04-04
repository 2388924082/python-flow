# Vue Flow 原生功能文档

## 1. 核心功能

### 1.1 基础功能
- **节点管理**：创建、渲染、拖拽节点
- **边管理**：创建、管理节点间的连接
- **缩放与平移**：内置画布缩放和拖拽功能
- **选择功能**：支持单选和多选节点
- **事件系统**：丰富的事件处理机制

### 1.2 高级功能
- **响应式状态**：自动追踪变化，只重新渲染必要元素
- **组合式 API**：提供状态管理和图操作的组合式函数
- **图工具函数**：
  - `getOutgoers`：获取节点的所有目标元素
  - `getIncomers`：获取节点的所有源元素
  - `getConnectedEdges`：获取节点的所有连接边
  - `getTransformForBounds`：根据输入边界返回视口变换
  - `getRectOfNodes`：返回节点元素的边界矩形
  - `getNodesInside`：获取指定区域内的节点

## 2. 附加组件

### 2.1 官方组件
- **Background**：提供网格背景
- **Minimap**：小地图导航
- **Controls**：缩放控制组件
- **NodeToolbar**：节点工具栏（需单独安装）

### 2.2 组件安装
```bash
# 核心包
npm install @vue-flow/core

# 附加组件
npm install @vue-flow/background @vue-flow/minimap @vue-flow/controls @vue-flow/node-toolbar
```

## 3. 技术特点

### 3.1 性能优化
- 响应式追踪：只重新渲染必要元素
- 高效的事件处理
- 内存管理优化

### 3.2 可定制性
- 自定义节点
- 自定义边
- 自定义连接线条
- 自定义事件处理

## 4. 使用示例

### 4.1 基础用法
```vue
<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    fit-view-on-init
  />
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'

const nodes = [
  {
    id: '1',
    type: 'input',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' }
  },
  {
    id: '2',
    type: 'output',
    position: { x: 200, y: 0 },
    data: { label: 'Node 2' }
  }
]

const edges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2'
  }
]
</script>
```

### 4.2 高级用法
```vue
<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    @node-click="handleNodeClick"
    @connect="handleConnect"
  >
    <Background />
    <Controls />
    <Minimap />
  </VueFlow>
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import { Background, Controls, Minimap } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'

// 节点和边的定义
// 事件处理函数
</script>
```

## 5. 事件系统

### 5.1 常用事件
- `node-click`：节点点击
- `edge-click`：边点击
- `connect`：连接创建
- `nodes-change`：节点变化
- `edges-change`：边变化
- `viewport-change`：视口变化
- `pane-click`：画布点击

### 5.2 事件处理示例
```vue
<template>
  <VueFlow
    @node-click="onNodeClick"
    @connect="onConnect"
  />
</template>

<script setup>
const onNodeClick = (event) => {
  console.log('Node clicked:', event.node.id)
}

const onConnect = (connection) => {
  console.log('Connection created:', connection)
}
</script>
```

## 6. 状态管理

### 6.1 内置组合式函数
- `useVueFlow`：获取 Vue Flow 实例和方法
- `useNodes`：节点状态管理
- `useEdges`：边状态管理
- `useViewport`：视口状态管理

### 6.2 状态管理示例
```vue
<script setup>
import { useVueFlow } from '@vue-flow/core'

const { nodes, edges, addNodes, addEdges } = useVueFlow()

// 动态添加节点
const addNewNode = () => {
  addNodes({
    id: `node-${Date.now()}`,
    position: { x: 100, y: 100 },
    data: { label: 'New Node' }
  })
}
</script>
```

## 7. 自定义节点

### 7.1 自定义节点示例
```vue
<template>
  <div class="custom-node">
    <div class="node-header">{{ data.label }}</div>
    <div class="node-content">
      <!-- 自定义内容 -->
    </div>
    <Handle type="target" position="left" />
    <Handle type="source" position="right" />
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: Object,
  position: Object,
  selected: Boolean
})
</script>
```

### 7.2 使用自定义节点
```vue
<template>
  <VueFlow
    :nodes="nodes"
    :node-types="nodeTypes"
  />
</template>

<script setup>
import CustomNode from './CustomNode.vue'

const nodeTypes = {
  custom: CustomNode
}

const nodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'Custom Node' }
  }
]
</script>
```

## 8. 最佳实践

### 8.1 性能优化
- 使用 `v-memo` 缓存复杂节点
- 避免在节点组件中使用 heavy 计算
- 使用 `shallowRef` 存储大型节点/边数据

### 8.2 代码组织
- 将节点类型分离到单独的文件
- 使用组合式函数管理复杂状态
- 封装重复的图操作逻辑

### 8.3 扩展性
- 设计模块化的节点类型
- 使用插件系统扩展功能
- 实现自定义工具函数

## 9. 常见问题

### 9.1 节点不显示
- 检查节点是否有正确的 `position` 属性
- 确保节点类型正确注册
- 检查 CSS 样式是否正确导入

### 9.2 连接失败
- 检查源节点和目标节点是否存在
- 确保节点有正确的 `Handle` 组件
- 检查连接规则是否正确

### 9.3 性能问题
- 减少节点数量或使用虚拟滚动
- 优化节点渲染逻辑
- 使用 `useVueFlow` 的批处理方法

## 10. 资源链接

- [官方文档](https://vueflow.dev/guide/)
- [GitHub 仓库](https://github.com/bcakmakoglu/vue-flow)
- [示例库](https://vueflow.dev/examples/)
- [API 参考](https://vueflow.dev/api/)
