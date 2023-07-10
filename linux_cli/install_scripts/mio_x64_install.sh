#!/bin/bash

# 检查系统架构
if [ "$(uname -m)" != "x86_64" ]; then
  echo "错误：mio 只支持 64 位系统。"
  exit 1
fi

# 检查是否具有足够的权限
if [ "$EUID" -ne 0 ]; then
  echo "错误：请使用管理员权限运行此脚本。"
  exit 1
fi

# 下载 mio 文件
wget https://drive.fcip.xyz/directlink/fc1/mio

# 添加执行权限
chmod +x mio

# 将 mio 文件移动到 /usr/local/bin 目录下（可根据需要修改目标路径）
mv mio /usr/local/bin/

echo "安装完成！"


