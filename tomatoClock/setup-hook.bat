@echo off
chcp 65001 >nul
echo ========================================
echo   番茄钟 - Git 提交检查一键配置
echo ========================================
echo.

REM 找到 git 仓库根目录（当前目录的父目录）
set "HOOK_DIR=%~dp0..\.git\hooks"
set "HOOK_FILE=%HOOK_DIR%\pre-commit"

if not exist "%HOOK_DIR%" (
    echo ❌ 未找到 .git\hooks 目录
    echo 请确保在 git 仓库中运行此脚本
    pause
    exit /b 1
)

REM 写入 pre-commit hook
(
echo #!/bin/sh
echo # 提交前自动运行 lint，不通过则阻止提交
echo cd "$(dirname "$0")/../../tomatoClock" || exit 1
echo.
echo echo "🔍 运行 ESLint 检查..."
echo npm run lint --silent
echo if [ $? -ne 0 ]; then
echo   echo ""
echo   echo "❌ Lint 未通过！请修复上述错误后再提交。"
echo   echo "   提示：运行 npm run lint 查看具体错误"
echo   exit 1
echo fi
echo echo "✅ Lint 通过"
) > "%HOOK_FILE%"

echo ✅ 配置完成！
echo.
echo 以后每次 git commit 都会自动运行 ESLint 检查
echo 不通过则阻止提交，避免 CI 失败
echo.
pause
