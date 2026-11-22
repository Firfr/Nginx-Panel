import { computed, reactive, ref } from "vue";
import type { t_菜单, t_菜单名称 } from "./类型";
import { fn获取菜单文件列表 } from "./工具/其他工具";
import type { t_证书信息, t_账号总览信息, t_配置 } from "@公共代码/类型";

export const const_菜单列表: t_菜单[] = [
  { 名称: "账号", 路径: "user", 描述: "用户名列表" },
  { 名称: "配置", 路径: "nginx", 描述: "" },
  { 名称: "conf.d", 路径: "http", 描述: "" },
  { 名称: "stream", 路径: "stream", 描述: "" },
  { 名称: "证书", 路径: "ssl", 描述: "" },
  { 名称: "基本认证", 路径: "htpasswd", 描述: "" },
  { 名称: "静态资源", 路径: "static", 描述: "仅可查看目录，不可操作" },
];
export const const_菜单列表对象: Record<t_菜单名称, t_菜单> = Object.fromEntries(
  const_菜单列表.map((item) => [item.名称, item]),
) as Record<t_菜单名称, t_菜单>;

export const ref_配置 = ref<t_配置>({ 端口: 0 });

export const ref_选中菜单 = ref<t_菜单 | null>(null);

export const rea_菜单内容数据 = reactive(
  new Map<t_菜单名称, (string | t_证书信息)[]>([["配置", ["nginx.conf", "mime.types"]]]),
);

export const cmp_证书列表 = computed<t_证书信息[]>(() => {
  if (!rea_菜单内容数据.has("证书")) {
    fn获取菜单文件列表(const_菜单列表对象.证书);
    return [];
  }

  return rea_菜单内容数据.get("证书") as t_证书信息[];
});

export const cmp_基本认证列表 = computed<string[]>(() => {
  if (!rea_菜单内容数据.has("基本认证")) {
    fn获取菜单文件列表(const_菜单列表对象.基本认证);
    return [];
  }

  return rea_菜单内容数据.get("基本认证") as string[];
});

export const cmp_当前文件列表 = computed<string[]>(() => {
  if (!ref_选中菜单.value) return [];

  if (!rea_菜单内容数据.has(ref_选中菜单.value.名称)) {
    fn获取菜单文件列表(ref_选中菜单.value);
    return [];
  }

  return rea_菜单内容数据.get(ref_选中菜单.value.名称) as string[];
});

export const cmp_当前文件列表_无后缀 = computed<Set<string>>(() => {
  const 返回值 = new Set<string>();
  for (let 索引 = 0; 索引 < cmp_当前文件列表.value.length; 索引++) {
    const 文件名 = cmp_当前文件列表.value[索引];
    返回值.add(文件名.replace(/\.(conf\.no|conf|txt)$/, ""));
  }
  return 返回值;
});

export const ref_选中文件 = ref<string>("");

export const ref_账号总览 = ref<null | t_账号总览信息[]>(null);

export const const_示例 = {
  静态: `server {
  listen 端口;
  # 监听 IPv6
  # listen [::]:端口;
  #server_name 域名，多个空格分割，可不写;
  # 静态文件实际存放路径
  root /data/static/项目名称;
  # 首页文件名称
  index index.html;
}`,
  转发: `server {
  # 简单转发
  listen 端口;
  # 监听 IPv6
  # listen [::]:端口;
  server_name 域名;

  # 请求体的最大允许大小
  client_max_body_size 10G;

  # 代理读取超时
  proxy_read_timeout 3600s;

  # 客户端请求体读取超时
  client_body_timeout 3600s;

  location / {
    proxy_pass 转发路径;

    ## 向后端服务器传递的请求头
    proxy_set_header Host $host;
    ## 向端服务器真实的客户端 IP 地址
    proxy_set_header X-Real-IP $remote_addr;
    ## 记录客户端 IP 地址和任何中间代理服务器的 IP 地址链
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    ## 向后端服务器原始请求使用的协议（HTTP 或 HTTPS）
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}`,
  证书: (域名: string) => `server {
  # 设置证书
  listen 端口 ssl;
  # 监听 IPv6
  # listen [::]:端口 ssl;
  # 开启 http2
  # http2 on;
  server_name ${域名.replace(/^_/, "*")};

  ssl_certificate /data/ssl/${域名}/fullchain.pem;
  ssl_certificate_key /data/ssl/${域名}/privkey.pem;

  # 指定服务器支持的 TLS/SSL 协议版本
  # TLSv1.1 已弃用
  ssl_protocols TLSv1.2 TLSv1.3;

  # 设置 SSL/TLS 会话缓存的超时时间
  ssl_session_timeout 1h;
  # 开启共享SSL会话缓存，容量10MB
  ssl_session_cache shared:SSL:10m;
  # 缓存中的SSL会话参数有效期为1天
  ssl_session_timeout 1d;
  # 关闭会话票据（Session Ticket），避免票据密钥轮换，提升前向安全
  ssl_session_tickets off;

  # 在 TLS 握手时，让服务器（Nginx）优先选择加密套件，而不是客户端
  # 启用 TLS 1.3 后建议设为 off
  ssl_prefer_server_ciphers on;

  # 在 TLS 握手时优先使用的加密套件
  ssl_ciphers \\
    ECDHE-ECDSA-AES128-GCM-SHA256:\\
    ECDHE-RSA-AES128-GCM-SHA256:\\
    ECDHE-ECDSA-AES256-GCM-SHA384:\\
    ECDHE-RSA-AES256-GCM-SHA384:\\
    ECDHE-ECDSA-CHACHA20-POLY1305:\\
    ECDHE-RSA-CHACHA20-POLY1305;

  # 其他配置
}`,
  基本认证: (文件名: string) => `server {
  listen 端口;
  # 监听 IPv6
  # listen [::]:端口;
  #server_name 域名，多个空格分割，可不写;

  # 基本认证
  auth_basic "Restricted Access";
  auth_basic_user_file /data/htpasswd/${文件名};

  # 静态文件实际存放路径
  root /data/static/项目名称;
  # 首页文件名称
  index index.html;
}`,
  独立账号: (用户名: string) => `server {
  listen 端口;
  # 监听 IPv6
  # listen [::]:端口;
  #server_name 域名，多个空格分割，可不写;

  # 前端访问 /login → 转发到后端 /auth/login
  # GET 返回登录页，POST 处理登录
  location = /login {
    proxy_pass http://127.0.0.1:${ref_配置.value.端口}/auth/login;
    proxy_set_header Cookie $http_cookie;
    proxy_pass_header Set-Cookie;
    proxy_set_header user "${用户名}";
  }

  # 前端访问 /logout → 转发到后端 /auth/logout
  location = /logout {
    proxy_pass http://127.0.0.1:${ref_配置.value.端口}/auth/logout;
    proxy_set_header Cookie $http_cookie;
    proxy_pass_header Set-Cookie;
    proxy_set_header user "${用户名}";
  }

  # 认证子请求：内部调用，外部不可直接访问
  # 验证登录状态
  location = /auth/verify {
    internal;
    proxy_pass http://127.0.0.1:${ref_配置.value.端口}/auth/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header Cookie $http_cookie;
    proxy_set_header user "${用户名}";
  }

  # 未登录跳转
  location @login {
    return 302 /login;
  }
  
  location @auth_error {
    return 503 "认证服务不可用";
  }

  # 受保护站点：先认证，再代理
  location / {
    auth_request /auth/verify;
    
    error_page 401 = @login;
    error_page 403 = @login;

    error_page 500 502 503 504 = @auth_error;

    proxy_pass 站点地址;
  }
}`,
  TCP: `server {
  # 监听本地端口 协议，不写默认TCP
  listen 12345;
  # 直接指定目标服务器的 IP 和端口
  proxy_pass 192.168.1.10:12345;
  # 超时时间
  proxy_timeout 300s;
}`,
  UDP: `server {
  listen 12345 udp;
  proxy_pass 192.168.1.10:12345;
  proxy_timeout 300s;
}`,
};
