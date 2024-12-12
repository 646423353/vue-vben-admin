<script lang="ts" setup>
import type { FormInstance, UploadFiles, UploadProps } from 'element-plus';

import type { PlanParams } from '../components/Plan.vue';
import type { SiteParams } from '../components/Site.vue';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import VueOfficePdf from '@vue-office/pdf';
import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElImageViewer,
  ElInput,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { CustomerGetApi } from '#/api/core/customer';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

import Plan from '../components/Plan.vue';
import Site from '../components/Site.vue';

interface CustomerForm {
  carda: string;
  cardaFileList?: undefined | UploadFiles;
  cardb: string;
  cardbFileList?: undefined | UploadFiles;
  id?: number;
  mail: string;
  pdf: string;
  pdfFileList?: undefined | UploadFiles;
  systemnum: string;
  ticket: string;
  username: string;
  zhizao: string;
  zhizaoFileList?: undefined | UploadFiles;
  tbCustomerInsureDtos?: PlanParams[];
  tbCustomerStopDtos?: SiteParams[];
  insures?: PlanParams[];
  stops?: SiteParams[];
}

const customerFormRef = ref<FormInstance>();
const customerForm = reactive<CustomerForm>({
  carda: '',
  cardb: '',
  mail: '',
  pdf: '',
  systemnum: '',
  ticket: '',
  username: '',
  zhizao: '',
});

const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');
const previewPdfUrl = ref('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const previewVisible = ref(false);
const previewList = ref<string[]>();

const isImage = (url: string) => {
  if (!url) return false;
  const extname = url!.split('.').pop()!.toLowerCase();
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];

  return imageExtensions.includes(extname);
};

const isPDF = (url: string) => {
  if (!url) return false;
  const mimeType = url!.split('.').pop()!.toLowerCase();
  const pdfMimeType = 'pdf';

  return mimeType === pdfMimeType;
};

interface FileResponse {
  result: string;
}

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  showConfirmButton: false,
  cancelText: '关闭',
});

const handlePreview: UploadProps['onPreview'] = (file) => {
  const url: string = (file.response as FileResponse).result;
  if (isImage(url)) {
    previewList.value = [url];
    previewVisible.value = true;
  } else if (isPDF(url)) {
    previewPdfUrl.value = replaceUrlWithCurrentDomain(url);
    modalApi.open();
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};

const renderedHandler = () => {};
const errorHandler = () => {
  console.error('渲染失败');
};

const planRef = ref<any>(null);
const siteRef = ref<any>(null);

const getCustomerDetail = async (id: number | string) => {
  const {
    carda,
    cardb,
    mail,
    pdf,
    systemnum,
    ticket,
    username,
    zhizao,
    insures,
    stops,
  } = await CustomerGetApi(id);

  customerForm.carda = carda;
  customerForm.cardaFileList = JSON.parse(carda || '[]');
  if (typeof customerForm.cardaFileList === 'string')
    customerForm.cardaFileList = [];
  customerForm.cardaFileList?.forEach(
    (item) => (item.url = item.url || (item.response as any).result),
  );
  customerForm.cardb = cardb;
  customerForm.cardbFileList = JSON.parse(cardb || '[]');
  if (typeof customerForm.cardbFileList === 'string')
    customerForm.cardbFileList = [];
  customerForm.cardbFileList?.forEach(
    (item) => (item.url = item.url || (item.response as any).result),
  );
  customerForm.mail = mail;
  customerForm.pdf = pdf;
  customerForm.pdfFileList = JSON.parse(pdf || '[]');
  customerForm.systemnum = systemnum;
  customerForm.ticket = ticket;
  customerForm.username = username;
  customerForm.zhizao = zhizao;
  customerForm.zhizaoFileList = JSON.parse(zhizao || '[]');
  if (typeof customerForm.zhizaoFileList === 'string')
    customerForm.zhizaoFileList = [];
  customerForm.zhizaoFileList?.forEach(
    (item) => (item.url = item.url || (item.response as any).result),
  );
  customerForm.insures = insures;
  customerForm.stops = stops;
};

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getCustomerDetail(id.value);
  }
});
</script>

<template>
  <Page title="客户信息">
    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <ElForm
        ref="customerFormRef"
        :model="customerForm"
        class="demo-customerForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="客户名称">
          <ElInput v-model="customerForm.username" readonly />
        </ElFormItem>
        <ElFormItem label="统一信用代码">
          <ElInput v-model="customerForm.systemnum" readonly />
        </ElFormItem>
        <ElFormItem label="开票信息">
          <ElInput
            v-model="customerForm.ticket"
            :autosize="{ minRows: 4 }"
            readonly
            resize="none"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="快递信息">
          <ElInput
            v-model="customerForm.mail"
            :autosize="{ minRows: 4 }"
            readonly
            resize="none"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="合同文件">
          <ElUpload
            :file-list="customerForm.pdfFileList"
            :on-preview="handlePreview"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="营业执照">
          <ElUpload
            :file-list="customerForm.zhizaoFileList"
            :on-preview="handlePreview"
            class="w-full"
            list-type="picture"
          />
        </ElFormItem>
        <ElFormItem label="身份证人像面">
          <ElUpload
            :file-list="customerForm.cardaFileList"
            :on-preview="handlePreview"
            class="w-full"
            list-type="picture"
          />
        </ElFormItem>
        <ElFormItem label="身份证国徽面">
          <ElUpload
            :file-list="customerForm.cardbFileList"
            :on-preview="handlePreview"
            class="w-full"
            list-type="picture"
          />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>保障方案信息</span>
        </div>
      </template>

      <Plan ref="planRef" :list="customerForm.insures" preview />
    </ElCard>

    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>站点信息</span>
        </div>
      </template>

      <Site ref="siteRef" :list="customerForm.stops" preview />
    </ElCard>

    <div class="mb-40 flex w-full justify-end">
      <ElButton @click="back">关闭</ElButton>
    </div>

    <ElImageViewer
      v-if="previewVisible"
      :url-list="previewList"
      @close="() => (previewVisible = false)"
    />

    <Modal class="w-[80%]" title="文件预览">
      <VueOfficePdf
        :src="previewPdfUrl"
        @error="errorHandler"
        @rendered="renderedHandler"
      />
    </Modal>
  </Page>
</template>

<style scoped>
:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-upload) {
  display: none;
}

:deep(.el-upload-list) {
  margin-top: 0;
}

:deep(.el-upload-list__item .el-icon--close) {
  display: none;
}
</style>
