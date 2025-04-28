# 数独游戏 - 技术路线文档

## 技术栈
- **框架**: Next.js 15.3 (App Router模式)
- **语言**: TypeScript 5
- **UI库**: React 19
- **样式**: TailwindCSS + CSS Modules
- **状态管理**: React组件状态
- **构建工具**: Next.js内置构建系统
- **代码规范**: ESLint + Next.js默认规则
- **部署**: Docker容器化

## 架构设计
1. **前端架构**
   - 基于Next.js App Router的单页应用
   - 服务端渲染(SSR)和静态生成(SSG)能力
   - 响应式设计，适配各种设备

2. **核心功能实现**
   - 数独生成算法: 使用回溯算法实现
   - 游戏逻辑: 纯前端实现，无后端依赖
   - 状态持久化: 使用浏览器本地存储

## 项目结构
```
.
├── src/app/               # Next.js App Router入口
│   ├── components/        # 可复用组件
│   │   └── Sudoku.tsx     # 主游戏组件
│   ├── utils/             # 工具函数
│   │   └── sudoku.ts      # 数独核心逻辑
│   └── page.tsx           # 主页面
├── public/                # 静态资源
└── Dockerfile             # 容器化配置
```

## 开发与构建
1. **开发环境**
```bash
npm run dev  # 启动开发服务器(端口3003)
```

2. **生产构建**
```bash
npm run build  # 生成优化后的生产版本
npm start      # 启动生产服务器
```

3. **容器化部署**
```bash
docker build -t sudoku-app .  # 构建镜像
docker run -p 3000:3000 sudoku-app  # 运行容器
```

4. **Nginx反向代理配置**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Docker与Nginx配合部署**
```bash
# 启动应用容器
docker run -d --name sudoku-app -p 3000:3000 sudoku-app

# 启动Nginx容器
docker run -d --name nginx-proxy -p 80:80 -v /path/to/nginx.conf:/etc/nginx/conf.d/default.conf nginx
```

## 技术选型理由
1. **Next.js优势**
   - 开箱即用的React框架
   - 优秀的SEO支持
   - 高效的构建系统
   - 简单的部署选项

2. **TypeScript**
   - 提供类型安全
   - 更好的代码维护性
   - 完善的IDE支持

3. **TailwindCSS**
   - 原子化CSS方案
   - 快速UI开发
   - 与React完美配合
