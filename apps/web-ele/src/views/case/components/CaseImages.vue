<script lang="ts" setup>
import type { UploadFiles } from 'element-plus';

import { computed, reactive, ref, watch } from 'vue';

import { AntDownloadOutlined } from '@vben/icons';

import {
  ElButton,
  ElIcon,
  ElImage,
  ElLink,
  ElMessage,
  ElProgress,
} from 'element-plus';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface Props {
  pictureList?: Record<string, string>;
}

const props = defineProps<Props>();

const linkIndex = ref(0);
const currentCategoryIndex = ref(0);
const isDownloading = ref(false);
const downloadProgress = ref(0);

const onPreviewShow = (imgIndex: number, categoryIndex: number) => {
  linkIndex.value = imgIndex;
  currentCategoryIndex.value = categoryIndex;
};

const changeLink = (index: number) => {
  linkIndex.value = index;
};

const downloadImg = () => {
  const category = uploadListData.value[currentCategoryIndex.value];
  if (!category) return;

  const img = category.list[linkIndex.value];
  if (img && img.url) {
    const fileName = img.name || `image-${Date.now()}.jpg`;
    saveAs(img.url, fileName);
  }
};

const downloadAllImages = async () => {
  if (uploadListData.value.length === 0) {
    ElMessage.warning('暂无图片可下载');
    return;
  }

  isDownloading.value = true;
  downloadProgress.value = 0;
  const zip = new JSZip();
  let hasImages = false;
  let totalImages = 0;
  let downloadedCount = 0;

  // Calculate total images first
  uploadListData.value.forEach((category) => {
    category.list.forEach((img) => {
      if (img.url) {
        totalImages++;
      }
    });
  });

  try {
    const promises: Promise<void>[] = [];

    uploadListData.value.forEach((category) => {
      if (category.list.length > 0) {
        const folder = zip.folder(category.name);
        if (folder) {
          category.list.forEach((img, index) => {
            if (img.url) {
              hasImages = true;
              const promise = fetch(img.url)
                .then((response) => response.blob())
                .then((blob) => {
                  const fileName = img.name || `image-${index + 1}.jpg`;
                  folder.file(fileName, blob);
                  downloadedCount++;
                  downloadProgress.value = Math.floor(
                    (downloadedCount / totalImages) * 100,
                  );
                })
                .catch((error) => {
                  console.error(`Failed to download image: ${img.url}`, error);
                });
              promises.push(promise);
            }
          });
        }
      }
    });

    if (!hasImages) {
      ElMessage.warning('暂无有效图片链接');
      isDownloading.value = false;
      return;
    }

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `案件图片资料-${Date.now()}.zip`);
    ElMessage.success('批量下载完成');
  } catch (error) {
    console.error('Batch download failed:', error);
    ElMessage.error('批量下载失败，请稍后重试');
  } finally {
    isDownloading.value = false;
    downloadProgress.value = 0;
  }
};

interface UploadForm {
  addressPictureList: UploadFiles;
  orderPictureList: UploadFiles;
  accidentPictureList: UploadFiles;
  cardPictureList: UploadFiles;
  diseasePictureList: UploadFiles;
  ticketPictureList: UploadFiles;
  goodPictureList: UploadFiles;
  modifyPictureList: UploadFiles;
  otherPictureList: UploadFiles;
}

const uploadForm = reactive<UploadForm>({
  addressPictureList: [],
  orderPictureList: [],
  accidentPictureList: [],
  cardPictureList: [],
  diseasePictureList: [],
  ticketPictureList: [],
  goodPictureList: [],
  modifyPictureList: [],
  otherPictureList: [],
});

const uploadListData = ref<{ list: UploadFiles; name: string }[]>([]);

watch(
  () => props.pictureList,
  (newData) => {
    if (!newData) return;

    uploadForm.addressPictureList = newData.addressPicture
      ? JSON.parse(newData.addressPicture)
      : [];
    uploadForm.orderPictureList = newData.orderPicture
      ? JSON.parse(newData.orderPicture)
      : [];
    uploadForm.accidentPictureList = newData.accidentPicture
      ? JSON.parse(newData.accidentPicture)
      : [];
    uploadForm.cardPictureList = newData.cardPicture
      ? JSON.parse(newData.cardPicture)
      : [];
    uploadForm.diseasePictureList = newData.diseasePicture
      ? JSON.parse(newData.diseasePicture)
      : [];
    uploadForm.ticketPictureList = newData.ticketPicture
      ? JSON.parse(newData.ticketPicture)
      : [];
    uploadForm.goodPictureList = newData.goodPicture
      ? JSON.parse(newData.goodPicture)
      : [];
    uploadForm.modifyPictureList = newData.modifyPicture
      ? JSON.parse(newData.modifyPicture)
      : [];
    uploadForm.otherPictureList = newData.otherPicture
      ? JSON.parse(newData.otherPicture)
      : [];

    uploadListData.value = [
      {
        name: '现场照片',
        list: uploadForm.addressPictureList,
      },
      {
        name: '订单截图',
        list: uploadForm.orderPictureList,
      },
      {
        name: '事故认定书',
        list: uploadForm.accidentPictureList,
      },
      {
        name: '身份证',
        list: uploadForm.cardPictureList,
      },
      {
        name: '病历资料',
        list: uploadForm.diseasePictureList,
      },
      {
        name: '医疗发票',
        list: uploadForm.ticketPictureList,
      },
      {
        name: '物损照片',
        list: uploadForm.goodPictureList,
      },
      {
        name: '维修发票',
        list: uploadForm.modifyPictureList,
      },
      {
        name: '其他补充',
        list: uploadForm.otherPictureList,
      },
    ];
  },
  { immediate: true },
);

const hasAnyImage = computed(() => {
  return uploadListData.value.some((item) => item.list && item.list.length > 0);
});
</script>

<template>
  <div v-if="hasAnyImage" class="mb-4 flex items-center justify-end gap-4">
    <div v-if="isDownloading" class="w-48 transition-all duration-300">
      <ElProgress
        :percentage="downloadProgress"
        :status="downloadProgress === 100 ? 'success' : ''"
        :stroke-width="10"
        striped
        striped-flow
      />
    </div>
    <ElButton
      type="primary"
      :loading="isDownloading"
      @click="downloadAllImages"
    >
      <template #icon>
        <AntDownloadOutlined />
      </template>
      批量下载所有图片
    </ElButton>
  </div>

  <div
    v-if="hasAnyImage"
    class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
  >
    <template v-for="(item, index) in uploadListData" :key="index">
      <div
        v-if="item.list.length > 0"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="font-medium text-gray-800">{{ item.name }}</span>
          <span class="text-xs text-gray-500">{{ item.list.length }} 张</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <ElImage
            v-for="(img, i) in item.list"
            :key="i"
            :initial-index="i"
            :max-scale="7"
            :min-scale="0.2"
            :preview-src-list="
              item.list
                .map((img) => img.url)
                .filter((url): url is string => !!url)
            "
            :src="img.url"
            :zoom-rate="1.2"
            class="h-24 w-24 rounded border border-gray-100 object-cover"
            fit="cover"
            @show="onPreviewShow(i, index)"
            @switch="changeLink"
          >
            <template #viewer>
              <div class="viewerDownload" title="点击下载">
                <ElLink
                  underline="never"
                  style="color: rgb(228 228 231)"
                  @click="downloadImg"
                >
                  <ElIcon size="24"><AntDownloadOutlined /></ElIcon>
                </ElLink>
              </div>
            </template>
          </ElImage>
        </div>
      </div>
    </template>
  </div>
  <div
    v-else
    class="flex min-h-[300px] items-center justify-center text-gray-400"
  >
    暂无图像文件
  </div>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}

:deep(.el-image-viewer__actions) {
  padding: 0 58px 0 23px !important;
}

.viewerDownload {
  position: absolute;
  right: calc(50vw - 140px);
  bottom: 40px;
  z-index: 1;
  height: 24px;
  line-height: 1;
  color: #fff;
  cursor: pointer;
}
</style>
