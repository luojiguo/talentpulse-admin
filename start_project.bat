@echo off
echo 正在检查并杀死占用端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1

echo 正在启动后端服务...
start cmd /k "cd /d c:\Users\28349\Desktop\temp\talentpulse-admin\backend && npm run dev"

echo 正在启动前端服务...
timeout /t 3 /nobreak >nul
start cmd /k "cd /d c:\Users\28349\Desktop\temp\talentpulse-admin\Front_End && npm run dev"

echo 项目启动完成！
echo 前端访问地址：http://localhost:3000
echo 后端API地址：http://localhost:3001
pause