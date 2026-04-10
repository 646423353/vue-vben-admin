<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage } from 'element-plus';

import { CaseRecordUpdateApi } from '#/api/core/case-record';

import DraggableUploadList from '../components/DraggableUploadList.vue';

const emit = defineEmits(['success']);

const id = ref('');
const fileList = ref<any[]>([]);
const uploadListRef = ref();
const originalFiles = ref<any[]>([]);

const [Modal, modalApi] = useVbenModal({
  title: '补传图像文件',
  fullscreen: true,
  showConfirmButton: false,
  cancelText: '关闭',
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data?.caseId) {
        id.value = data.caseId;
      }
      if (data?.files) {
        fileList.value = data.files || [];
        // Deep clone for comparison
        originalFiles.value = structuredClone(data.files || []);
      }
    }
  },
});

const isDeepEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

function handleUpdateFiles() {
  const files = uploadListRef.value?.getTbCaseFiles() || [];

  // 校验标签
  const invalidFile = files.find((f: any) => !f.cateId);
  if (invalidFile) {
    ElMessage.warning(`请为文件 "${invalidFile.title}" 选择标签`);
    return;
  }

  // 格式化对比
  const normalizeFile = (list: any[]) =>
    list.map((f) => ({
      cateId: f.cateId,
      url: f.url,
      title: f.title,
      id: f.id,
    }));

  const currentFilesNorm = normalizeFile(files);
  const originalFilesNorm = normalizeFile(originalFiles.value);

  const payload: any = {
    id: Number(id.value),
    // 仅提交变更后的文件列表
    files: isDeepEqual(currentFilesNorm, originalFilesNorm) ? [] : files,
    zts: [],
  };

  CaseRecordUpdateApi(payload)
    .then(() => {
      ElMessage.success('图像文件补传成功');
      emit('success');
      modalApi.close();
    })
    .catch((error) => {
      console.error(error);
      ElMessage.error('更新失败');
    });
}

function handleTagChange() {
  const files = uploadListRef.value?.getTbCaseFiles() || [];
  const allTagged = files.every((f: any) => f.cateId);
  if (allTagged && files.length > 0) {
    // 自动保存逻辑可选，这里保持与原弹窗一致
    // handleUpdateFiles();
  }
}
</script>

<template>
  <Modal>
    <div class="min-h-screen space-y-6 bg-gray-50 p-4 dark:bg-slate-900">
      <div
        class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
      >
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800 dark:text-gray-100"
        >
          更新图像文件信息
        </div>

        <DraggableUploadList
          :id="id"
          :files="fileList"
          ref="uploadListRef"
          :allow-delete="false"
          @tag-change="handleTagChange"
        />

        <div class="mt-4 flex justify-end">
          <ElButton type="primary" plain @click="handleUpdateFiles">
            更新
          </ElButton>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped></style>
