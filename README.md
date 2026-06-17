# 个人空间应用

一个纯前端 React 应用，用于管理个人语录、整理照片画廊、记录日志和物品台账。这些数据均保存在个人设备浏览器本地上，不会上传云端。同时支持定期导出以及换设备导入，适合当作自己个人的一个记录助手。

## 本地运行步骤

### 1. 准备工作

确保已安装 Node.js（建议 v18+）：
```bash
node -v
```
如果没有安装，去 [nodejs.org](https://nodejs.org) 下载安装。

### 2. 安装 pnpm

**Mac 用户推荐用 Homebrew 安装：**
```bash
brew install pnpm
```

**或者用 npm 安装：**
```bash
npm install -g pnpm
```

### 3. 进入项目目录

```bash
cd /path/to/your/downloaded/project
```

### 4. 安装依赖

```bash
pnpm install
```

### 5. 启动开发服务器

```bash
pnpm run dev
```

### 6. 访问应用

打开浏览器，访问 `http://localhost:3015`

---

## 常用命令

| 命令 | 作用 |
|------|------|
| `pnpm run dev` | 启动开发服务器（带热更新） |
| `pnpm run build` | 构建生产版本（输出到 dist 文件夹） |

---

## 数据说明

- **数据存储位置**：浏览器本地（localStorage + IndexedDB）
- **图片存储**：IndexedDB（浏览器本地数据库）
- **注意事项**：换浏览器或清除浏览器数据会导致数据丢失
- **建议**：定期使用应用内的"导出"功能备份数据

---

## 项目结构

```
├── src/
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── utils/         # 工具函数
│   ├── types/         # 类型定义
│   └── styles/        # 样式文件
├── public/            # 静态资源
├── package.json       # 依赖配置
└── webpack.config.js  # 构建配置
```

---

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Webpack
- IndexedDB（图片存储）
- localStorage（数据存储）
