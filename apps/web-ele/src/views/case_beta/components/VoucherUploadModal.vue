<script lang="ts" setup>
import type { UploadUserFile } from 'element-plus';

import type { TbCaseFinal } from '#/api/core/case-final';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElUpload } from 'element-plus';

import { updateCaseFinalApi } from '#/api/core/case-final';

const emit = defineEmits(['success']);

const uploadUrl = import.meta.env.VITE_UPLOAD_URL;
const fileList = ref<UploadUserFile[]>([]);
const uploading = ref(false);
const currentRecord = ref<null | TbCaseFinal>(null);
const caseId = ref<string>();

// 解析现有附件
const parseAttachments = (attatchsStr?: string) => {
  if (!attatchsStr) return [];
  try {
    const parsed = JSON.parse(attatchsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    if (!currentRecord.value?.id) {
      ElMessage.error('无法保存：未找到赔付记录ID');
      return;
    }

    uploading.value = true;

    try {
      // 构建附件数据
      const attachments = fileList.value.map((file) => ({
        url: (file.response as any)?.result || file.url,
        name: file.name,
        type: file.raw?.type || '',
      }));

      // 调用更新接口
      await updateCaseFinalApi({
        id: currentRecord.value.id,
        caseId: caseId.value,
        attatchs: JSON.stringify(attachments),
      });

      ElMessage.success('保存成功');
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('Save failed:', error);
      ElMessage.error('保存失败');
    } finally {
      uploading.value = false;
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ caseId?: string; record: TbCaseFinal }>();
      currentRecord.value = data.record;
      caseId.value = data.caseId;

      // 初始化现有附件
      if (currentRecord.value?.attatchs) {
        const existingAttachments = parseAttachments(
          currentRecord.value.attatchs,
        );
        fileList.value =
          existingAttachments.length > 0
            ? existingAttachments.map((att: any, index: number) => ({
                name: att.name || `文件${index + 1}`,
                url: att.url,
                uid: Date.now() + index,
                status: 'success' as const,
              }))
            : [];
      } else {
        fileList.value = [];
      }
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal class="w-[600px]" title="赔付凭证上传">
    <div class="flex flex-col gap-4 p-4">
      <div class="rounded bg-blue-50 p-3 text-sm text-blue-600">
        <p class="font-bold">上传说明：</p>
        <p>1. 支持图片和PDF格式文件。</p>
        <p>2. 可上传多个文件。</p>
        <p>3. 点击确认后保存到系统。</p>
      </div>

      <ElUpload
        v-model:file-list="fileList"
        :action="uploadUrl"
        :multiple="true"
        :limit="10"
        accept="image/*,.pdf"
        list-type="picture-card"
        :disabled="uploading"
      >
        <div class="flex flex-col items-center justify-center">
          <i class="el-icon-plus text-2xl" />
          <span class="mt-1 text-xs">点击上传</span>
        </div>
      </ElUpload>
    </div>
  </Modal>
</template>
