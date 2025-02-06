<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { useDebounceFn } from '@vueuse/core';
import { codeToText, regionData } from 'element-china-area-data';
import {
  ElButton,
  ElCard,
  ElCascader,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElScrollbar,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { authUserListApi } from '#/api/core/authuser';
import {
  CaseAddApi,
  type CaseApi,
  CaseCardGetApi,
  CaseGetApi,
  CaseUpdateApi,
} from '#/api/core/case';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { PlanListApi } from '#/api/core/plan';
import { StopListApi } from '#/api/core/stop';
import { useCaseStore } from '#/store/case';

import UploadList from '../components/UploadList.vue';

const areaOptions = ref(regionData);

const uploadListRef = ref<any>(null);

const caseFormRef = ref<FormInstance>();
const caseForm = reactive<CaseApi.CaseForm>({
  accidentPicture: '',
  address: '',
  addressPicture: '',
  bxbm: '',
  cardPicture: '',
  casenoInsuredAttach: '',
  casenoInsuredMain: '',
  city: '',
  cityCode: '',
  companyId: '',
  companyName: '',
  creditcard: '',
  details: '',
  diseasePicture: '',
  district: '',
  districtCode: '',
  fujiaxian: '',
  goodPicture: '',
  insureTime: '',
  insureType: '',
  insuredAttach: '',
  insuredAttachName: '',
  insuredMain: '',
  insuredMainName: '',
  modifyPicture: '',
  name: '',
  orderPicture: '',
  oritext: '',
  otherPicture: '',
  owner: '',
  phone: '',
  phoneOwner: '',
  policyNo: '',
  policyNoAttach: '',
  province: '',
  provinceCode: '',
  stopId: '',
  stopName: '',
  stopOwner: '',
  stopOwnerName: '',
  stopOwnerPhone: '',
  ticketPicture: '',
  zeren: '',
});

const mainInsureList = ref<any[]>([]);
const addiInsureList = ref<any[]>([]);

const rules = reactive<FormRules<CaseApi.CaseForm>>({
  creditcard: [
    {
      required: true,
      message: '请输入身份证',
      trigger: 'blur',
    },
    {
      pattern:
        /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|12]\d)|3[01])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|12]\d)|3[01])(\d{4}|\d{3}x)$/i,
      message: '身份证格式错误',
      trigger: 'blur',
    },
  ],
  name: [
    {
      required: true,
      message: '请输入姓名',
      trigger: 'blur',
    },
    {
      pattern: /^[\u4E00-\u9FA5·]{2,16}$/,
      message: '姓名格式错误',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      required: true,
      message: '请输入手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式错误',
      trigger: 'blur',
    },
  ],
  insureTime: [
    {
      required: true,
      message: '请选择出险时间',
      trigger: 'change',
    },
  ],
  companyId: [
    {
      required: true,
      message: '请选择所属客户',
      trigger: 'change',
    },
  ],
  stopOwnerName: [
    {
      required: true,
      message: '请输入站长姓名',
      trigger: 'blur',
    },
    {
      pattern: /^[\u4E00-\u9FA5·]{2,16}$/,
      message: '姓名格式错误',
      trigger: 'blur',
    },
  ],
  stopOwnerPhone: [
    {
      required: true,
      message: '请输入站长手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式错误',
      trigger: 'blur',
    },
  ],
  bxbm: [
    {
      required: true,
      message: '请选择保险编码',
      trigger: 'change',
    },
  ],
  fujiaxian: [
    {
      required: true,
      message: '请选择有无附加险',
      trigger: 'change',
    },
  ],
  caseArea: [
    {
      required: true,
      message: '请选择事故区域',
      trigger: 'change',
    },
  ],
  insureType: [
    {
      required: true,
      message: '请选择出险类型',
      trigger: 'change',
    },
  ],
  address: [
    {
      required: true,
      message: '请输入详细地址',
      trigger: 'blur',
    },
  ],
  details: [
    {
      required: true,
      message: '请输入事故经过',
      trigger: 'blur',
    },
  ],
  owner: [
    {
      required: true,
      message: '请选择理赔员',
      trigger: 'change',
    },
  ],
  phoneOwner: [
    {
      required: true,
      message: '请输入理赔员手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式错误',
      trigger: 'blur',
    },
  ],
});

const store = useCaseStore();
const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const loading = ref<boolean>(false);

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      caseForm.insureTime = moment(caseForm.insureTime).valueOf();
      const uploadListData = uploadListRef.value.getData();

      try {
        loading.value = true;
        const result = await CaseAddApi({
          ...caseForm,
          ...uploadListData,
        });
        ElMessage.success(`${result}`);
        store.changeCaseStatus(true);
        back();
        resetForm(formEl);
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    } else {
      console.error('error submit!', fields);
    }
  });
};

const updateForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      caseForm.insureTime = moment(caseForm.insureTime).valueOf();
      const uploadListData = uploadListRef.value.getData();

      try {
        loading.value = true;
        const result = await CaseUpdateApi({
          ...caseForm,
          ...uploadListData,
        });
        ElMessage.success(`${result}`);
        store.changeCaseStatus(true);
        back();
        resetForm(formEl);
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    } else {
      console.error('error submit!', fields);
    }
  });
};

const customerList = ref<any>(null);
const getCustomerList = async () => {
  const { list } = await CustomerListApi(
    {},
    {
      page: 1,
      size: 2000,
    },
  );
  customerList.value = list;
};

const planList = ref<any>([]);
const getGroupList = async (id: number) => {
  const { list } = await PlanListApi(
    {
      customerId: id,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  planList.value = list;
};

async function getInsureList(cate: number) {
  const { list } = await InsureListApi(
    {
      cate,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  return list;
}

const stopList = ref<any>([]);
const getStopList = async (id: number) => {
  const { list } = await StopListApi(
    {
      customerId: `${id}`,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  stopList.value = list;
};

const authuserList = ref<any>([]);
const getAuthuserList = async () => {
  const { list } = await authUserListApi({
    organid: 0,
    roleId: 18,
    page: 1,
    size: 2000,
  });
  authuserList.value = list;
};
getAuthuserList();

const setOwnerPhone = (id: string) => {
  const user = authuserList.value.find((item: any) => item.id === id);
  caseForm.phoneOwner = user?.phone;
};

const setStopName = (id: string) => {
  const stop = stopList.value.find((item: any) => item.id === id);
  caseForm.stopName = stop?.name;
};

const setCompanyName = (id: number) => {
  const customer = customerList.value.find((item: any) => item.id === id);
  caseForm.companyName = customer?.username;
};

const setMainName = (id: string) => {
  const insure = mainInsureList.value.find((item: any) => item.id === id);
  caseForm.insuredMainName = insure?.ordertype;
};

const setAddiName = (id: string) => {
  const insure = addiInsureList.value.find((item: any) => item.id === id);
  caseForm.insuredAttachName = insure?.ordertype;
};

const getFormListData = (id: number) => {
  getStopList(id);
  getGroupList(id);
  setCompanyName(id);
};

const areaChange = (value: any) => {
  if (value[0] && value[1] && value[2]) {
    caseForm.province = codeToText[value[0] as string];
    caseForm.provinceCode = value[0] as string;
    caseForm.city = codeToText[value[1] as string];
    caseForm.cityCode = value[1] as string;
    caseForm.district = codeToText[value[2] as string];
    caseForm.districtCode = value[2] as string;
  }
};

const setStopInfo = (id: string) => {
  const stop = stopList.value.find((item: any) => item.id === id);
  caseForm.stopOwnerName = stop?.owner;
  caseForm.stopOwnerPhone = stop?.phone;
  caseForm.caseArea = JSON.parse(stop?.addr);
  areaChange(caseForm.caseArea);
};

const getMemberInfo = async (cardNo: string): Promise<boolean | undefined> => {
  const result = await CaseCardGetApi(cardNo);
  if (!result) {
    ElMessageBox.alert('该人员未在系统中登记，请检查', '提示', {
      confirmButtonText: '关闭',
      type: 'warning',
    });
    return true;
  }
  const { statusPerson, username, phone, customer, stops } = result;
  if (statusPerson !== 2) {
    ElMessageBox.alert('该人员未处于在保状态，请检查', '提示', {
      confirmButtonText: '关闭',
      type: 'warning',
    });
    return;
  }

  caseForm.name = username;
  caseForm.phone = phone;
  customerList.value = [customer];
  if (!customer) getCustomerList();
  caseForm.companyId = customer?.id;
  caseForm.companyName = customer?.username;
  await getStopList(customer?.id);
  await getGroupList(customer?.id);
  caseForm.stopId = stops[0]?.id;
  caseForm.stopName = stops[0]?.name;
  if (caseForm.stopId) setStopInfo(caseForm.stopId);
};

const getMemberInfoHandle = useDebounceFn(
  async (cardNo: string): Promise<boolean | undefined> => {
    return await getMemberInfo(cardNo);
  },
  500,
);

const updateListForm = ref<any>(null);

const getCaseDetail = async (id: number | string) => {
  const {
    address,
    bxbm,
    casenoInsuredAttach,
    casenoInsuredMain,
    city,
    cityCode,
    companyId,
    companyName,
    creditcard,
    details,
    district,
    districtCode,
    fujiaxian,
    insureTime,
    insureType,
    insuredAttach,
    insuredAttachName,
    insuredMain,
    insuredMainName,
    name,
    owner,
    phone,
    phoneOwner,
    policyNo,
    policyNoAttach,
    province,
    provinceCode,
    stopId,
    stopName,
    stopOwner,
    stopOwnerName,
    stopOwnerPhone,
    zeren,
    accidentPicture,
    addressPicture,
    cardPicture,
    diseasePicture,
    goodPicture,
    modifyPicture,
    orderPicture,
    otherPicture,
    ticketPicture,
  } = await CaseGetApi(id);

  caseForm.address = address!;
  caseForm.bxbm = bxbm ? Number(bxbm) : '';
  caseForm.casenoInsuredAttach = casenoInsuredAttach!;
  caseForm.casenoInsuredMain = casenoInsuredMain!;
  caseForm.city = city!;
  caseForm.cityCode = cityCode!;
  caseForm.companyId = companyId!;
  caseForm.companyName = companyName!;
  caseForm.creditcard = creditcard!;
  await getMemberInfo(creditcard!);
  caseForm.details = details!;
  caseForm.district = district!;
  caseForm.districtCode = districtCode!;
  caseForm.fujiaxian = fujiaxian!;
  caseForm.insureTime = insureTime!;
  caseForm.insureType = insureType!;
  caseForm.insuredAttach = insuredAttach ? Number(insuredAttach) : '';
  caseForm.insuredAttachName = insuredAttachName!;
  caseForm.insuredMain = insuredMain ? Number(insuredMain) : '';
  caseForm.insuredMainName = insuredMainName!;
  caseForm.name = name!;
  caseForm.owner = owner ? Number(owner) : '';
  caseForm.phone = phone!;
  caseForm.phoneOwner = phoneOwner!;
  caseForm.policyNo = policyNo!;
  caseForm.policyNoAttach = policyNoAttach!;
  caseForm.province = province!;
  caseForm.provinceCode = provinceCode!;
  caseForm.stopId = stopId ? Number(stopId) : '';
  caseForm.stopName = stopName!;
  caseForm.stopOwner = stopOwner!;
  caseForm.stopOwnerName = stopOwnerName!;
  caseForm.stopOwnerPhone = stopOwnerPhone!;
  caseForm.zeren = zeren!;
  caseForm.accidentPicture = accidentPicture!;
  caseForm.addressPicture = addressPicture!;
  caseForm.cardPicture = cardPicture!;
  caseForm.diseasePicture = diseasePicture!;
  caseForm.goodPicture = goodPicture!;
  caseForm.modifyPicture = modifyPicture!;
  caseForm.orderPicture = orderPicture!;
  caseForm.otherPicture = otherPicture!;
  caseForm.ticketPicture = ticketPicture!;
  updateListForm.value = {
    accidentPicture,
    addressPicture,
    cardPicture,
    diseasePicture,
    goodPicture,
    modifyPicture,
    orderPicture,
    otherPicture,
    ticketPicture,
  };
  caseForm.id = id;
};

const disabledBegin = (time: { getTime: () => number }) => {
  return time.getTime() > Date.now();
};

const recognitionText = ref('');
const btnLoading = ref(false);

const handleRecognition = async () => {
  if (!recognitionText.value) return ElMessage.error('请输入识别文本');

  btnLoading.value = true;
  const parseData = parseTemplate(recognitionText.value);
  if (!parseData) return (btnLoading.value = false);

  const isNoData = await getMemberInfoHandle(parseData.creditcard || '');
  if (isNoData) return (btnLoading.value = false);

  caseForm.creditcard = parseData.creditcard || '';
  caseForm.insureTime = parseData.insureTime || '';
  caseForm.address = parseData.address || '';
  caseForm.details = parseData.details || '';
  if (!caseForm.phone) caseForm.phone = parseData.phone || '';
  if (!caseForm.stopId) {
    caseForm.stopName = parseData.stopName || '';
    caseForm.stopOwnerName = parseData.stopOwnerName || '';
    caseForm.stopOwnerPhone = parseData.stopOwnerPhone || '';
  }
  btnLoading.value = false;
};

function parseTemplate(template: string) {
  const mapping: { [key: string]: string } = {
    公司名称: 'companyName',
    城市名称: 'cityName',
    站点名称: 'stopName',
    站长姓名: 'stopOwnerName',
    联系方式: 'stopOwnerPhone',
    骑手ID: 'owner',
    骑手姓名: 'name',
    骑手身份证号: 'creditcard',
    骑手电话: 'phone',
    事发时间: 'insureTime',
    事发地点: 'address',
    事故经过: 'details',
    '受伤部位（物损情况）': 'injuryDetails',
    '是否涉及三者（三者信息）': 'isThirdParty',
    就诊医院名称: 'hospital',
    是否住院: 'isHospitalized',
    '目前/预计治疗金额': 'medicalCost',
    是否报警或责任认定结果: 'isReported',
    影像资料: 'files',
    备注: 'remark',
  };

  const result: { [key: string]: string } = {};
  const lines = template.split('\n');
  let validLines = 0;

  for (const line of lines) {
    let colonIndex = line.indexOf('：');
    if (colonIndex === -1) {
      colonIndex = line.indexOf(':');
    }
    if (colonIndex !== -1) {
      const key: string = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (mapping[key]) {
        validLines++;
        if (key === '事发时间') {
          value = parseIncidentTime(value);
        }
        result[mapping[key]] = value;
      }
    }
  }

  if (validLines === 0) {
    ElMessage.error('请按照模板格式填写');
    return;
  }

  return result;
}

function parseIncidentTime(timeStr: string) {
  timeStr = timeStr.replace('左右', '');
  let match = timeStr.match(
    /(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})时(\d{1,2})分(\d{1,2})/,
  );
  if (!match) {
    match = timeStr.match(
      /(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})时(\d{1,2})分/,
    );
  }
  if (match) {
    const year = match[1];
    const month = String(match[2]).padStart(2, '0');
    const day = String(match[3]).padStart(2, '0');
    const hour = String(match[4]).padStart(2, '0');
    const minute = String(match[5]).padStart(2, '0');
    const second = match[6] ? String(match[6]).padStart(2, '0') : '00';
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
  return timeStr;
}

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getCaseDetail(id.value);
  }
  mainInsureList.value = await getInsureList(1);
  addiInsureList.value = await getInsureList(2);
});
</script>

<template>
  <Page :title="`${id ? '更新' : '新建'}案件`" v-loading="loading">
    <ElForm
      ref="caseFormRef"
      :model="caseForm"
      :rules="rules"
      class="demo-caseForm"
      label-width="auto"
      status-icon
    >
      <ElRow :gutter="20">
        <ElCol :lg="12" class="mb-4">
          <ElCard class="h-full">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
              </div>
            </template>

            <ElScrollbar max-height="calc(100vh - 340px)">
              <ElRow :gutter="20" class="w-full">
                <ElCol :span="24" class="mb-6">
                  <ElFormItem label="智能填写">
                    <ElInput
                      v-model="recognitionText"
                      :autosize="{ minRows: 4, maxRows: 8 }"
                      placeholder="请输入"
                      type="textarea"
                    />
                    <ElButton
                      :loading="btnLoading"
                      class="mt-2"
                      type="primary"
                      @click="handleRecognition"
                    >
                      一键识别
                    </ElButton>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="身份证" prop="creditcard">
                    <ElInput
                      v-model="caseForm.creditcard"
                      :readonly="!!id"
                      placeholder="请输入"
                      @change="getMemberInfoHandle"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="姓名" prop="name">
                    <ElInput
                      v-model="caseForm.name"
                      :readonly="!!id"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="手机号" prop="phone">
                    <ElInput v-model="caseForm.phone" placeholder="请输入" />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="出险时间" prop="insureTime">
                    <ElDatePicker
                      v-model="caseForm.insureTime"
                      :disabled-date="disabledBegin"
                      placeholder="请选择"
                      type="datetime"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="所属客户" prop="companyId">
                    <ElSelect
                      v-model="caseForm.companyId"
                      @change="getFormListData"
                    >
                      <ElOption
                        v-for="item in customerList"
                        :key="item.id"
                        :label="item.username"
                        :value="item.id"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="所属站点">
                    <ElSelect v-model="caseForm.stopId" @change="setStopName">
                      <ElOption
                        v-for="item in stopList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="站长姓名" prop="stopOwnerName">
                    <ElInput
                      v-model="caseForm.stopOwnerName"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="站长手机号" prop="stopOwnerPhone">
                    <ElInput
                      v-model="caseForm.stopOwnerPhone"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="保险编码" prop="bxbm">
                    <div class="flex w-full gap-2">
                      <ElSelect
                        v-model="caseForm.bxbm"
                        :no-data-text="
                          caseForm.companyId
                            ? '此客户未添加保险方案'
                            : '请先选择所属客户'
                        "
                        class="flex-1"
                      >
                        <ElOption
                          v-for="item in planList"
                          :key="item.id"
                          :label="item.insureSn"
                          :value="item.id"
                        />
                      </ElSelect>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="有无附加险" prop="fujiaxian">
                    <ElRadioGroup v-model="caseForm.fujiaxian">
                      <ElRadioButton label="有" value="1" />
                      <ElRadioButton label="无" value="0" />
                    </ElRadioGroup>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="事故区域" prop="caseArea">
                    <ElCascader
                      v-model="caseForm.caseArea"
                      :options="areaOptions"
                      class="w-full"
                      @change="areaChange"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :xl="12">
                  <ElFormItem label="出险类型" prop="insureType">
                    <ElRadioGroup v-model="caseForm.insureType">
                      <ElRadioButton :value="1" label="自身受伤" />
                      <ElRadioButton :value="2" label="三者受伤" />
                      <ElRadioButton :value="3" label="三者物损" />
                    </ElRadioGroup>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="详细地址" prop="address">
                    <ElInput
                      v-model="caseForm.address"
                      :autosize="{ minRows: 4 }"
                      placeholder="请输入"
                      type="textarea"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="事故经过" prop="details">
                    <ElInput
                      v-model="caseForm.details"
                      :autosize="{ minRows: 4 }"
                      placeholder="请输入"
                      type="textarea"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="责任判定">
                    <ElRadioGroup v-model="caseForm.zeren">
                      <ElRadioButton :value="1" label="全责" />
                      <ElRadioButton :value="2" label="主责" />
                      <ElRadioButton :value="3" label="次责" />
                      <ElRadioButton :value="4" label="同责" />
                      <ElRadioButton :value="5" label="无责" />
                      <ElRadioButton :value="6" label="摔伤" />
                    </ElRadioGroup>
                    <ElButton
                      class="ml-4"
                      type="primary"
                      @click="caseForm.zeren = ''"
                    >
                      重置
                    </ElButton>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="理赔员" prop="owner">
                    <ElSelect v-model="caseForm.owner" @change="setOwnerPhone">
                      <ElOption
                        v-for="item in authuserList"
                        :key="item.id"
                        :label="item.description"
                        :value="item.id"
                      >
                        <span style="float: left">{{ item.description }}</span>
                        <span
                          style="
                            float: right;
                            font-size: 13px;
                            color: var(--el-text-color-secondary);
                          "
                        >
                          {{ item.username }}
                        </span>
                      </ElOption>
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="理赔员手机号" prop="phoneOwner">
                    <ElInput
                      v-model="caseForm.phoneOwner"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElScrollbar>
          </ElCard>
        </ElCol>

        <ElCol :lg="12" class="mb-4">
          <ElCard class="h-full">
            <template #header>
              <div class="card-header">
                <span>扩展信息</span>
              </div>
            </template>

            <ElScrollbar max-height="calc(100vh - 340px)">
              <ElRow :gutter="20" class="w-full">
                <ElCol :lg="12">
                  <ElFormItem label="主险">
                    <ElSelect
                      v-model="caseForm.insuredMain"
                      clearable
                      @change="setMainName"
                    >
                      <ElOption
                        v-for="item in mainInsureList"
                        :key="item.id"
                        :label="item.ordertype"
                        :value="item.id"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="附加险">
                    <ElSelect
                      v-model="caseForm.insuredAttach"
                      clearable
                      @change="setAddiName"
                    >
                      <ElOption
                        v-for="item in addiInsureList"
                        :key="item.id"
                        :label="item.ordertype"
                        :value="item.id"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="主险保单号">
                    <ElInput v-model="caseForm.policyNo" placeholder="请输入" />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="附加险保单号">
                    <ElInput
                      v-model="caseForm.policyNoAttach"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="主险报案号">
                    <ElInput
                      v-model="caseForm.casenoInsuredMain"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="附加险报案号">
                    <ElInput
                      v-model="caseForm.casenoInsuredAttach"
                      placeholder="请输入"
                    />
                  </ElFormItem>
                </ElCol>

                <UploadList
                  :id="id"
                  ref="uploadListRef"
                  :upload-data="updateListForm"
                />
              </ElRow>
            </ElScrollbar>
          </ElCard>
        </ElCol>
      </ElRow>
    </ElForm>

    <div class="flex w-full justify-end">
      <ElButton v-if="id" type="primary" @click="updateForm(caseFormRef)">
        更新
      </ElButton>
      <ElButton v-else type="primary" @click="submitForm(caseFormRef)">
        提交
      </ElButton>
      <ElButton @click="back">取消</ElButton>
    </div>
  </Page>
</template>

<style scoped>
:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-form-item .el-date-editor) {
  width: 100%;
}
</style>
