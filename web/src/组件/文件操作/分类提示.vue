<script setup lang="ts">
import { computed } from "vue";
import { ref_选中菜单 } from "../../工具/全局共享数据";

const cmp_提示 = computed(() => {
  let 返回值: string[] = [];

  if (!ref_选中菜单.value) return 返回值;

  switch (ref_选中菜单.value.名称) {
    case "配置":
      返回值.push("主配置文件，谨慎修改，防止出意外！");
      break;
    case "conf.d":
      返回值.push("所有文件位于目录 /data/conf.d 目录下，位置固定！");
      返回值.push("文件后缀 .conf 为正常文件，后缀为 .conf.no 的为禁用文件。");
      返回值.push("新创建或重命名的文件名在去除后缀后不可重复！");
      break;
    case "stream":
      返回值.push("TCP / UDP 端口转发配置！所有文件位于目录 /data/stream 目录下，位置固定！");
      返回值.push("文件后缀 .conf 为正常文件，后缀为 .conf.no 的为禁用文件。");
      返回值.push("新创建或重命名的文件名在去除后缀后不可重复！");
      break;
    case "证书":
      返回值.push("所有文件位于目录 /data/ssl 目录下，位置固定！");
      返回值.push("每个目录一个证书，目录名就是证书的域名(泛域名证书用 _ 代替 *)。");
      返回值.push("证书目录中，文件名称固定：证书链【fullchain.pem】，私钥【privkey.pem】。");
      break;
    case "基本认证":
      返回值.push("所有文件位于目录 /data/htpasswd 目录下，位置固定！");
      返回值.push("Nginx 基本认证，每个文件一个账号。");
      返回值.push("第一行注释方式展示明文账号密码：# 账号 密码");
      break;
    case "静态资源":
      返回值.push("仅可查看目录，不可操作。所有资源位于 /data/static 目录下。");
      返回值.push("资源管理需借助其他工具，例如：1Panel、SMB 等。");
      break;
  }

  return 返回值;
});
</script>

<template>
  <div class="文件提示">
    <el-tag v-for="提示 in cmp_提示">{{ 提示 }}</el-tag>
  </div>
</template>

<style scoped>
.文件提示 {
  display: flex;
  flex-direction: column;
  align-items: center;
  & > * {
    margin-bottom: 4px;
  }
}
</style>
