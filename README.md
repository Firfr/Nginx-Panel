# my-nginx

在网页界面简单的管理和编辑nginx。

目前只有 amd64 因为 Nginx 格式化程序只支持 amd64

## 运行

- 后端编译后得到文件 index.js ，移动到 app 目录下
- 前端编译后得到目录 dist ，在重命名为 web ，移动到 app 目录下

```yaml
name: nginx-panel

services:
  nginx-panel:
    container_name: nginx-panel
    image: docker.code.firfe.work/nginx:1.31.6-trixie
    network_mode: host # bridge
    restart: always
    tty: true
    stdin_open: true
    cpus: 1
    mem_limit: 1G
    logging:
      options:
        max-size: "100k"
        max-file: "1"
    environment:
      TZ: Asia/Shanghai
      TIME_ZONE: Asia/Shanghai
      PORT: 1234
      PANEL_NAME: 1Panel
      PANEL_URL: 1024
      EDIT_NAME: CodeServer
      EDIT_URL: 1025
    # ports:
    #   - 80:80
    #   - 443:443
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - ./ncf:/usr/local/bin/ncf
      - ./bun:/usr/local/bin/bun
      - ./bun:/usr/local/bin/bunx
      - ./docker-entrypoint.sh:/docker-entrypoint.sh
      - ./app:/app
      - ./data:/data

```
