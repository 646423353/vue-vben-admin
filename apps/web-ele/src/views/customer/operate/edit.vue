<script lang="ts" setup>
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles,
  UploadProps,
} from 'element-plus';

import type { PlanParams } from '../components/Plan.vue';
import type { SiteParams } from '../components/Site.vue';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { UiwCloudUpload } from '@vben/icons';

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

import {
  CustomerAddApi,
  CustomerGetApi,
  CustomerUpdateApi,
} from '#/api/core/customer';
import { useCustomerStore } from '#/store/customer';
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

const validateCode = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请输入正确的统一信用代码'));
  }
  if (/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(value)) {
    callback();
  } else {
    callback(new Error('请输入正确的统一信用代码'));
  }
};

const rules = reactive<FormRules<CustomerForm>>({
  username: [
    {
      required: true,
      message: '请输入客户名称',
      trigger: 'blur',
    },
  ],
  systemnum: [
    {
      required: true,
      message: '请输入统一信用代码',
      trigger: 'blur',
    },
    {
      validator: validateCode,
      trigger: 'blur',
    },
  ],
  ticket: [
    {
      required: true,
      message: '请输入开票信息',
      trigger: 'blur',
    },
  ],
  mail: [
    {
      required: true,
      message: '请输入快递信息',
      trigger: 'blur',
    },
  ],
});

const store = useCustomerStore();
const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');
const previewPdfUrl = ref('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const beforeFileUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const validExtensions = [
    // 'png',
    // 'jpeg',
    // 'jpg',
    'pdf',
  ];
  const validMimeTypes = [
    // 'image/png',
    // 'image/jpeg',
    'application/pdf',
  ];

  if (!rawFile) return false;

  const rawFileTypeName = rawFile?.name?.split('.').pop()?.toLowerCase();
  const isImageOrPdf =
    validExtensions.includes(rawFileTypeName || '') ||
    validMimeTypes.includes(rawFile.type);

  const isLt2M = rawFile.size / 1024 / 1024 < 20;

  if (!isImageOrPdf) {
    await ElMessage.error('请上传PDF格式文件');
  }
  if (!isLt2M) {
    await ElMessage.error('文件大小不能超过 20MB');
  }

  return isImageOrPdf && isLt2M;
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

const previewVisible = ref(false);
const previewList = ref<string[]>();

type keyType =
  | 'cardaFileList'
  | 'cardbFileList'
  | 'pdfFileList'
  | 'zhizaoFileList';
const handleChange = (
  file: UploadFile,
  fileList: UploadFiles,
  key: keyType,
) => {
  customerForm[key] = fileList;
};

const handleSuccess: UploadProps['onSuccess'] = ({ code, message }) => {
  if (code === 200) {
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(`${message}，请重新上传`);
  }
};

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

const formatImgUrl = (imgObj: undefined | UploadFiles) => {
  if (!imgObj) return '[]';
  imgObj.forEach((item) => {
    item.url = (item.response as FileResponse).result;
  });
  return imgObj;
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      customerForm.pdf = JSON.stringify(customerForm.pdfFileList);
      customerForm.zhizao = JSON.stringify(
        formatImgUrl(customerForm.zhizaoFileList),
      );
      customerForm.carda = JSON.stringify(
        formatImgUrl(customerForm.cardaFileList),
      );
      customerForm.cardb = JSON.stringify(
        formatImgUrl(customerForm.cardbFileList),
      );

      if (!(await planRef.value.fullValidEvent())) return;
      const planData = planRef.value?.getData();
      if (!(await siteRef.value.fullValidEvent())) return;
      const siteData = siteRef.value?.getData();

      const result = await CustomerAddApi({
        ...customerForm,
        tbCustomerInsureDtos: planData,
        tbCustomerStopDtos: siteData,
      });
      ElMessage.success(`${result}`);
      store.changeCustomerStatus(true);
      back();
      resetForm(formEl);
    } else {
      console.error('error submit!', fields);
    }
  });
};

const updateForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      customerForm.pdf = JSON.stringify(customerForm.pdfFileList);
      customerForm.zhizao = JSON.stringify(
        formatImgUrl(customerForm.zhizaoFileList),
      );
      customerForm.carda = JSON.stringify(
        formatImgUrl(customerForm.cardaFileList),
      );
      customerForm.cardb = JSON.stringify(
        formatImgUrl(customerForm.cardbFileList),
      );

      if (!(await planRef.value.fullValidEvent())) return;
      const planData = planRef.value?.getData();
      if (!(await siteRef.value.fullValidEvent())) return;
      const siteData = siteRef.value?.getData();

      const result = await CustomerUpdateApi({
        id: Number(id.value),
        ...customerForm,
        tbCustomerInsureDtos: planData,
        tbCustomerStopDtos: siteData,
      });
      ElMessage.success(`${result}`);
      store.changeCustomerStatus(true);
      back();
      resetForm(formEl);
    } else {
      console.error('error submit!', fields);
    }
  });
};

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
  <Page :title="`${id ? '更新' : '新建'}客户信息`">
    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <ElForm
        ref="customerFormRef"
        :model="customerForm"
        :rules="rules"
        class="demo-customerForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="客户名称" prop="username">
          <ElInput v-model="customerForm.username" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="统一信用代码" prop="systemnum">
          <ElInput v-model="customerForm.systemnum" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="开票信息" prop="ticket">
          <ElInput
            v-model="customerForm.ticket"
            :autosize="{ minRows: 4 }"
            placeholder="请输入"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="快递信息" prop="mail">
          <ElInput
            v-model="customerForm.mail"
            :autosize="{ minRows: 4 }"
            placeholder="请输入"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="合同文件">
          <ElUpload
            :before-upload="beforeFileUpload"
            :file-list="customerForm.pdfFileList"
            :limit="10"
            :on-change="
              (file, fileList) => handleChange(file, fileList, 'pdfFileList')
            "
            :on-preview="handlePreview"
            :on-remove="
              (file, fileList) => handleChange(file, fileList, 'pdfFileList')
            "
            :on-success="handleSuccess"
            accept=".pdf,application/pdf"
            action="/api/member/uploadPicture"
            class="w-full"
            drag
            multiple
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传pdf文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
        <ElFormItem label="营业执照">
          <ElUpload
            :before-upload="beforeImgUpload"
            :file-list="customerForm.zhizaoFileList"
            :limit="10"
            :on-change="
              (file, fileList) => handleChange(file, fileList, 'zhizaoFileList')
            "
            :on-preview="handlePreview"
            :on-remove="
              (file, fileList) => handleChange(file, fileList, 'zhizaoFileList')
            "
            :on-success="handleSuccess"
            accept=".jpg,.jpeg,.png,image/png,image/jpeg"
            action="/api/member/uploadPicture"
            class="w-full"
            drag
            list-type="picture"
            multiple
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传图片文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
        <ElFormItem label="身份证人像面">
          <ElUpload
            :before-upload="beforeImgUpload"
            :file-list="customerForm.cardaFileList"
            :limit="10"
            :on-change="
              (file, fileList) => handleChange(file, fileList, 'cardaFileList')
            "
            :on-preview="handlePreview"
            :on-remove="
              (file, fileList) => handleChange(file, fileList, 'cardaFileList')
            "
            :on-success="handleSuccess"
            accept=".jpg,.jpeg,.png,image/png,image/jpeg"
            action="/api/member/uploadPicture"
            class="w-full"
            drag
            list-type="picture"
            multiple
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传图片文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
        <ElFormItem label="身份证国徽面">
          <ElUpload
            :before-upload="beforeImgUpload"
            :file-list="customerForm.cardbFileList"
            :limit="10"
            :on-change="
              (file, fileList) => handleChange(file, fileList, 'cardbFileList')
            "
            :on-preview="handlePreview"
            :on-remove="
              (file, fileList) => handleChange(file, fileList, 'cardbFileList')
            "
            :on-success="handleSuccess"
            accept=".jpg,.jpeg,.png,image/png,image/jpeg"
            action="/api/member/uploadPicture"
            class="w-full"
            drag
            list-type="picture"
            multiple
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传图片文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>保障方案信息</span>
        </div>
      </template>

      <Plan ref="planRef" :list="customerForm.insures" />
    </ElCard>

    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>站点信息</span>
        </div>
      </template>
      <Site ref="siteRef" :list="customerForm.stops" />
    </ElCard>

    <div class="mb-40 flex w-full justify-end">
      <ElButton v-if="id" type="primary" @click="updateForm(customerFormRef)">
        更新
      </ElButton>
      <ElButton v-else type="primary" @click="submitForm(customerFormRef)">
        提交
      </ElButton>
      <ElButton @click="back">取消</ElButton>
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
</style>
