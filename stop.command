#!/bin/bash
echo "正在停止个人生活空间服务器..."
pkill -f "python3 -m http.server 3266" 2>/dev/null
echo "服务器已停止"
read -p "按回车键关闭此窗口..."
