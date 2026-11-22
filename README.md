# my-nginx

在网页界面简单的管理和编辑nginx。并可以通过 Nginx 给没有账号的项目添加应该账号系统以及两步验证。

## 环境变量

| 名称 | 是否必须 | 默认值 | 说明 |
| ---- | -------- | ------ | ---- |
|      |          |        |      |

默认端口 5193 ，可通过环境变量 `PORT` 自定义

## 运行

```yaml
name: nginx-panel

services:
  nginx-panel:
    container_name: nginx-panel
    image: firfe/nginx-panel:1.0
    network_mode: host # bridge
    restart: always
    tty: true
    stdin_open: true
    cpus: 1
    mem_limit: 1G
    logging:
      options:
        max-size: "1M"
        max-file: "1"
    volumes:
      - ./data:/data
```
