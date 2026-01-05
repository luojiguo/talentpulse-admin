# TalentPulse - 现代化招聘管理系统

TalentPulse 是一个功能强大的现代化招聘与求职平台，连接求职者与招聘方，提供无缝的招聘体验。项目集成了即时通讯、AI 辅助生成、双端角色管理等核心功能。

## 🚀 核心功能 (Key Features)

### 👥 双端角色系统
- **求职者端 (Candidate)**: 浏览职位、投递简历、管理个人档案、与 HR 实时沟通。
- **招聘者端 (Recruiter)**: 发布/管理职位、筛选候选人、AI 辅助撰写 JD、实时面试邀约。

### � 实时即时通讯 (Real-time Messaging)
- **Socket.IO 集成**: 毫秒级消息送达，告别轮询延迟。
- **双重通知机制**: 无论在一个对话中还是在列表页，都能即时收到新消息提醒。
- **只能去重**: 采用智能 Fuzzy Match 策略，解决弱网或并发下的消息重复问题。
- **体验优化**: 自动滚动、状态同步、头像实时更新。

### 🤖 AI 智能辅助
- **AI 职位生成**: 集成 Google Gemini API，一键生成专业、详细的职位描述 (JD)。

### 📊 职位与简历管理
- **全流程管理**: 职位的发布、编辑、下架、重新激活。
- **简历解析**: 支持 PDF 简历上传与解析 (Backend support)。

## 🛠️ 技术栈 (Tech Stack)

### 前端 (Frontend)
- **核心框架**: React 19, Vite
- **UI 组件库**: Ant Design 6.x, Tailwind CSS
- **通信**: Socket.IO Client, Axios
- **图表**: ECharts, Recharts
- **图标**: Lucide React

### 后端 (Backend)
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL
- **实时通信**: Socket.IO
- **安全性**: JWT, Helmet, bcrypt
- **文件处理**: Multer (上传), PDF-parse

## � 安装与运行 (Installation)

### 前置要求
- Node.js (v16+)
- PostgreSQL (v12+)

### 1. 克隆项目
```bash
git clone https://github.com/luojiguo/talentpulse-admin.git
cd talentpulse-admin
```

### 2. 数据库设置
请确保本地 PostgreSQL 已启动，并从 `Talent.sql` 导入初始结构。

### 3. 后端启动
```bash
cd backend
npm install
# 配置 .env 文件 (参考下文)
npm run dev
# 后端将运行在 http://localhost:3001
```

### 4. 前端启动
```bash
cd Front_End
npm install
npm run dev:both
# 系统将同时启动用户端(3000)、管理员端(3100)和招聘者端(3500)
```

## ⚙️ 环境配置 (.env Example)

导出数据库

"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d Talent -h localhost -f "C:\Users\28349\Desktop\temp\talentpulse-admin\Talent.sql"



在 `backend` 目录下创建 `.env` 文件：

```env
PORT=3001
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentpulse
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_key
```

## 📁 项目结构 (Project Structure)

### 📂 前端 (Front_End)
```
Front_End/src/
├── modules/           # 核心业务模块
│   ├── candidate/     # 🧑‍💼 求职者端业务逻辑
│   │   ├── components/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx          # 首页：展示推荐职位和热门公司
│   │   │   ├── JobListScreen.tsx       # 职位列表：支持多维度筛选（薪资、地点等）
│   │   │   ├── JobDetailScreen.tsx     # 职位详情：展示JD、公司信息，投递/收藏功能
│   │   │   ├── MessageCenterScreen.tsx # 消息中心：Socket.IO 实时聊天
│   │   │   ├── ProfileScreen.tsx       # 个人档案：管理简历和个人信息
│   │   │   ├── ResumeEditorScreen.tsx  # 简历编辑：PDF预览与字段编辑
│   │   │   ├── ApplicationsScreen.tsx  # 投递记录：追踪面试状态
│   │   │   └── MockInterviewScreen.tsx # 模拟面试：AI 辅助练习
│   ├── recruiter/     # 👨‍⚖️ 招聘者端业务逻辑
│   │   ├── components/
│   │   ├── screens/
│   │   │   └── RecruiterMessageScreen.tsx # 消息中心：与候选人实时沟通
│   │   ├── views/
│   │   │   ├── RecruiterApp.tsx        # 工作台(Dashboard)：概览与统计
│   │   │   ├── JobsView.tsx            # 职位管理：发布/编辑/下架职位
│   │   │   ├── CandidatesView.tsx      # 候选人管理：简历筛选
│   │   │   └── InterviewsView.tsx      # 面试管理：日程安排
│   └── admin/         # 👮 管理员端业务逻辑
│       └── views/
│           ├── DashboardHome.tsx       # 系统总览：用户增长与活跃度
│           ├── SystemUsersView.tsx     # 用户管理：封禁/解封账号
│           ├── CompaniesView.tsx       # 企业审核：入驻审批
│           └── SystemLogsView.tsx      # 系统日志：操作审计
├── components/        # 全局公共组件 (Button, Input, Modal...)
├── services/          # API 通信层
│   ├── api.ts         # Axios 封装
│   ├── socketService.ts # Socket.IO 客户端封装
│   ├── userAPI.ts     # 用户接口
│   └── ...
├── hooks/             # 自定义 React Hooks
├── utils/             # 工具函数 (日期处理, 格式化...)
└── App.tsx            # 应用入口与路由配置
```

### 📂 后端 (Backend)
```
backend/src/
├── routes/            # API路由定义
│   ├── authRoutes.js    # 认证模块：注册/登录/刷新Token
│   ├── messageRoutes.js # 消息模块：聊天记录/文件发送
│   ├── jobRoutes.js     # 职位模块：CRUD操作/AI生成JD
│   └── ...
├── services/          # 核心服务层
│   ├── db.js            # 数据库连接池
│   └── socketService.js # Socket.IO 服务端逻辑 (连接管理/消息广播)
├── middleware/        # 中间件
│   ├── authMiddleware.js # JWT 身份验证
│   └── uploadMiddleware.js # 文件上传 (Multer配置)
├── utils/             # 工具类
├── scripts/           # 数据库维护与测试脚本
└── server.js          # 服务入口文件
```



## � License

MIT



## 📄 License
MIT
