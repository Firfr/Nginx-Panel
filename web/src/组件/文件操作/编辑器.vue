<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { basicEditor, readonlyEditor } from "prism-code-editor/setups";
import "prism-code-editor/prism/languages/nginx";

type t_编辑器实例 = ReturnType<typeof basicEditor>;

const ref_文件内容 = defineModel<string>("文件内容", { default: "" });
const ref_是否编辑 = defineModel<boolean>("是否编辑", { default: false });

const 参数 = withDefaults(
  defineProps<{
    语言类型?: string;
    主题?: string;
  }>(),
  {
    语言类型: "nginx",
    主题: "github-dark",
  },
);

const 事件 = defineEmits<{
  (e: "就绪", 编辑器: t_编辑器实例): void;
}>();

const ref_编辑框 = ref<HTMLElement>();
let let_编辑器实例: t_编辑器实例 | null = null;

const fn创建编辑器 = () => {
  if (!ref_编辑框.value) return;
  let_编辑器实例?.remove();
  let_编辑器实例 = null;

  nextTick(() => {
    if (!ref_编辑框.value) return;

    let_编辑器实例 = ref_是否编辑.value
      ? basicEditor(ref_编辑框.value, {
          language: 参数.语言类型,
          theme: 参数.主题,
          value: ref_文件内容.value,
          onUpdate: () => {
            ref_文件内容.value = let_编辑器实例!.value;
          },
        })
      : readonlyEditor(ref_编辑框.value, {
          language: 参数.语言类型,
          theme: 参数.主题,
          value: ref_文件内容.value,
          readOnly: true,
          onUpdate: () => {
            // 检测到变更时，强制回滚到原始内容
            const 当前值 = let_编辑器实例!.value;
            if (当前值 !== ref_文件内容.value) {
              let_编辑器实例!.setOptions({ value: ref_文件内容.value });
            }
          },
        });

    const shadow = ref_编辑框.value.shadowRoot;
    if (shadow) {
      const style = document.createElement("style");
      style.textContent = `:host { height: 100%; }`;
      shadow.appendChild(style);
    }

    事件("就绪", let_编辑器实例);
  });
};

// 组件挂载完成后执行的回调
onMounted(() => {
  fn创建编辑器();
});
// 组件实例卸载之前调用的回调
onBeforeUnmount(() => {
  let_编辑器实例?.remove();
  let_编辑器实例 = null;
});

watch(ref_是否编辑, () => {
  fn创建编辑器();
});

watch(ref_文件内容, (值) => {
  if (let_编辑器实例 && 值 !== let_编辑器实例.value) {
    let_编辑器实例.setOptions({ value: 值 });
  }
});
</script>

<template>
  <div ref="ref_编辑框" style="display: grid"></div>
</template>
