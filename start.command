#!/bin/bash
cd "$(dirname "$0")"
cd outputs/personal-space-offline

echo "========================================="
echo "  个人生活空间"
echo "  正在启动服务器..."
echo "  浏览器将自动打开 http://localhost:3266"
echo "  关闭此窗口即可停止服务器"
echo "========================================="

open "http://localhost:3266"
python3 -m http.server 3266
