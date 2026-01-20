# Pixra 插件系统 MVP

## 已完成的功能

### 1. 插件 SDK (`packages/plugin-sdk`)
- TypeScript 类型定义
- 插件 manifest schema
- API 接口定义（window, commands, workspace）

### 2. 插件管理器 (`packages/pixra/src/lib/plugin`)
- **PluginLoader**: 从 ZIP 文件加载插件
- **PluginStorage**: 使用 IndexedDB 存储已安装插件
- **PluginManager**: 管理插件生命周期、激活/停用、命令注册

### 3. Web Worker 沙箱
- 隔离的执行环境
- 白名单 API（屏蔽 fetch、localStorage 等）
- 通过 postMessage 的 RPC 调用

### 4. 命令集成
- 插件命令自动注册到 CommandRegistry
- 懒加载：命令触发时才激活插件
- 新增 "Plugin" 菜单和 "Install Plugin from ZIP" 命令

### 5. Hello World 示例插件 (`packages/hello-world`)
- 完整的插件示例
- 注册 "Hello World" 命令
- 显示信息消息

## 使用方法

### 安装插件

1. 启动 Pixra 应用：`cd packages/pixra && pnpm dev`
2. 在应用中，点击菜单 **Plugin > Install Plugin from ZIP**
3. 选择 `packages/hello-world/hello-world.zip` 文件
4. 安装成功后会显示确认消息

### 运行插件命令

1. 点击菜单 **Help > Show All Commands**（或使用快捷键）
2. 搜索 "Hello World"
3. 执行命令
4. 会弹出 "Hello World from Pixra Plugin!" 消息

### 开发新插件

1. 参考 `packages/hello-world` 作为模板
2. 创建 `manifest.json` 定义插件元信息
3. 创建主入口文件，实现 `activate()` 和 `deactivate()` 函数
4. 使用 `pixra` 全局对象调用 API
5. 构建并打包成 ZIP

## 插件结构

```
my-plugin/
├── manifest.json       # 插件元信息、命令、菜单声明
├── main.js            # 插件代码（在 Worker 中运行）
└── README.md          # 说明文档
```

### manifest.json 示例

```json
{
  "id": "publisher.plugin-name",
  "name": "Plugin Display Name",
  "version": "1.0.0",
  "publisher": "publisher-name",
  "description": "Plugin description",
  "main": "main.js",
  "activationEvents": ["onCommand:myPlugin.command"],
  "contributes": {
    "commands": [
      {
        "command": "myPlugin.command",
        "title": "My Command",
        "category": "My Plugin"
      }
    ]
  },
  "permissions": []
}
```

### 插件代码示例

```javascript
function activate(context) {
  // 注册命令
  const disposable = pixra.commands.registerCommand('myPlugin.command', async () => {
    await pixra.window.showInformationMessage('Hello!');
  });
  
  // 添加到清理列表
  context.subscriptions.push(disposable);
}

function deactivate() {
  // 清理工作
}
```

## 可用的 API

### pixra.window
- `showInformationMessage(message: string)`: 显示信息消息
- `showWarningMessage(message: string)`: 显示警告消息
- `showErrorMessage(message: string)`: 显示错误消息

### pixra.commands
- `registerCommand(command: string, callback: Function)`: 注册命令
- `executeCommand(command: string, ...args)`: 执行命令

### pixra.workspace
- `getActiveImage()`: 获取当前活动图片
- `updateActiveImage(imageData)`: 更新活动图片

### console
- `console.log()`, `console.warn()`, `console.error()`: 日志输出（代理到主线程）

## 安全限制

插件运行在 Web Worker 沙箱中，以下 API 被禁用：
- ❌ `fetch` - 网络请求
- ❌ `indexedDB` - 本地数据库
- ❌ `localStorage` / `sessionStorage` - 本地存储
- ❌ `cookie` - Cookie 访问
- ❌ DOM 访问

## 下一步计划

- [ ] 更丰富的 API（图片处理、UI 组件等）
- [ ] 插件配置界面
- [ ] 插件市场（基于 npm）
- [ ] 热重载支持
- [ ] 调试工具
- [ ] esbuild-wasm 集成（运行时打包）
- [ ] 权限系统
