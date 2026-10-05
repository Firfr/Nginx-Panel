export const 默认主配置 = `## 设置运行 Nginx 的用户
user root;
# 设置工作进程数为自动（根据 CPU 核心数自动设置）
worker_processes auto;

# 错误日志 格式由 Nginx 固定字段组成，无法自定义
# 时间 [日志级别] 进程ID#线程ID: 连接ID 错误信息
error_log /var/log/nginx/error.log notice;
# 设置主进程 ID 文件的路径
pid /run/nginx.pid;

# 事件模块配置
events {
  # 每个工作进程的最大连接数
  worker_connections 1024;
}

## 非HTTP转发
stream {
  # 设置访问日志
  # 客户端IP[访问时间] 协议 状态码 发送字节 接收字节 会话时长
  log_format streamlog '$remote_addr[$time_local] '
    '$protocol $status $bytes_sent $bytes_received '
    '$session_time';

  # 设置访问日志的路径
  access_log /var/log/nginx/stream-access.log streamlog;

  #  包含stream目录下所有的 .conf 文件
  include /data/stream/*.conf;
}

# HTTP 模块配置
http {
  # 包含 MIME 类型定义文件
  include /data/mime.types;
  # 默认 MIME 类型
  default_type application/octet-stream;

  # 默认定义日志格式
  # 客户端IP - 基础认证用户名 [访问时间] "请求行" 状态码 响应字节数 "来源页" "客户端UA" "代理传递的真实访客 IP 链"
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
  '$status $body_bytes_sent "$http_referer" '
  '"$http_user_agent" "$http_x_forwarded_for"';

  # 设置访问日志的路径
  access_log /var/log/nginx/access.log main;

  # 关闭在响应头Server里输出Nginx版本号，安全加固，防止版本漏洞扫描
  server_tokens off;

  # 开启sendfile零拷贝，内核直接发送文件，减少用户态/内核态拷贝，静态文件提速
  sendfile   on;
  # 开启tcp_nopush：配合sendfile，攒够一定数据包再一次性发送，减少小包，提升吞吐量
  tcp_nopush on;       

  # 开启tcp_nodelay：长连接下关闭Nagle算法，小包立刻发送，降低延迟（适合API、动态请求）
  tcp_nodelay on;  

  # 域名哈希桶大小，域名很多、域名很长时调大，避免启动报错"could not build server_names_hash"
  server_names_hash_bucket_size 512;

  # 客户端请求header缓冲区大小。请求头超过这个会开临时文件；32k适合携带大Cookie、长请求头场景
  client_header_buffer_size 32k;

  # 客户端上传文件最大限制，POST/上传请求body不能超过50MB，超出返回413 Request Entity Too Large
  client_max_body_size 4G;

  # HTTP长连接超时时间：60秒，60s内没有新请求就断开TCP连接
  keepalive_timeout 60;
  # 单条长连接上，最多可以复用处理5000次请求，到达上限强制断开连接，防止单个连接长期占用资源
  keepalive_requests 5000;

  ## 启用 Gzip 压缩 默认没有开启
  gzip on;
  # 设置 Gzip 压缩的最低响应大小
  gzip_min_length 1k;
  # 设置 Gzip 缓冲区大小
  gzip_buffers 16 8k;
  # 设置压缩版本
  gzip_http_version 1.1;
  # 设置 Gzip 压缩级别（1-9，1 最快，9 最高压缩比）
  gzip_comp_level 5;
  # 设置 Gzip 压缩类型
  gzip_types text/plain text/css text/xml text/javascript
    application/json application/ld+json application/javascript
    application/x-javascript application/xml application/xhtml+xml
    application/rss+xml application/atom+xml application/wasm
    image/svg+xml font/ttf font/otf;
  # 设置 Gzip 压缩在 Vary 头中的值
  gzip_vary on;
  # 不管后端返回什么响应头，只要是代理转发的请求，全部开启压缩
  gzip_proxied   any;

  # 包含其他配置文件
  include /data/conf.d/*.conf;
}
`;

export const 默认MIME类型 = `types {
    text/html                                        html htm shtml;
    text/css                                         css;
    text/xml                                         xml;
    image/gif                                        gif;
    image/jpeg                                       jpeg jpg;
    application/javascript                           js mjs;
    application/atom+xml                             atom;
    application/rss+xml                              rss;

    text/mathml                                      mml;
    text/plain                                       txt;
    text/vnd.sun.j2me.app-descriptor                 jad;
    text/vnd.wap.wml                                 wml;
    text/x-component                                 htc;

    image/avif                                       avif;
    image/png                                        png;
    image/svg+xml                                    svg svgz;
    image/tiff                                       tif tiff;
    image/vnd.wap.wbmp                               wbmp;
    image/webp                                       webp;
    image/x-icon                                     ico;
    image/x-jng                                      jng;
    image/x-ms-bmp                                   bmp;

    font/woff                                        woff;
    font/woff2                                       woff2;

    application/java-archive                         jar war ear;
    application/json                                 json;
    application/mac-binhex40                         hqx;
    application/msword                               doc;
    application/pdf                                  pdf;
    application/postscript                           ps eps ai;
    application/rtf                                  rtf;
    application/vnd.apple.mpegurl                    m3u8;
    application/vnd.google-earth.kml+xml             kml;
    application/vnd.google-earth.kmz                 kmz;
    application/vnd.ms-excel                         xls;
    application/vnd.ms-fontobject                    eot;
    application/vnd.ms-powerpoint                    ppt;
    application/vnd.oasis.opendocument.graphics      odg;
    application/vnd.oasis.opendocument.presentation  odp;
    application/vnd.oasis.opendocument.spreadsheet   ods;
    application/vnd.oasis.opendocument.text          odt;
    application/vnd.openxmlformats-officedocument.presentationml.presentation
                                                     pptx;
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                                                     xlsx;
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
                                                     docx;
    application/vnd.wap.wmlc                         wmlc;
    application/wasm                                 wasm;
    application/x-7z-compressed                      7z;
    application/x-cocoa                              cco;
    application/x-java-archive-diff                  jardiff;
    application/x-java-jnlp-file                     jnlp;
    application/x-makeself                           run;
    application/x-perl                               pl pm;
    application/x-pilot                              prc pdb;
    application/x-rar-compressed                     rar;
    application/x-redhat-package-manager             rpm;
    application/x-sea                                sea;
    application/x-shockwave-flash                    swf;
    application/x-stuffit                            sit;
    application/x-tcl                                tcl tk;
    application/x-x509-ca-cert                       der pem crt;
    application/x-xpinstall                          xpi;
    application/xhtml+xml                            xhtml;
    application/xspf+xml                             xspf;
    application/zip                                  zip;

    application/octet-stream                         bin exe dll;
    application/octet-stream                         deb;
    application/octet-stream                         dmg;
    application/octet-stream                         iso img;
    application/octet-stream                         msi msp msm;

    audio/midi                                       mid midi kar;
    audio/mpeg                                       mp3;
    audio/ogg                                        ogg;
    audio/x-m4a                                      m4a;
    audio/x-realaudio                                ra;

    video/3gpp                                       3gpp 3gp;
    video/mp2t                                       ts;
    video/mp4                                        mp4;
    video/mpeg                                       mpeg mpg;
    video/quicktime                                  mov;
    video/webm                                       webm;
    video/x-flv                                      flv;
    video/x-m4v                                      m4v;
    video/x-mng                                      mng;
    video/x-ms-asf                                   asx asf;
    video/x-ms-wmv                                   wmv;
    video/x-msvideo                                  avi;
}
`;
