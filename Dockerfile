# 编译服
FROM --platform=$BUILDPLATFORM docker.code.firfe.work/oven/bun:1.4.4-debian AS builder
ENV BUN_INSTALL_REGISTRY=http://npm.firfe.de5.net

COPY 公共代码 /app/公共代码
COPY 登录页面 /app/login
COPY web /app/web
COPY api /app/api

WORKDIR /app

RUN echo "编译登录页面"
RUN cd /app/login && bun i && bun run build

RUN echo "编译网页端"
RUN cd /app/web && bun i && bun run build

RUN echo "编译服务端"
RUN cd /app/api && bun i && bun run build

## 移动文件
RUN cp /app/login/dist/index.html /app/api/dist/login.html
RUN cp -r /app/web/dist /app/api/dist/web

## 设置权限
RUN chmod -R +r /app/api/dist

FROM docker.code.firfe.work/oven/bun:1.4.4-debian AS bun

# 最终镜像
FROM docker.code.firfe.work/nginx:1.30.6-trixie
ARG TARGETARCH

WORKDIR /app
COPY --from=builder /app/api/dist /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY --chmod=755 ncf-${TARGETARCH} /usr/local/bin/ncf
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

ENV LOG_LEVEL=info
ENV DATA_PATH=/data
ENV PORT=5193

VOLUME ["/data"]
EXPOSE 5193

LABEL 项目作者="B站 秦曱凧"
LABEL 主页="https://space.bilibili.com/17547201"
