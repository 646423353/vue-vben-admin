# Delivery Insure (案件保险管理系统)

本项目基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 框架开发，致力于提供一套完整、高效的保险案件管理、保单查询及流转解决方案。

## 简介

本项目是一个现代化的前端中后台管理系统，核心功能模块包含：
- **案件管理**：提供统一的案件创建、跟进记录、以及处理状态追踪流程。
- **保单映射**：支持配送保单信息录入及相应的保单ID查询等。
- **账号及权限**：支持多角色维度的细粒度菜单过滤与账号管控功能。
- **系统核心**：基于最新的 `Vue3`、`Vite`、`TypeScript`、`Pinia` 等技术栈构建。

## 安装与使用

### 环境要求

- **Node.js**: `>=20.12.0`
- **pnpm**: `>=10.0.0` (推荐使用 pnpm 作为包管理器)

### 1. 安装依赖

请在项目根目录下执行：

```bash
pnpm install
```

### 2. 本地开发运行

```bash
pnpm dev
```

### 3. 构建生产版本

```bash
pnpm build
```

## 项目架构

本仓库采用 `Monorepo` 架构进行组织与管理（基于 Turbo）：
- `apps/web-ele`: 基于 Element Plus 的主应用模块
- `apps/web-naive`: 基于 Naive UI 的应用分支
- `apps/web-tdesign`: 基于 TDesign 的应用分支
- `packages/*`: 各个独立的业务或基础组件、工具包模块

## 常用命令

- `pnpm lint`: 运行代码校验
- `pnpm format`: 统一格式化代码
- `pnpm check`: 执行类型及循环依赖检查
- `pnpm commit`: 交互式提交代码

## 浏览器支持

推荐使用最新版 Chrome 或 Edge 浏览器以获得最佳的页面展示及性能体验。
