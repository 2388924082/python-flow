# 快速启动指南

本文档帮助你在本地环境快速启动项目。

## 环境要求

| 依赖 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18 | `node -v` |
| npm | >= 9 | `npm -v` |
| Python | >= 3.10 | `python --version` |
| pip | 最新版 | `pip --version` |

## 启动后端

### 1. 进入后端目录

```bash
cd backend
```

### 2. 安装依赖（如有 requirements.txt）

```bash
pip install fastapi uvicorn
```

### 3. 启动服务

```bash
python -m uvicorn main:app --reload --port 8000
```

### 4. 验证后端启动

访问 http://localhost:8000/docs 查看 FastAPI 文档。

预期输出：
```
Uvicorn running on http://127.0.0.1:8000
```

## 启动前端

### 1. 进入前端目录

```bash
cd frontend-vue
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 验证前端启动

访问 http://localhost:5173 查看前端页面。

预期输出：
```
VITE v6.x.x ready in xxx ms
```

## 一键启动（Windows）

如果你在 Windows 环境，可以直接运行：

```bash
.\start_all.ps1
```

这会同时启动前端和后端。

## 常见启动问题

### 后端端口被占用

```
Error: [Errno 10048] Address already in use
```

解决方法：
1. 查找占用端口的进程：`netstat -ano | findstr :8000`
2. 结束该进程：`taskkill /F /PID <进程ID>`
3. 或使用其他端口启动：`python -m uvicorn main:app --port 8001`

### 前端 Node 版本不对

```
Node version not supported
```

解决方法：
1. 使用 nvm 安装正确版本：`nvm install 18`
2. 切换到正确版本：`nvm use 18`

### npm install 失败

解决方法：
1. 清除缓存：`npm cache clean --force`
2. 删除 node_modules 和 package-lock.json
3. 重新安装：`npm install`

### Python 模块导入错误

```
ModuleNotFoundError: No module named 'fastapi'
```

解决方法：
```bash
pip install fastapi uvicorn
```

## 第一个工作流

### 1. 添加节点

- 从左侧文件列表拖拽节点到画布
- 或点击浮动工具栏的 "+" 按钮

### 2. 连接节点

- 拖拽节点的输出端口到另一个节点的输入端口
- 连线表示数据流向

### 3. 配置节点

- 点击节点，在右侧配置面板填写参数
- 或双击节点打开配置

### 4. 执行工作流

- 点击顶部工具栏的 "▶ 执行" 按钮
- 在底部日志面板查看执行进度

### 5. 保存工作流

- 点击顶部工具栏的 "💾 保存" 按钮
- 输入工作流名称

## 下一步

- 了解前端架构：[FRONTEND_ARCH.md](FRONTEND_ARCH.md)
- 了解后端架构：[BACKEND_ARCH.md](BACKEND_ARCH.md)
- 学习插件开发：[PLUGIN_DEV.md](PLUGIN_DEV.md)
