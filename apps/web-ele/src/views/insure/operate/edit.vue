<script lang="ts" setup>
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles,
  UploadProps,
} from 'element-plus';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { UiwCloudUpload } from '@vben/icons';

import VueOfficePdf from '@vue-office/pdf';
import {
  ElButton,
  ElCard,
  ElCol,
  ElForm,
  ElFormItem,
  ElImageViewer,
  ElInput,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
  ElSwitch,
  ElUpload,
} from 'element-plus';

import { InsureAddApi, InsureGetApi, InsureUpdateApi } from '#/api/core/insure';
import { useInsureStore } from '#/store/insure';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

interface InsureForm {
  cate: number;
  ordertype: string;
  money: string;
  days: string;
  ticketCompany: string;
  emails: string;
  sendPeriod: string;
  sendType: string;
  fileUrl: string;
  fileUrlList?: undefined | UploadFiles;
  status: number;
  typename: string;
  caseName: string;
  caseCode: string;
  productName: string;
  remark: string;
  interfaceid: string;
}

const insureFormRef = ref<FormInstance>();
const insureForm = reactive<InsureForm>({
  cate: 0,
  ordertype: '',
  money: '',
  days: '',
  ticketCompany: '',
  emails: '',
  sendPeriod: '',
  sendType: '',
  fileUrl: '',
  status: 1,
  typename: '',
  caseName: '',
  caseCode: '',
  productName: '',
  remark: '',
  interfaceid: '',
});

const uploadUrl = import.meta.env.VITE_APP_UPLOAD_URL;

const validateMoney = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请输入正确的价格'));
  }
  // eslint-disable-next-line regexp/no-unused-capturing-group
  if (/^\d+(\.\d{1,2})?$/.test(value)) {
    callback();
  } else {
    callback(new Error('请输入正确的价格'));
  }
};

const validateEmails = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请输入发送邮箱'));
  }
  const emailList: string[] = value.split(/\r?\n|\r/g);
  emailList.forEach((item) => {
    // eslint-disable-next-line regexp/no-unused-capturing-group
    if (!/^([\w-])+@(([\w-])+\.)+[a-z]{2,4}$/i.test(item)) {
      return callback(new Error('邮箱格式错误'));
    }
  });
  callback();
};

const rules = reactive<FormRules<InsureForm>>({
  ordertype: [
    {
      required: true,
      message: '请输入方案名称',
      trigger: 'blur',
    },
  ],
  money: [
    {
      required: true,
      message: '请输入方案价格',
      trigger: 'blur',
    },
    {
      validator: validateMoney,
      trigger: 'blur',
    },
  ],
  days: [
    {
      required: true,
      message: '请选择单价单位',
      trigger: 'change',
    },
  ],
  typename: [
    {
      required: true,
      message: '请输入保险公司产品编码',
      trigger: 'blur',
    },
  ],
  caseCode: [
    {
      required: true,
      message: '请输入保险公司方案编号',
      trigger: 'blur',
    },
  ],
  caseName: [
    {
      required: true,
      message: '请输入保险公司方案名称',
      trigger: 'blur',
    },
  ],
  productName: [
    {
      required: true,
      message: '请输入保险公司产品名称',
      trigger: 'blur',
    },
  ],
  ticketCompany: [
    {
      required: true,
      message: '请选择开票单位',
      trigger: 'change',
    },
  ],
  emails: [
    {
      required: true,
      message: '请输入发送邮箱',
      trigger: 'blur',
    },
    {
      validator: validateEmails,
      trigger: 'blur',
    },
  ],
  sendPeriod: [
    {
      required: true,
      message: '请选择发送时间',
      trigger: 'change',
    },
  ],
  sendType: [
    {
      required: true,
      message: '请选择发送类型',
      trigger: 'change',
    },
  ],
  fileUrl: [
    {
      required: true,
      message: '请上传文件',
      trigger: 'change',
    },
  ],
  status: [
    {
      required: true,
      message: '请选择方案状态',
      trigger: 'blur',
    },
  ],
});

const store = useInsureStore();
const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');

const previewVisible = ref(false);
const previewList = ref([]);
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
  const validExtensions = ['pdf'];
  const validMimeTypes = ['application/pdf'];

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

const handleChange = (file: UploadFile, fileList: UploadFiles) => {
  insureForm.fileUrlList = fileList;
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
    // previewImageUrl = url;
  } else if (isPDF(url)) {
    previewPdfUrl.value = replaceUrlWithCurrentDomain(url);
    modalApi.open();
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
  // previewVisible.value = true;
};

const renderedHandler = () => {};
const errorHandler = () => {
  console.error('渲染失败');
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      insureForm.fileUrl = JSON.stringify(insureForm.fileUrlList);
      const result = await InsureAddApi(insureForm);
      ElMessage.success(`${result}`);
      store.changeUpdateStatus(true);
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
      insureForm.fileUrl = JSON.stringify(insureForm.fileUrlList);
      const result = await InsureUpdateApi({
        id: Number(id.value),
        ...insureForm,
      });
      ElMessage.success(`${result}`);
      store.changeUpdateStatus(true);
      back();
      resetForm(formEl);
    } else {
      console.error('error submit!', fields);
    }
  });
};

const getInsureDetail = async (id: number | string) => {
  const {
    cate,
    ordertype,
    money,
    days,
    ticketCompany,
    emails,
    sendPeriod,
    sendType,
    fileUrl,
    status,
    typename,
    caseName,
    caseCode,
    productName,
    remark,
    interfaceid,
  } = await InsureGetApi(id);

  insureForm.cate = cate;
  insureForm.ordertype = ordertype;
  insureForm.money = money;
  insureForm.days = days.toString();
  insureForm.ticketCompany = ticketCompany.toString();
  insureForm.emails = emails;
  insureForm.sendPeriod = sendPeriod.toString();
  insureForm.sendType = sendType.toString();
  insureForm.fileUrl = fileUrl;
  insureForm.fileUrlList = JSON.parse(fileUrl || '[]');
  insureForm.status = status;
  insureForm.typename = typename;
  insureForm.caseName = caseName;
  insureForm.caseCode = caseCode;
  insureForm.productName = productName;
  insureForm.remark = remark;
  insureForm.interfaceid = interfaceid;
};

onMounted(async () => {
  const cate = route.query.cate as string;
  id.value = route.query.id as string;
  if (cate) {
    insureForm.cate = Number(cate);
  } else {
    back();
  }

  if (id.value) {
    getInsureDetail(id.value);
  }
});
</script>

<template>
  <Page :title="`${id ? '更新' : '新建'}主险方案`">
    <ElCard>
      <ElRow>
        <ElCol :offset="4" :span="16">
          <ElForm
            ref="insureFormRef"
            :model="insureForm"
            :rules="rules"
            class="demo-insureForm"
            label-width="auto"
            status-icon
          >
            <ElFormItem label="方案名称" prop="ordertype">
              <ElInput
                v-model="insureForm.ordertype"
                placeholder="请输入"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="方案价格" prop="money">
              <ElInput
                v-model="insureForm.money"
                placeholder="请输入"
                type="number"
              >
                <template #prefix> ￥ </template>
                <template #suffix> 元 </template>
              </ElInput>
            </ElFormItem>
            <ElFormItem label="单价单位" prop="days">
              <ElSelect
                v-model="insureForm.days"
                placeholder="请选择"
                :disabled="!!id"
              >
                <ElOption label="人 / 月" value="30" />
                <ElOption label="人 / 日" value="1" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="保险公司产品编码" prop="typename">
              <ElInput
                v-model="insureForm.typename"
                placeholder="请输入"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="保险公司产品名称" prop="productName">
              <ElInput
                v-model="insureForm.productName"
                placeholder="请输入"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="保险公司方案编号" prop="caseCode">
              <ElInput
                v-model="insureForm.caseCode"
                placeholder="请输入"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="保险公司方案名称" prop="caseName">
              <ElInput
                v-model="insureForm.caseName"
                placeholder="请输入"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="开票单位" prop="ticketCompany">
              <ElSelect
                v-model="insureForm.ticketCompany"
                placeholder="请选择"
                :disabled="!!id"
              >
                <ElOption label="领耀" value="1" />
                <ElOption label="都邦" value="2" />
                <ElOption label="崇法" value="3" />
                <ElOption label="铂塔" value="4" />
                <ElOption label="沛沁" value="5" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="对接邮箱" prop="emails">
              <ElInput
                v-model="insureForm.emails"
                :autosize="{ minRows: 4 }"
                placeholder="发送邮箱，每行一个"
                type="textarea"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="保司投保API接口">
              <ElSelect v-model="insureForm.interfaceid" :disabled="!!id">
                <ElOption label="河南API" value="1" />
                <ElOption label="辽宁API" value="2" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="发送时间" prop="sendPeriod">
              <ElSelect
                v-model="insureForm.sendPeriod"
                placeholder="请选择"
                :disabled="!!id"
              >
                <ElOption label="每日 晚上08点00分" value="1" />
                <ElOption label="每日 晚上23点50分" value="2" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="发送类型" prop="sendType">
              <ElSelect
                v-model="insureForm.sendType"
                placeholder="请选择"
                :disabled="!!id"
              >
                <ElOption label="增减员" value="1" />
                <ElOption label="全量" value="2" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="备注" prop="remark">
              <ElInput
                v-model="insureForm.remark"
                :autosize="{ minRows: 4 }"
                placeholder="请输入"
                type="textarea"
                :disabled="!!id"
              />
            </ElFormItem>
            <ElFormItem label="方案文件" prop="delivery">
              <ElUpload
                :action="uploadUrl"
                :before-upload="beforeFileUpload"
                :file-list="insureForm.fileUrlList"
                :limit="1"
                :on-change="handleChange"
                :on-preview="handlePreview"
                :on-remove="handleChange"
                :on-success="handleSuccess"
                accept=".pdf,application/pdf"
                class="w-full"
                drag
                multiple
                :disabled="!!id"
              >
                <div class="flex justify-center">
                  <UiwCloudUpload class="size-10" />
                </div>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传pdf文件，且不超过20mb
                  </div>
                </template>
              </ElUpload>
            </ElFormItem>
            <ElFormItem label="状态" prop="delivery">
              <ElSwitch
                v-model="insureForm.status"
                :active-value="1"
                :inactive-value="0"
                active-text="可用"
                inactive-text="不可用"
                inline-prompt
              />
            </ElFormItem>

            <ElFormItem class="footer-button">
              <ElButton
                v-if="id"
                type="primary"
                @click="updateForm(insureFormRef)"
              >
                更新
              </ElButton>
              <ElButton
                v-else
                type="primary"
                @click="submitForm(insureFormRef)"
              >
                提交
              </ElButton>
              <ElButton @click="back">取消</ElButton>
            </ElFormItem>
          </ElForm>
        </ElCol>
      </ElRow>
    </ElCard>

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
