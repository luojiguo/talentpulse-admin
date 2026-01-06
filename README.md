# TalentPulse (人才脉动) - 企业级现代化招聘管理系统

TalentPulse 是一款集成了即时通讯、AI 智能辅助、简历解析与全流程招聘管理的现代化企业级应用。系统连接求职者与招聘方，提供无缝、高效的招聘体验。项目基于 React 19 和 Node.js 构建，采用微服务化思想设计，支持高并发实时通信。

## 🚀 核心功能亮点 (Core Features)

### 1. 👥 多角色生态系统
- **求职者端 (Candidate)**
  - **职位探索**: 多维度筛选（薪资、地点、经验），支持关键字智能搜索。
  - **简历中心**: 在线简历编辑、PDF 简历上传与解析、多版本简历管理。
  - **消息互动**: 与 HR 实时聊天，支持发送简历、图片、文件。
  - **投递追踪**: 实时查看面试进度，状态变更自动通知。
- **招聘者端 (Recruiter)**
  - **职位管理**: 职位的发布、编辑、上下架，支持 AI 一键生成 JD。
  - **人才库**: 智能推荐匹配候选人，简历在线预览。
  - **即时沟通**: 内置专业 IM，支持发送面试邀请、交换微信号（互换通过可见）、发送 Offer。
  - **面试管理**: 拖拽式面试日程安排，自动发送邮件/消息提醒。
- **管理员端 (Admin)**
  - **系统大盘**: 用户增长、活跃度、职位分布等多维数据可视化。
  - **企业审核**: 企业入驻资质审核流。
  - **用户管理**: 违规账号封禁与解封，操作日志审计。

### 2. 💬 企业级即时通讯 (IM)
- **底层架构**: 基于 Socket.IO 实现双向实时通信，支持断线重连、心跳检测。
- **消息类型**: 支持文本、图片、文件（简历）、系统通知、**微信交换卡片**（自定义交互消息）。
- **微信交换流程**: 
  - 招聘者/求职者发起交换请求。
  - 对方收到卡片，点击同意/拒绝。
  - 同意后双方互相展示微信号，支持一键复制。
  - **安全机制**: 数据库严格校验，未设置微信号时强制提示输入，防止空数据交互。
- **体验优化**: 消息自动去重（Fuzzy Match）、未读消息计数、置顶/隐藏会话、打字中状态、下拉加载历史记录。

### 3. 🤖 AI 智能赋能
- **智能 JD 生成**: 集成 Google Gemini API，根据职位名称和简要要求，自动撰写专业、结构清晰的职位描述。
- **简历解析**: (Backend) 使用 `pdf-parse` 提取简历关键信息。

### 4. 🛡️ 安全与性能
- **鉴权**: 基于 JWT (JSON Web Token) 的无状态身份验证，支持自动刷新 Token。
- **防护**: `helmet` 安全头配置，密码 `bcrypt` 加密存储。
- **性能**: MySQL 索引优化，Redis 缓存（规划中），React.lazy 路由懒加载。

---

## 🛠️ 技术架构 (Tech Stack)

### 前端 (Frontend)
| 技术 | 说明 |
| --- | --- |
| **Framework** | **React 19**, **Vite 5** (秒级热更新) |
| **Language** | **TypeScript** (全类型覆盖，增强代码健壮性) |
| **State Mgt** | React Context API + Custom Hooks |
| **UI Library** | **Ant Design 6.x**, **Tailwind CSS** (原子化样式) |
| **Icons** | Lucide React (轻量级图标库) |
| **Network** | Axios (拦截器封装), Socket.IO Client |
| **Charts** | Recharts, ECharts (数据可视化) |

### 后端 (Backend)
| 技术 | 说明 |
| --- | --- |
| **Runtime** | **Node.js** (LTS) |
| **Framework** | **Express.js** (RESTful API 设计) |
| **Database** | **MySQL 8.0** / PostgreSQL (兼容性设计) |
| **ORM/Query** | 原生 SQL (mysql2) + 事务管理封装 |
| **Real-time** | **Socket.IO** (Namespace/Room 机制) |
| **Security** | JWT, Helmet, Cors, Bcrypt |
| **AI LLM** | Google Generative AI (Gemini Pro) |
| **File** | Multer (流式上传), fs-extra |

---

## 📂 项目结构 (Structure)

```bash
root/
├── Front_End/                  # 前端工程
│   ├── src/
│   │   ├── components/         # 全局通用组件 (Button, Modal, Avatar...)
│   │   ├── layouts/            # 布局组件 (Sidebar, Header)
│   │   ├── modules/            # 领域驱动设计 (DDD) 模块划分
│   │   │   ├── admin/          # 管理员业务 (Dashboard, UserMgt)
│   │   │   ├── candidate/      # 求职者业务 (Home, Jobs, Messages)
│   │   │   └── recruiter/      # 招聘者业务 (Console, Candidates)
│   │   ├── services/           # API 与 Socket 服务封装
│   │   ├── hooks/              # 自定义 Hooks (useSocket, useAuth)
│   │   ├── types/              # TypeScript 类型定义
│   │   └── utils/              # 工具函数
│   └── vite.config.ts          # Vite 配置
├── backend/                    # 后端工程
│   ├── src/
│   │   ├── config/             # 配置中心 (DB, JWT, AI)
│   │   ├── controllers/        # 业务逻辑控制器
│   │   ├── middleware/         # 中间件 (Auth, Upload, ErrorHandler)
│   │   ├── routes/             # 路由定义
│   │   ├── services/           # 核心服务 (Socket, DB wrapper)
│   │   ├── scripts/            # 运维脚本 (新增字段, 索引优化)
│   │   │   ├── update_message_type_constraint.js # 修复消息类型约束
│   │   │   └── add_indexes.sql                   # 数据库索引优化
│   │   └── app.js              # 应用入口
│   └── package.json
└── README.md
```

---

##  安装与启动 (Setup Guide)

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0 (推荐) 或 PostgreSQL
- NPM 或 Yarn

### 1. 数据库准备
确保本地 MySQL 服务已启动，创建数据库 `talentpulse`。
可使用根目录下的 SQL 脚本初始化表结构（如果有提供），或参考 `backend/src/models` 自行建表。

### 2. 后端启动
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量 (参考下方配置)
cp .env.example .env

# 初始化/维护脚本 (按需运行)
# 例如：添加消息类型约束
node src/scripts/update_message_type_constraint.js 

# 启动开发服务器
npm run dev
# Server running at http://localhost:3001
```

### 3. 前端启动
```bash
cd Front_End

# 安装依赖
npm install

# 启动 (同时启动用户端和管理端入口)
npm run dev:both
# App running at http://localhost:3000 (Candidate/Recruiter)
# Admin running at http://localhost:3100
```

---

## 🚧 待开发功能 (Roadmap)

项目目前处于快速迭代阶段，以下功能已在规划中：

### 📱 移动端适配
- [ ] **原生 App**: 基于 React Native 或 Flutter 开发 iOS/Android 客户端。
- [ ] **小程序**: 适配微信小程序，方便求职者快速投递。

###  商业化与支付
- [ ] **支付集成**: 接入微信支付/支付宝，支持企业购买会员或职位置顶。
- [ ] **增值服务**: 简历查看权益包、智能刷新职位。

### 🎥 音视频面试
- [ ] **应用内视频**: 集成 WebRTC (如 Agora/LiveKit)，无需跳转第三方软件即可进行在线面试。
- [ ] **AI 面试**: AI 数字人自动进行初步面试筛选。

### 🧠 高级 AI 应用
- [ ] **智能人岗匹配**: 基于 NLP 分析简历与 JD 的匹配度，提供打分与推荐。
- [ ] **简历自动优化**: AI 辅助求职者润色简历内容。

### 🏗️ 架构升级
- [ ] **Redis 缓存**: 引入 Redis 缓存热点数据（如职位列表），减轻数据库压力。
- [ ] **微服务拆分**: 当业务量增长时，将用户、消息、职位等模块拆分为独立微服务。
- [ ] **CI/CD**: 配置 Docker 容器化与自动化部署流水线。

---

## ⚙️ 环境变量配置 (.env)

在 `backend` 目录下新建 `.env` 文件：

```ini
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=talentpulse
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# AI Service (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# File Upload
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=5242880 # 5MB
```

---

## 🔧 维护与常见问题 (Troubleshooting)

### Q: 消息发送失败，提示 "Type Check Failed"？
**A:** 数据库可能存在旧的 `CHECK` 约束。请运行维护脚本更新约束：
```bash
cd backend
node src/scripts/update_message_type_constraint.js
```

### Q: 侧边栏消息显示为 JSON 字符串？
**A:** 已修复。请确保前端更新至最新 commit。系统会自动解析 `exchange_request` 或 `wechat_card` 类型的消息为友好文本（如 "[微信交换请求]"）。

### Q: 为什么清空微信号后还能发送请求？
**A:** 已增强前端校验逻辑。现在系统会优先校验 API 返回的实时数据，如果数据库字段为空，会强制弹窗提示输入，不再错误使用本地缓存。

---

## 📝 开发规范 (Contributing)

- **Commit Message**: 使用中文，清晰描述改动（如：`修复：微信交换流程优化`）。
- **Branching**: `feature/功能名` 或 `fix/bug描述`。
- **Code Style**: 遵循 ESLint 配置，使用 TypeScript 类型定义。
