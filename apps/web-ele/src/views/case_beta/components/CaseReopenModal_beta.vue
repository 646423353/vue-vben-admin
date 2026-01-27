<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CaseApi } from '#/api/core/case';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { CaseGetApi, CaseReopenApi } from '#/api/core/case';

import CaseInfo from './CaseInfo.vue';

interface ReopenForm {
  reason: string;
}

const emit = defineEmits(['reloadList']);
const reopenFormRef = ref<FormInstance>();
const reopenForm = reactive<ReopenForm>({
  reason: '',
});

const rules = reactive<FormRules<ReopenForm>>({
  reason: [{ required: true, message: '请输入重开原因', trigger: 'blur' }],
});

const id = ref<string>('');
const caseInfoRef = ref<any>(null);
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
  lipeiPerson: '',
});

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
    created,
    username,
    usernameOwner,
    lipeiPerson,
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
  caseForm.created = created!;
  caseForm.username = username!;
  caseForm.lipeiPerson = lipeiPerson!;
  caseForm.id = id;
  caseForm.usernameOwner = usernameOwner!;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(reopenFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    reopenFormRef.value?.validate(async (valid) => {
      if (!valid) return;
      const result = await CaseReopenApi(id.value, reopenForm.reason);
      ElMessage.success(`${result}`);
      emit('reloadList');
      resetForm(reopenFormRef.value);
      modalApi.close();
    });
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getCaseDetail(uid);
      }
    }
  },
  title: '重开案件',
  cancelText: '关闭',
  confirmText: '提交',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}
</script>
<template>
  <Modal class="w-[600px]">
    <div class="p-4 pb-0">
      <CaseInfo
        ref="caseInfoRef"
        :case-id="id"
        :case-info="caseForm"
        :is-log="true"
      />

      <ElDivider class="!mt-0" />

      <ElForm
        ref="reopenFormRef"
        :model="reopenForm"
        :rules="rules"
        class="demo-reopenForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="重开原因：" label-position="top" prop="reason">
          <ElInput
            v-model="reopenForm.reason"
            :autosize="{ minRows: 4 }"
            placeholder="请输入"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
