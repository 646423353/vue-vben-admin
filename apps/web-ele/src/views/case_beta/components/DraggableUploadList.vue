<script lang="ts" setup>
import type { UploadFile, UploadProps, UploadUserFile } from 'element-plus';

import type { TbCaseFiles } from '#/api/core/case-record';

import { computed, onMounted, ref, watch } from 'vue';

import { createIconifyIcon, UiwCloudUpload } from '@vben/icons';

import { useWindowSize } from '@vueuse/core';
import {
  ElForm,
  ElFormItem,
  ElIcon,
  ElImageViewer,
  ElMessage,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';
import moment from 'moment';

import { CaseSetApi } from '#/api/core/case-set';
import { requestClient } from '#/api/request';

import { useWeCom } from '../composables/useWeCom';

interface FileResponse {
  result: string;
}

interface ExtendedUploadFile extends UploadUserFile {
  tag?: string;
  uploadTime?: string;
  fileSize?: string;
  isError?: boolean;
  id?: number | string;
}

export interface UploadForm {
  files?: TbCaseFiles[];
}

interface Props {
  files?: TbCaseFiles[];
  id?: number | string;
  propPrefix?: string;
  readonly?: boolean;
  allowDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  files: () => [],
  id: '',
  propPrefix: '',
  readonly: false,
  allowDelete: true,
});

const emit = defineEmits(['update:files', 'tagChange']);

const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

const fileList = ref<ExtendedUploadFile[]>([]);

const tagOptions = ref<any[]>([]);

const { width } = useWindowSize(); // Cleaned up width usage if unused, but keeping it for isMobileWeCom

const { isWeCom, initSdk, chooseImage, getLocalImgData } = useWeCom();

const isMobileWeCom = computed(() => {
  return width.value < 768 && isWeCom();
});

// Helper to convert Base64 to Blob
const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mimeMatches = arr[0]?.match(/:(.*?);/);

  // Handle Android case where prefix might be missing
  let mime = 'image/jpeg';
  let bstr = '';

  if (mimeMatches && mimeMatches[1] && arr[1]) {
    mime = mimeMatches[1];
    bstr = atob(arr[1]);
  } else {
    // Assume raw base64 from Android WeCom is jpeg
    // If there is no comma, the whole string might be base64
    bstr = atob(dataurl.includes(',') ? arr[1] || '' : dataurl);
  }

  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.codePointAt(n) ?? 0;
  }
  return new Blob([u8arr], { type: mime });
};

const handleWeComUpload = async () => {
  try {
    const res: any = await chooseImage();
    const localIds = res.localIds || res.mediaIds;

    if (localIds && localIds.length > 0) {
      const total = localIds.length;
      let successCount = 0;

      for (const localId of localIds) {
        try {
          let base64Data = await getLocalImgData(localId);
          // Normalization for Android (sometimes missing header)
          if (!base64Data.startsWith('data:image')) {
            base64Data = `data:image/jpeg;base64,${base64Data}`;
          }

          const blob = dataURLtoBlob(base64Data);
          const file = new File([blob], `wecom_image_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          const formData = new FormData();
          formData.append('file', file);

          // Upload
          const uploadRes: any = await requestClient.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            baseURL: '',
          });

          // Mock UploadFile object for handleSuccess
          const mockUploadFile = {
            uid: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            status: 'success',
          } as any;

          handleSuccess({ result: uploadRes } as any, mockUploadFile, []);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload localId ${localId}`, error);
        }
      }

      if (successCount === total) {
        ElMessage.success(`成功上传 ${successCount} 张图片`);
      } else {
        ElMessage.warning(
          `上传完成: 成功 ${successCount} 张, 失败 ${total - successCount} 张`,
        );
      }
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('启动选图失败或上传出错');
  }
};

onMounted(async () => {
  initSdk();
  try {
    const res = await CaseSetApi.getFileCateList();
    tagOptions.value = res
      .filter((item) => item.status !== 0)
      .map((item) => ({
        label: item.title,
        value: String(item.id),
      }));
  } catch (error) {
    console.error(error);
  }
});

const getTagName = (value: number | string) => {
  return (
    tagOptions.value.find((opt: any) => opt.value === value)?.label || value
  );
};

const beforeImgUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const validExtensions = ['png', 'jpeg', 'jpg'];
  const validMimeTypes = ['image/png', 'image/jpeg'];

  if (!rawFile) return false;

  const rawFileTypeName = rawFile?.name?.split('.').pop()?.toLowerCase();
  const isImageOrPdf =
    validExtensions.includes(rawFileTypeName || '') ||
    validMimeTypes.includes(rawFile.type);

  const isLt2M = rawFile.size / 1024 / 1024 < 20;

  if (!isImageOrPdf) {
    await ElMessage.error('请上传图片格式文件');
  }
  if (!isLt2M) {
    await ElMessage.error('文件大小不能超过 20MB');
  }

  return isImageOrPdf && isLt2M;
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
};

const handleSuccess: UploadProps['onSuccess'] = (
  response: FileResponse,
  uploadFile,
) => {
  if (!response || !response.result) {
    ElMessage.error('上传失败，请重试');
    return;
  }

  // Find the file in the list and update it
  const fileItem = fileList.value.find((f) => f.uid === uploadFile.uid);

  if (fileItem) {
    fileItem.url = response.result;
    fileItem.uploadTime = moment().format('YYYY-MM-DD HH:mm:ss');
    fileItem.fileSize = formatFileSize(uploadFile.size || 0);
    fileItem.tag = '';
    fileItem.isError = false;
  } else {
    // If not found (e.g. v-model sync issue), add it manually
    fileList.value.push({
      uid: uploadFile.uid,
      name: uploadFile.name,
      url: response.result,
      status: 'success',
      uploadTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      fileSize: formatFileSize(uploadFile.size || 0),
      tag: '',
      isError: false,
    } as ExtendedUploadFile);
  }
  ElMessage.success('上传成功');
};

const handleRemove = (file: ExtendedUploadFile | UploadFile) => {
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
};

const previewVisible = ref(false);
const previewList = ref<string[]>([]);

const handlePreview = (file: ExtendedUploadFile | UploadFile) => {
  if (file.url) {
    previewList.value = [file.url];
    previewVisible.value = true;
  }
};

const getData = () => {
  // We no longer build legacy fields.
  // If needed for some legacy call, return empty, or ideally remove this function if unused.
  // But defineExpose keeps it. Let's return mapped files for now or empty.
  // Actually, getTbCaseFiles is the main one used now.
  return {};
};

const getTbCaseFiles = () => {
  return fileList.value.map((file) => ({
    cateId: file.tag, // ID (number/string from API)
    cateName: getTagName(file.tag || ''),
    fileSize: file.fileSize,
    title: file.name,
    url: file.url,
    comments: '',
    id: file.id,
  }));
};

const lastEmitted = ref('');

// Sync back to parent
watch(
  fileList,
  () => {
    const data = getTbCaseFiles();
    const json = JSON.stringify(data);
    if (lastEmitted.value !== json) {
      lastEmitted.value = json;
      emit('update:files', data);
    }
  },
  { deep: true },
);

defineExpose({
  getData,
  getTbCaseFiles,
});

// Initialize from props
// Initialize from props
watch(
  () => props.files,
  (newFiles) => {
    if (Array.isArray(newFiles)) {
      // Avoid infinite loop if the update comes from our own emit
      const json = JSON.stringify(newFiles);
      if (lastEmitted.value === json) {
        return;
      }

      lastEmitted.value = json;

      const newFileList: ExtendedUploadFile[] = [];

      (newFiles as TbCaseFiles[]).forEach((item) => {
        newFileList.push({
          name: item.title || item.url || '未命名',
          url: item.url!,
          uid: Date.now() + Math.random(),
          status: 'success',
          tag: item.cateId, // Use cateId as tag (which is the option value)
          uploadTime: item.created
            ? moment(Number(item.created)).format('YYYY-MM-DD HH:mm:ss')
            : moment().format('YYYY-MM-DD HH:mm:ss'),
          fileSize: item.fileSize || '未知大小',
          isError: false,
          id: item.id,
        });
      });

      fileList.value = newFileList;
    } else {
      fileList.value = [];
    }
  },
  { immediate: true, deep: true },
);

const AntdCloseOutlined = createIconifyIcon('ant-design:close-outlined');
</script>

<template>
  <div class="w-full">
    <!-- Drag and Drop Area -->
    <div
      v-if="isMobileWeCom"
      class="el-upload-dragger"
      @click="handleWeComUpload"
    >
      <ElIcon class="el-icon--upload"><UiwCloudUpload /></ElIcon>
      <div class="el-upload__text">点击上传 (企业微信)</div>
    </div>

    <ElUpload
      v-else-if="!readonly"
      v-model:file-list="fileList"
      :action="uploadUrl"
      :before-upload="beforeImgUpload"
      :on-success="handleSuccess"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :show-file-list="false"
      drag
      multiple
      accept=".jpg,.jpeg,.png,image/png,image/jpeg"
      class="w-full"
    >
      <ElIcon class="el-icon--upload"><UiwCloudUpload /></ElIcon>
      <div class="el-upload__text">
        将图片、影音等文件拖拽到此框，或 <em>点击上传</em>
      </div>
    </ElUpload>

    <ElForm :model="{ files: fileList }" class="w-full">
      <!-- Custom File List -->
      <div
        v-if="fileList.length > 0"
        class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="(file, index) in fileList"
          :key="file.uid"
          class="relative flex max-w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4 dark:border-gray-700 dark:bg-slate-800"
        >
          <div class="mb-3 flex items-start gap-2 sm:gap-3">
            <!-- Thumbnail -->
            <div
              class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50 sm:h-20 sm:w-20 dark:border-gray-700 dark:bg-slate-700"
            >
              <img
                v-if="file.url"
                :src="file.url"
                class="h-full w-full cursor-pointer object-cover"
                @click="handlePreview(file)"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-500"
              >
                <ElIcon><UiwCloudUpload /></ElIcon>
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1 overflow-hidden">
              <div
                class="truncate pr-6 text-sm font-medium text-gray-900 dark:text-gray-100"
                :title="file.name"
              >
                {{ file.name }}
              </div>
              <div
                class="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400"
              >
                <div class="truncate">
                  上传时间: {{ file.uploadTime || '刚刚' }}
                </div>
                <div>大小: {{ file.fileSize || '未知' }}</div>
              </div>
            </div>

            <!-- Delete Button -->
            <div
              v-if="!readonly && allowDelete"
              class="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-red-500"
              @click="handleRemove(file)"
            >
              <ElIcon><AntdCloseOutlined /></ElIcon>
            </div>
          </div>

          <!-- Tag Selection -->
          <div class="mt-auto border-t border-gray-50 pt-2">
            <div
              class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
            >
              <span class="whitespace-nowrap text-xs text-gray-500">
                选择标签<span class="text-red-500">*</span>
              </span>
              <ElFormItem
                :prop="`files.${index}.tag`"
                :rules="{
                  required: true,
                  message: '请选择标签',
                  trigger: ['change', 'blur'],
                }"
                class="!mb-0 w-full flex-1"
              >
                <ElSelect
                  v-model="file.tag"
                  placeholder="请选择材料标签"
                  size="small"
                  class="w-full"
                  :disabled="readonly"
                  @change="emit('tagChange', file)"
                >
                  <ElOption
                    v-for="item in tagOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </div>
          </div>
        </div>
      </div>
    </ElForm>

    <ElImageViewer
      v-if="previewVisible"
      :url-list="previewList"
      @close="() => (previewVisible = false)"
    />
  </div>
</template>

<style scoped>
:deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 0;
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 0.75rem;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

:deep(.el-upload__text) {
  font-size: 1rem;
  color: #6b7280;
}

:deep(.el-upload__text em) {
  font-style: normal;
  font-weight: 600;
  color: #3b82f6;
}
</style>

<style>
.dark .el-upload-dragger {
  background-color: #1e293b !important;
  border-color: #374151 !important;
}

.dark .el-upload-dragger:hover {
  background-color: #1e293b !important;
  border-color: #3b82f6 !important;
}

.dark .el-upload__text {
  color: #9ca3af !important;
}
</style>
