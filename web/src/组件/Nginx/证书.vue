<script setup lang="ts">
import { ref } from "vue";
import { cmp_证书列表, const_菜单列表对象, ref_选中菜单 } from "../../全局共享数据";
import { fn获取菜单文件列表, fn鼠标滚轮横向滚动 } from "../../工具/其他工具";
import { fn发送请求 } from "../../工具/请求.ts";
import { Delete, Edit } from "@element-plus/icons-vue";
import Vue_添加证书 from "./操作弹窗/添加证书.vue";
import Vue_更新证书 from "./操作弹窗/更新证书.vue";

const ref_选中证书文件名 = ref("");
const ref_显示删除确认 = ref(false);
const ref_渲染添加弹窗 = ref(false);
const ref_渲染更新弹窗 = ref(false);

const fn添加 = () => {
  ref_渲染添加弹窗.value = true;
};

const fn更新 = (文件名: string) => {
  if (ref_选中菜单.value?.名称 !== "证书" || !文件名) return;
  ref_选中证书文件名.value = 文件名;
  ref_渲染更新弹窗.value = true;
};

const fn删除弹窗 = async (文件名: string) => {
  if (ref_选中菜单.value?.名称 !== "证书" || !文件名) return;

  ref_选中证书文件名.value = 文件名;
  ref_显示删除确认.value = true;
};
const fn删除 = async () => {
  if (ref_选中菜单.value?.名称 !== "证书" || !ref_选中证书文件名.value) return;

  const 请求结果 = await fn发送请求(
    "delete",
    `${const_菜单列表对象.证书.路径}/file/${ref_选中证书文件名.value}`,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`证书 ${ref_选中证书文件名.value} 删除成功！`);

  ref_选中证书文件名.value = "";
  ref_显示删除确认.value = false;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};
</script>

<template>
  <div class="证书 分类内容 卡片容器父级">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <el-tag>证书: {{ cmp_证书列表.length }} 张</el-tag>
        <el-tag
          >未过期:
          {{ cmp_证书列表.filter((证书) => 证书.到期天数 !== null && 证书.到期天数 > 0).length }}
          张</el-tag
        >
        <el-tooltip effect="dark" placement="top">
          <el-tag>说明</el-tag>
          <template #content>
            所有文件位于目录 /data/ssl 目录下，位置固定！<br />
            每个目录一个证书，目录名就是证书的域名！<br />
            (泛域名证书用 _ 代替 *)。！<br />
            证书目录中，文件名称固定：！<br />
            证书链【fullchain.pem】，私钥【privkey.pem】。
          </template>
        </el-tooltip>
        <el-button @click="fn获取菜单文件列表(ref_选中菜单!, true)" type="primary" size="small">
          刷新
        </el-button>
        <el-button @click="fn添加" type="success" size="small">添加</el-button>
      </div>
    </div>

    <div v-if="cmp_证书列表.length === 0">无证书</div>
    <div v-else class="卡片容器">
      <div class="卡片" v-for="证书 in cmp_证书列表">
        <div class="标题">
          <div>{{ 证书.文件名称.replace(/^_/, "*") }}</div>
          <template v-if="证书.到期天数 === null"></template>
          <el-tag v-else-if="证书.到期天数 >= 0" type="success">{{ 证书.到期天数 }}</el-tag>
          <el-tag v-else type="danger">{{ -证书.到期天数 }}</el-tag>
        </div>
        <div class="时间">
          <el-tag>{{ 证书.生效时间.split(" ")[0] || "-" }}</el-tag>
          =>
          <el-tag type="danger">{{ 证书.到期时间.split(" ")[0] || "-" }}</el-tag>
        </div>
        <div class="域名">
          <el-tag v-for="证书域名 in 证书.域名">{{ 证书域名 }}</el-tag>
        </div>
        <div class="操作">
          <el-button class="小边距" @click="fn删除弹窗(证书.文件名称)" type="danger" size="small">
            删除&nbsp;
            <el-icon><Delete /></el-icon>
          </el-button>

          <el-button class="小边距" @click="fn更新(证书.文件名称)" type="primary" size="small">
            更新&nbsp;
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="ref_显示删除确认"
    :title="`确定要删除证书文件 ${ref_选中证书文件名} 吗？`"
    align-center
    append-to-body
    class="不换行"
  >
    <div style="display: flex; flex-direction: column; align-items: center">
      <div>证书删除后如果有配置还在使用会报错！</div>

      <el-button @click="fn删除" type="danger"> 确定删除 </el-button>
    </div>
  </el-dialog>

  <Vue_添加证书 v-if="ref_渲染添加弹窗" v-model="ref_渲染添加弹窗" />
  <Vue_更新证书
    v-if="ref_渲染更新弹窗"
    v-model="ref_渲染更新弹窗"
    :证书文件名="ref_选中证书文件名"
  />
</template>

<style scoped>
.证书 {
  .卡片容器 .卡片 {
    & > div {
      display: flex;
      align-items: center;
      gap: var(--间距);
    }
    .标题,
    .时间,
    .操作 {
      justify-content: space-between;
    }
  }
}
</style>
