# my-nginx

在网页界面简单的管理和编辑nginx。并可以通过 Nginx 给没有账号的项目添加应该账号系统以及两步验证。

## 环境变量

| 名称       | 是否必须 | 默认值   | 说明       |
| ---------- | -------- | -------- | ---------- |
| PORT       | 否       | 5193     | 监听端口   |
| HOST       | 否       | 所有地址 | 监听地址   |
| LOG_LEVEL  | 否       | info     | 日志等级   |
| PANEL_NAME | 否       | 无       | 面板名称   |
| PANEL_URL  | 否       | 无       | 面板地址   |
| EDIT_NAME  | 否       | 无       | 编辑器名称 |
| EDIT_URL   | 否       | 无       | 编辑器地址 |

上面的 面板/编辑器 地址中如果协议和主机与本软件相同可以只写端口。

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
    # environment:
    #   PORT: 1234
    #   PANEL_NAME: 飞牛
    #   PANEL_URL: 5666
    logging:
      options:
        max-size: "1M"
        max-file: "1"
    volumes:
      - ./data:/data
```
