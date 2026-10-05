# 服务端

负责管理 nginx 配置文件，与 nginx 交互。

- 环境 bun
- 框架 hono

## 统一返回格式

- 成功
  ```TypeScript
  interface 成功 {
    "状态": true,
    "信息"?: string,  // 附加信息
    "内容": any,  // 实际返回内容
  }
  ```
- 失败
  ```TypeScript
  interface 失败 {
    "状态": false,
    "信息": string,  // 失败原因
  }
  ```

下面的所有数据内容都特指成功情况下字段 `内容` 的值。

## 全局接口

### 格式化

- 使用软件 nginxconfigformattergo
  - 项目地址 https://github.com/rwx------/nginxconfigformattergo
  - 项目提供二进制文件，方便使用
- 路径: `POST` `/api/formatter`
  - 请求体为字符串类型，内容为需要格式化的问价内容，返回格式化后的内容
- 数据类型 `string`

### 服务器信息

在静态资源界面显示服务器面板和编辑器地址，方便跳转，通过环境变量设置

- 环境变量 可选
  - 面板
    - PANEL_NAME 名字
    - PANEL_URL 地址
  - 编辑器
    - EDIT_NAME 名字
    - EDIT_URL 地址
  - 地址
    - 可用是完整的地址，也可以从端口部分开始
    - 从端口部分开始的，前面部分和网页界面中的部分一致
- 路径: `GET` `/api/panel` `/api/edit`
- 数据
  ```TypeScript
  interface t_内容 {
    名称?: string;
    完整地址?: string; // 与下面的二选一，不会同时出现
    路径?: string;
  }
  ```

## nginx

文件操作只能是 `nginx.conf`  `mime.types` 操作方式只有 `查看`、`保存`、`使用默认`

### 版本

- 路径: `GET` `/api/nginx/version`
- 数据 `"版本号"`

### 相关操作

- 路径: `GET`
  - 状态 `/api/nginx/status`
  - 启动 `/api/nginx/start`
  - 停止 `/api/nginx/stop`
  - 重载 `/api/nginx/reload`
- 数据
  ```TypeScript
  interface t_内容 {
    状态: boolean; // ngixn 的运行状态
    pid: number | null;
    信息: string; // 原因
  }
  ```

### 重启

采用先停止，在启动的方式，返回值中的 `状态` 字段为重启的结果，不再是 Nginx 的运行结果。

- 路径: `GET` `/api/nginx/restart`
- 数据
  ```TypeScript
  interface t_内容 {
    状态: boolean; // Ngixn 的重启结果
    pid: number | null;
    信息: string; // 原因
  }
  ```

### 获取文件内容

- 路径: `GET` `/api/nginx/file/文件名`
- 数据类型 `string`

### 写入文件

- 路径: `PUT` `/api/nginx/file/文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】写入成功`

### 使用默认内容

- 路径: `POST` `/api/nginx/reset/文件名`
  - 没有请求体
- 数据类型 `文件【${文件名}】内容重置成功`

## HTTP 转发

所有配置位于 `/data/conf.d/` 目录下的后缀为 `.conf` 和 `.conf.no` 的文件。

`.conf.no` 后缀的为禁用状态配置。

### 获取配置列表

- 路径: `GET` `/api/http/file_list`
- 数据
  ```TypeScript
  type t_内容 string[] // 文件名数组
  ```

### 获取文件内容

- 路径: `GET` `/api/http/file/文件名`
- 数据类型 `string`

### 写入

- 路径: `PUT` `/api/http/file/文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】写入成功`

### 删除

- 路径: `DELETE` `/api/http/file/文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】删除成功`

### 重命名

- 路径: `PATCH` `/api/http/file/文件名/新文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】重命名成功`

## 非 HTTP 转发

所有配置位于 `/data/stream/` 目录下的后缀为 `.conf` 和 `.conf.no` 的文件。

`.conf.no` 后缀的为禁用状态配置。

### 获取配置列表

- 路径: `GET` `/api/stream/file_list`
- 数据
  ```TypeScript
  type t_内容 string[] // 文件名数组
  ```

### 获取文件内容

- 路径: `GET` `/api/stream/file/文件名`
- 数据类型 `string`

### 写入

- 路径: `PUT` `/api/stream/file/文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】写入成功`

### 删除

- 路径: `DELETE` `/api/stream/file/文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】删除成功`

### 重命名

- 路径: `PATCH` `/api/stream/file/文件名/新文件名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `文件【${文件名}】重命名成功`

## 证书

所有证书位于 `/data/ssl/` 目录下，结构如下：

```text
/data/ssl
├─ 域名         证书对应的域名或IP，泛域名 其中 * 替换成 _
   ├─ fullchain.pem  证书
   └─ privkey.pem    私钥
```

### 获取配置列表

- 路径: `GET` `/api/ssl/file_list`
- 数据
  ```TypeScript
  type t_内容 string[] // 文件名数组
  ```

### 获取文件内容

- 路径: `GET` `/api/ssl/file/域名`
- 数据
  ```TypeScript
  interface t_内容 {
    证书: string;
    私钥: string;
  }
  ```

### 写入 / 创建

- 路径: `PUT` `/api/ssl/file/域名`
- 请求体
  ```TypeScript
  interface t_内容 {
    证书: string;
    私钥: string;
  }
  ```
- 数据类型 `域名【${域名}】写入成功`

### 删除

- 路径: `DELETE` `/api/ssl/file/域名`
  - 请求体为字符串类型，文件的内容
- 数据类型 `域名【${域名}】删除成功`

## 基础认证

所有账号位于 `/data/htpasswd/` 目录下，每个账号一个文件，文件与账号同名，后缀 `txt` 。采用 `apr1` 算法。第一行为注释，内容为明文账号密码，

### 获取配置列表

- 路径: `GET` `/api/htpasswd/file_list`
- 数据
  ```TypeScript
  type t_内容 string[] // 文件名数组
  ```

### 获取文件内容

- 路径: `GET` `/api/htpasswd/file/域名`
- 数据 字符串类型

### 写入 / 创建

- 路径: `PUT` `/api/htpasswd/file/域名`
- 请求体为文件内容
- 数据类型 `域名【${域名}】写入成功`

### 删除

- 路径: `DELETE` `/api/htpasswd/file/文件`
  - 请求体为字符串类型，文件的内容
- 数据类型 `域名【${域名}】删除成功`

## 静态资源

> 静态资源只能查看目录列表，不能操作。问价操作，需要借助其他途径。

### 获取配置列表

- 路径: `GET` `/api/static/file_list`
- 数据
  ```TypeScript
  type t_内容 string[] // 文件名数组
  ```
