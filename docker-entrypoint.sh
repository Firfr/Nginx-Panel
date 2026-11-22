#!/bin/bash

# 基础镜像使用 基于Debian的

chmod +x /usr/local/bin/bun
ln -s /usr/local/bin/bun /usr/local/bin/bunx
chmod +x /usr/local/bin/bunx
chmod +x /usr/local/bin/ncf

# 处理 nginx 日志软链接
for logfile in /var/log/nginx/access.log /var/log/nginx/error.log; do
  if [ -L "$logfile" ]; then
    target="$(readlink "$logfile")"
    if [ "$target" = "/dev/stdout" ] || [ "$target" = "/dev/stderr" ]; then
      rm -f "$logfile"
      touch "$logfile"
      echo "[init] 已将 $logfile 从软链接 $target 替换为真实文件"
    fi
  fi
done

cd /app

exec bun index.js
