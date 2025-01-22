<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { AntdPlusOutlined } from '@vben/icons';

import {
  ElCol,
  ElFormItem,
  ElIcon,
  ElImageViewer,
  ElMessage,
  ElUpload,
  type UploadFile,
  type UploadFiles,
  type UploadProps,
} from 'element-plus';

interface FileResponse {
  result: string;
}

export interface UploadForm {
  addressPictureList?: undefined | UploadFiles;
  orderPictureList?: undefined | UploadFiles;
  accidentPictureList?: undefined | UploadFiles;
  cardPictureList?: undefined | UploadFiles;
  diseasePictureList?: undefined | UploadFiles;
  ticketPictureList?: undefined | UploadFiles;
  goodPictureList?: undefined | UploadFiles;
  modifyPictureList?: undefined | UploadFiles;
  otherPictureList?: undefined | UploadFiles;
}

interface Props {
  uploadData?: Record<string, string>;
  id?: number | string;
}

const props = defineProps<Props>();
const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

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

type keyType =
  | 'accidentPictureList'
  | 'addressPictureList'
  | 'cardPictureList'
  | 'diseasePictureList'
  | 'goodPictureList'
  | 'modifyPictureList'
  | 'orderPictureList'
  | 'otherPictureList'
  | 'ticketPictureList';
const handleChange = (
  file: UploadFile,
  fileList: UploadFiles,
  key: keyType,
) => {
  fileList.forEach((item) => {
    item.url = (item.response as FileResponse)?.result || item.url;
    delete item.response;
    delete item.raw;
    delete item.percentage;
    delete (item as any).status;
  });
  uploadForm[key] = fileList;
};

const previewVisible = ref(false);
const previewList = ref<string[]>();

const handlePreview: UploadProps['onPreview'] = (file) => {
  const url: string = (file.response as FileResponse).result;
  previewList.value = [url];
  previewVisible.value = true;
};

const handleSuccess: UploadProps['onSuccess'] = ({ code, message }) => {
  if (code === 200) {
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(`${message}，请重新上传`);
  }
};

const getData = (isObj?: boolean) => {
  return isObj
    ? {
        accidentPicture: uploadForm.accidentPictureList,
        addressPicture: uploadForm.addressPictureList,
        cardPicture: uploadForm.cardPictureList,
        diseasePicture: uploadForm.diseasePictureList,
        goodPicture: uploadForm.goodPictureList,
        modifyPicture: uploadForm.modifyPictureList,
        orderPicture: uploadForm.orderPictureList,
        otherPicture: uploadForm.otherPictureList,
        ticketPicture: uploadForm.ticketPictureList,
      }
    : {
        accidentPicture: JSON.stringify(uploadForm.accidentPictureList),
        addressPicture: JSON.stringify(uploadForm.addressPictureList),
        cardPicture: JSON.stringify(uploadForm.cardPictureList),
        diseasePicture: JSON.stringify(uploadForm.diseasePictureList),
        goodPicture: JSON.stringify(uploadForm.goodPictureList),
        modifyPicture: JSON.stringify(uploadForm.modifyPictureList),
        orderPicture: JSON.stringify(uploadForm.orderPictureList),
        otherPicture: JSON.stringify(uploadForm.otherPictureList),
        ticketPicture: JSON.stringify(uploadForm.ticketPictureList),
      };
};

defineExpose({
  getData,
});

watch(
  () => [props.id, props.uploadData],
  ([newId, newData]) => {
    if (newId && typeof newData === 'object' && newData !== null) {
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
    } else {
      uploadForm.addressPictureList = [];
      uploadForm.orderPictureList = [];
      uploadForm.accidentPictureList = [];
      uploadForm.cardPictureList = [];
      uploadForm.diseasePictureList = [];
      uploadForm.ticketPictureList = [];
      uploadForm.goodPictureList = [];
      uploadForm.modifyPictureList = [];
      uploadForm.otherPictureList = [];
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="现场照片"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.addressPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'addressPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'addressPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="订单截图"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.orderPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'orderPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'orderPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="事故认定书"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.accidentPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) =>
            handleChange(file, fileList, 'accidentPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) =>
            handleChange(file, fileList, 'accidentPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="身份证"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.cardPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'cardPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'cardPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="病历资料"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.diseasePictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'diseasePictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'diseasePictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="医疗发票"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.ticketPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'ticketPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'ticketPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="物损照片"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.goodPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'goodPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'goodPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :lg="12">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="维修发票"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.modifyPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'modifyPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'modifyPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>
  <ElCol :span="24">
    <ElFormItem
      class="rounded-md border border-dashed p-2"
      label="其他补充"
      label-position="top"
    >
      <ElUpload
        v-model:file-list="uploadForm.otherPictureList"
        :action="uploadUrl"
        :before-upload="beforeImgUpload"
        :limit="10"
        :on-change="
          (file, fileList) => handleChange(file, fileList, 'otherPictureList')
        "
        :on-preview="handlePreview"
        :on-remove="
          (file, fileList) => handleChange(file, fileList, 'otherPictureList')
        "
        :on-success="handleSuccess"
        accept=".jpg,.jpeg,.png,image/png,image/jpeg"
        list-type="picture-card"
        multiple
      >
        <ElIcon size="30"><AntdPlusOutlined /></ElIcon>
      </ElUpload>
    </ElFormItem>
  </ElCol>

  <ElImageViewer
    v-if="previewVisible"
    :url-list="previewList"
    @close="() => (previewVisible = false)"
  />
</template>

<style scoped>
:deep(.el-upload-list--picture-card) {
  --el-upload-list-picture-card-size: 80px;
}

:deep(.el-upload--picture-card) {
  --el-upload-picture-card-size: 80px;
}

:deep(.el-icon--close-tip) {
  display: none !important;
}
</style>
