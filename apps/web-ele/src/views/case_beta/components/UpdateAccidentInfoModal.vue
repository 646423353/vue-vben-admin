<script lang="ts" setup>
import type { TbCaseWithBLOBs } from '#/api/core/case-record';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { codeToText, regionData } from 'element-china-area-data';
import {
  ElButton,
  ElCascader,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { CaseRecordUpdateApi } from '#/api/core/case-record';

import DraggableUploadList from '../components/DraggableUploadList.vue';

const emit = defineEmits(['success']);

// 只读模式和自定义标题
const isReadonly = ref(false);
const customTitle = ref('');

const areaOptions = regionData as any;

const CircleClose = createIconifyIcon('ant-design:close-circle-outlined');

// 1. Rider & Reporter Info
const riderFormRef = ref();
const riderForm = reactive({
  name: '', // Rider Name
  creditcard: '', // Rider ID
  phone: '', // Rider Phone

  isManual: false, // isManualReport -> isManual
  reporterIsRider: false,
  nameRep: '', // reporterName -> nameRep
  phoneRep: '', // reporterPhone -> phoneRep
  creditcardRep: '', // reporterIdCard -> creditcardRep
});

// Auto-sync Reporter Info with Rider Info
watch(
  [
    () => riderForm.reporterIsRider,
    () => riderForm.name,
    () => riderForm.creditcard,
    () => riderForm.phone,
  ],
  ([isSame, name, card, phone]) => {
    if (isSame) {
      riderForm.nameRep = name;
      riderForm.creditcardRep = card;
      riderForm.phoneRep = phone;
    }
  },
);

// Regex Patterns
const PATTERN_PHONE = /^1[3-9]\d{9}$/;
const PATTERN_ID_CARD =
  /^[1-9]\d{5}(?:18|19|20)?\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}(?:\d|X)$/i;
const PATTERN_CREDIT_CODE = /^[0-9A-Z]{18}$/;

const validatePhone = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback();
    return;
  }
  if (!PATTERN_PHONE.test(value)) {
    callback(new Error('手机号格式错误'));
    return;
  }
  callback();
};

const validateIdentityCard = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback();
    return;
  }
  if (!PATTERN_ID_CARD.test(value)) {
    callback(new Error('身份证格式错误'));
    return;
  }
  callback();
};

const riderRules = {
  name: [{ required: true, message: '请输入骑手姓名', trigger: 'blur' }],
  creditcard: [
    { required: true, message: '请输入骑手身份证号', trigger: 'blur' },
    { validator: validateIdentityCard, trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入骑手手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
};

async function handleUpdateRider() {
  if (!riderFormRef.value) return;
  await riderFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // Files logic
        const files = uploadListRef.value?.getTbCaseFiles() || [];
        const originalFiles = originalCaseData.value.files || [];
        const normalizeFile = (list: any[]) =>
          list.map((f) => ({
            cateId: f.cateId,
            url: f.url,
            title: f.title,
            id: f.id,
          }));

        // ZTS logic
        const currentZts = fullCaseData.value.zts || [];
        const originalZts = originalCaseData.value.zts || [];
        const normalizeZt = (list: any[]) =>
          list.map((item) => ({
            zt: item.zt,
            username: item.username,
            phone: item.phone,
            id: item.id,
          }));

        const rawPayload = {
          id: Number(id.value),
          name: riderForm.name,
          creditcard: riderForm.creditcard,
          phone: riderForm.phone,
          shougong: riderForm.isManual ? 1 : 0,
          // reporter
          nameRep: riderForm.nameRep,
          reporterName: riderForm.nameRep,
          phoneRep: riderForm.phoneRep,
          reporterPhone: riderForm.phoneRep,
          creditcardRep: riderForm.creditcardRep,
          reporterIdCard: riderForm.creditcardRep,
          files: isDeepEqual(normalizeFile(files), normalizeFile(originalFiles))
            ? []
            : files,
          zts: areZtsEqual(normalizeZt(currentZts), normalizeZt(originalZts))
            ? []
            : currentZts,
        };

        const payload = getFilteredPayload(rawPayload);

        // If nothing changed (only id), maybe skip?
        // But user might want to confirm valid.
        // If payload only has ID, we technically don't need to call API, but calling it is safe.

        await CaseRecordUpdateApi(payload);

        Object.assign(fullCaseData.value, rawPayload);
        Object.assign(originalCaseData.value, rawPayload);

        ElMessage.success('骑手基本信息/报案人信息 更新成功');
        emit('success');
      } catch (error) {
        console.error(error);
        ElMessage.error('更新失败');
      }
    }
  });
}

// 2. Insurance Info
const insuranceFormRef = ref();
const insuranceForm = reactive({
  policyNo: '', // mainPolicyNo -> policyNo
  companyMain: '', // companyName -> companyMain
  insuredMainName: '', // mainPlan -> insuredMainName
  customerName: '', // companyIdName -> customerName (Display only)
  channelName: '', // mainChannel -> channelName
  tbr: '', // holderName -> tbr
  tbrCardtype: 0, // holderIdType -> tbrCardtype
  tbCard: '', // holderIdNo -> tbCard
  bbr: '', // insuredName -> bbr
  bbrCardtype: 0, // insuredIdType -> bbrCardtype
  bbCard: '', // insuredIdNo -> bbCard

  policyNoAttach: '', // attachPolicyNo -> policyNoAttach
  // attachCompanyName field removed in favor of companyAttach for consistency
  companyAttach: '',
  insuredAttachName: '', // attachPlan -> insuredAttachName

  tbrAttach: '', // attachHolderName -> tbrAttach
  tbrCardtypeAttach: 0, // attachHolderIdType -> tbrCardtypeAttach
  tbCardAttach: '', // attachHolderIdNo -> tbCardAttach
  bbrAttach: '', // attachInsuredName -> bbrAttach
  bbrCardtypeAttach: 0, // attachInsuredIdType -> bbrCardtypeAttach
  bbCardAttach: '', // attachInsuredIdNo -> bbCardAttach

  stopName: '', // stationName -> stopName
  stopOwnerName: '', // stationMaster -> stopOwnerName
  stopOwnerPhone: '', // stationMasterPhone -> stopOwnerPhone
});

const validateInsuranceIdCard = (typeField: string) => {
  return (_rule: any, value: any, callback: any) => {
    if (!value) {
      callback();
      return;
    }
    const type = (insuranceForm as any)[typeField];
    // 0: 身份证, 1: 统一信用代码
    if (type === 0 && !PATTERN_ID_CARD.test(value)) {
      callback(new Error('身份证格式错误'));
      return;
    }
    if (type === 1 && !PATTERN_CREDIT_CODE.test(value)) {
      callback(new Error('统一信用代码格式错误'));
      return;
    }
    callback();
  };
};

const insuranceRules = {
  // Main Insurance
  companyMain: [
    { required: true, message: '请输入保险公司名称', trigger: 'blur' },
  ],
  insuredMainName: [
    { required: true, message: '请输入主险方案', trigger: 'blur' },
  ],
  tbr: [{ required: true, message: '请输入投保人名称', trigger: 'blur' }],
  tbrCardtype: [
    { required: true, message: '请选择投保人证件类型', trigger: 'change' },
  ],
  tbCard: [
    { required: true, message: '请输入投保人证件号', trigger: 'blur' },
    { validator: validateInsuranceIdCard('tbrCardtype'), trigger: 'blur' },
  ],
  bbr: [{ required: true, message: '请输入被保人名称', trigger: 'blur' }],
  bbrCardtype: [
    { required: true, message: '请选择被保人证件类型', trigger: 'change' },
  ],
  bbCard: [
    { required: true, message: '请输入被保人证件号', trigger: 'blur' },
    { validator: validateInsuranceIdCard('bbrCardtype'), trigger: 'blur' },
  ],
  // Additional Insurance
  bbrAttach: [{ required: true, message: '请输入被保人名称', trigger: 'blur' }],
  bbCardAttach: [
    { required: true, message: '请输入被保人证件号', trigger: 'blur' },
    {
      validator: validateInsuranceIdCard('bbrCardtypeAttach'),
      trigger: 'blur',
    },
  ],
  tbCardAttach: [
    {
      validator: validateInsuranceIdCard('tbrCardtypeAttach'),
      trigger: 'blur',
    },
  ],
  // Station Info
  stopOwnerName: [
    { required: true, message: '请输入站长姓名', trigger: 'blur' },
  ],
  stopOwnerPhone: [
    { required: true, message: '请输入站长手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
};

async function handleUpdateInsurance() {
  if (!insuranceFormRef.value) return;
  await insuranceFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // Files logic
        const files = uploadListRef.value?.getTbCaseFiles() || [];
        const originalFiles = originalCaseData.value.files || [];
        const normalizeFile = (list: any[]) =>
          list.map((f) => ({
            cateId: f.cateId,
            url: f.url,
            title: f.title,
            id: f.id,
          }));

        // ZTS logic
        const currentZts = fullCaseData.value.zts || [];
        const originalZts = originalCaseData.value.zts || [];
        const normalizeZt = (list: any[]) =>
          list.map((item) => ({
            zt: item.zt,
            username: item.username,
            phone: item.phone,
            id: item.id,
          }));

        const rawPayload = {
          id: Number(id.value),
          policyNo: insuranceForm.policyNo,
          companyMain: insuranceForm.companyMain,
          companyName: insuranceForm.companyMain, // Sync
          insuredMainName: insuranceForm.insuredMainName,
          customerName: insuranceForm.customerName,
          channelName: insuranceForm.channelName,
          tbr: insuranceForm.tbr,
          tbrCardtype: Number(insuranceForm.tbrCardtype),
          tbCard: insuranceForm.tbCard,
          bbr: insuranceForm.bbr,
          bbrCardtype: Number(insuranceForm.bbrCardtype),
          bbCard: insuranceForm.bbCard,
          policyNoAttach: insuranceForm.policyNoAttach,
          companyAttach: insuranceForm.companyAttach,
          insuredAttachName: insuranceForm.insuredAttachName,
          tbrAttach: insuranceForm.tbrAttach,
          tbrCardtypeAttach: Number(insuranceForm.tbrCardtypeAttach),
          tbCardAttach: insuranceForm.tbCardAttach,
          bbrAttach: insuranceForm.bbrAttach,
          bbrCardtypeAttach: Number(insuranceForm.bbrCardtypeAttach),
          bbCardAttach: insuranceForm.bbCardAttach,
          stopName: insuranceForm.stopName,
          stopOwnerName: insuranceForm.stopOwnerName,
          stopOwnerPhone: insuranceForm.stopOwnerPhone,
          files: isDeepEqual(normalizeFile(files), normalizeFile(originalFiles))
            ? []
            : files,
          zts: areZtsEqual(normalizeZt(currentZts), normalizeZt(originalZts))
            ? []
            : currentZts,
        };

        const payload = getFilteredPayload(rawPayload);

        await CaseRecordUpdateApi(payload);

        Object.assign(fullCaseData.value, rawPayload);
        Object.assign(originalCaseData.value, rawPayload);

        ElMessage.success('保险信息（保单和订单信息） 更新成功');
        emit('success');
      } catch (error) {
        console.error(error);
        ElMessage.error('更新失败');
      }
    }
  });
}

// 3. Accident Description & Third Party
// 3. Accident Description & Third Party
const accidentFormRef = ref();
const accidentForm = reactive({
  details: '', // description -> details
  caseArea: [] as string[], // array for Cascader
  address: '', // Detailed address
  insureTime: '', // time -> insureTime
  zts: [{ username: '', phone: '' }],
});

const disabledBegin = (time: { getTime: () => number }) => {
  return time.getTime() > Date.now();
};

const accidentRules = {
  details: [
    { required: true, message: '请输入出险事故详细描述', trigger: 'blur' },
  ],
  caseArea: [{ required: true, message: '请选择事故区域', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  insureTime: [
    { required: true, message: '请选择事故时间', trigger: 'change' },
  ],
};

const validateThirdPartyPhone = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(); // Empty value is valid
  } else if (/^1[3-9]\d{9}$/.test(value)) {
    callback();
  } else {
    callback(new Error('手机号格式错误'));
  }
};

function addThirdParty() {
  accidentForm.zts.push({ username: '', phone: '' });
}

function removeThirdParty(index: number) {
  accidentForm.zts.splice(index, 1);
}

async function handleUpdateAccident() {
  if (!accidentFormRef.value) return;
  await accidentFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // Extract area codes and names
        let provinceCode = '';
        let cityCode = '';
        let districtCode = '';
        let province = '';
        let city = '';
        let district = '';

        if (
          accidentForm.caseArea &&
          Array.isArray(accidentForm.caseArea) &&
          accidentForm.caseArea.length >= 3
        ) {
          provinceCode = accidentForm.caseArea[0] || '';
          cityCode = accidentForm.caseArea[1] || '';
          districtCode = accidentForm.caseArea[2] || '';
          province = codeToText[provinceCode] || '';
          city = codeToText[cityCode] || '';
          district = codeToText[districtCode] || '';
        }

        const constructedZts = [
          {
            zt: '骑手',
            username: riderForm.name || fullCaseData.value.name,
            phone: riderForm.phone || fullCaseData.value.phone,
            comments: '',
            id: riderZtId.value ? String(riderZtId.value) : undefined,
          },
          ...accidentForm.zts.map((item) => ({
            username: item.username,
            phone: item.phone,
            zt: '三者', // Default tag
          })),
        ];

        // Files logic
        const files = uploadListRef.value?.getTbCaseFiles() || [];
        const originalFiles = originalCaseData.value.files || [];
        const normalizeFile = (list: any[]) =>
          list.map((f) => ({
            cateId: f.cateId,
            url: f.url,
            title: f.title,
            id: f.id,
          }));

        const rawPayload: any = {
          id: Number(id.value),
          details: accidentForm.details,
          // Update address components
          province,
          provinceCode,
          city,
          cityCode,
          district,
          districtCode,
          address: accidentForm.address, // Detailed address
          insureTime: accidentForm.insureTime
            ? String(moment(accidentForm.insureTime).valueOf())
            : undefined,
          files: isDeepEqual(normalizeFile(files), normalizeFile(originalFiles))
            ? []
            : files,
        };

        // Deep verify zts
        const originalZts = originalCaseData.value.zts || [];
        const normalizeZt = (list: any[]) =>
          list.map((item) => ({
            zt: item.zt,
            username: item.username,
            phone: item.phone,
            id: item.id,
          }));

        const currentZtsNormalized = normalizeZt(constructedZts);
        const originalZtsNormalized = normalizeZt(originalZts);

        if (!areZtsEqual(currentZtsNormalized, originalZtsNormalized)) {
          rawPayload.zts = constructedZts;
        }

        const payload = getFilteredPayload(rawPayload);

        await CaseRecordUpdateApi(payload);

        Object.assign(fullCaseData.value, rawPayload);
        // If zts was included, update it too
        if (rawPayload.zts) {
          Object.assign(fullCaseData.value, { zts: rawPayload.zts });
        }
        if (rawPayload.files) {
          Object.assign(fullCaseData.value, { files: rawPayload.files });
        }
        Object.assign(originalCaseData.value, rawPayload);
        rawPayload.zts = areZtsEqual(
          currentZtsNormalized,
          originalZtsNormalized,
        )
          ? []
          : constructedZts;

        ElMessage.success('事故描述信息/三者信息 更新成功');
        emit('success');
      } catch (error) {
        console.error(error);
        ElMessage.error('更新失败');
      }
    }
  });
}

function handleUpdateFiles() {
  const files = uploadListRef.value?.getTbCaseFiles() || [];
  // Basic validation: Check if file list is not empty if required (optional)
  // And strictly check if tags are selected for all files
  const invalidFile = files.find((f: any) => !f.cateId);
  if (invalidFile) {
    ElMessage.warning(`请为文件 "${invalidFile.title}" 选择标签`);
    return;
  }

  // Deep comparison for files
  const originalFiles = originalCaseData.value.files || [];
  const normalizeFile = (list: any[]) =>
    list.map((f) => ({
      cateId: f.cateId,
      url: f.url,
      title: f.title,
      id: f.id,
    }));

  // If undefined/empty vs empty, equal.
  // Using isDeepEqual with normalized list.
  const currentFilesNorm = normalizeFile(files);
  const originalFilesNorm = normalizeFile(originalFiles);

  // ZTS logic
  const currentZts = fullCaseData.value.zts || [];
  const originalZts = originalCaseData.value.zts || [];
  const normalizeZt = (list: any[]) =>
    list.map((item) => ({
      zt: item.zt,
      username: item.username,
      phone: item.phone,
      id: item.id,
    }));

  const payload: any = {
    id: Number(id.value),
    files: isDeepEqual(currentFilesNorm, originalFilesNorm) ? [] : files,
    zts: areZtsEqual(normalizeZt(currentZts), normalizeZt(originalZts))
      ? []
      : currentZts,
  };

  CaseRecordUpdateApi(payload)
    .then(() => {
      // Update local state
      if (fullCaseData.value) fullCaseData.value.files = files;
      if (originalCaseData.value) originalCaseData.value.files = files;

      ElMessage.success('图像文件信息 更新成功');
      emit('success');
    })
    .catch((error) => {
      console.error(error);
      ElMessage.error('更新失败');
    });
}

function handleTagChange() {
  const files = uploadListRef.value?.getTbCaseFiles() || [];
  // Ensure all files have tags before updating
  const allTagged = files.every((f: any) => f.cateId);
  if (allTagged && files.length > 0) {
    handleUpdateFiles();
  }
}

// 文件上传列表和完整案件数据
const fileList = ref<any[]>([]);
const uploadListRef = ref();
const fullCaseData = ref<TbCaseWithBLOBs>({});
const originalCaseData = ref<TbCaseWithBLOBs>({});
const riderZtId = ref<number | undefined>(undefined);

// Helper for deep comparison (simplified)
const isDeepEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

// ZTS comparison: normalize structure
const areZtsEqual = (ztsA: any[], ztsB: any[]) => {
  if (!ztsA && !ztsB) return true;
  if (!ztsA || !ztsB) return false;
  // Filter out empty rows if any
  const realA = ztsA.filter((z) => z.username || z.phone);
  const realB = ztsB.filter((z) => z.username || z.phone);
  if (realA.length !== realB.length) return false;

  // Sort by ID or content?
  // Let's sort by username + phone to be safe
  const sorter = (a: any, b: any) =>
    (a.username + a.phone).localeCompare(b.username + b.phone);
  const sortedA = realA.toSorted(sorter);
  const sortedB = realB.toSorted(sorter);

  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
};

const getFilteredPayload = (targetPayload: any) => {
  const finalPayload: any = {};
  // Always include ID
  if (targetPayload.id !== undefined) {
    finalPayload.id = targetPayload.id;
  }
  // Always include zts if present in target (logic handled by caller)
  if (targetPayload.zts) {
    finalPayload.zts = targetPayload.zts;
  }
  // Always include files if present in target
  if (targetPayload.files) {
    finalPayload.files = targetPayload.files;
  }

  for (const key in targetPayload) {
    if (key === 'id' || key === 'zts' || key === 'files') continue;

    const val = targetPayload[key];
    const originalVal = (originalCaseData.value as any)[key];

    // 1. Check if empty
    if (val === undefined || val === null || val === '') {
      continue;
    }

    // 2. Check if modified (loose equality)
    if (String(val) === String(originalVal)) {
      continue;
    }

    finalPayload[key] = val;
  }
  return finalPayload;
};

// 计算模态框标题
const modalTitle = computed(() => {
  return customTitle.value || '更新案件基本信息';
});

const [Modal, modalApi] = useVbenModal({
  get title() {
    return modalTitle.value;
  },
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
      // 接收readonly和customTitle参数
      // 接收readonly和customTitle参数，如果未提供则重置为默认值
      isReadonly.value = data?.readonly ?? false;
      customTitle.value = data?.customTitle || '';

      // Force update title immediately
      modalApi.setState({ title: customTitle.value || '更新案件基本信息' });

      if (data?.caseData) {
        const cd = data.caseData;
        fullCaseData.value = cd;
        // Deep clone for original data
        // eslint-disable-next-line unicorn/prefer-structured-clone
        originalCaseData.value = JSON.parse(JSON.stringify(cd));

        const rider = cd.zts?.find((item: any) => item.zt === '骑手');
        riderZtId.value = rider?.id;

        // Section 1: Rider
        riderForm.name = cd.name || '';
        riderForm.creditcard = cd.creditcard || '';
        riderForm.phone = cd.phone || '';

        riderForm.isManual = cd.shougong === 1;

        riderForm.nameRep = cd.nameRep || '';
        riderForm.phoneRep = cd.phoneRep || '';
        riderForm.creditcardRep = cd.creditcardRep || '';

        // Auto-check 'reporterIsRider' if IDs match
        riderForm.reporterIsRider = !!(
          riderForm.creditcard &&
          riderForm.creditcardRep &&
          riderForm.creditcard === riderForm.creditcardRep
        );

        // Section 2: Insurance
        insuranceForm.policyNo = cd.policyNo || '';
        insuranceForm.companyMain = cd.companyMain || cd.companyName || '';
        insuranceForm.insuredMainName = cd.insuredMainName || '';
        insuranceForm.customerName = cd.customerName || ''; // Display
        insuranceForm.channelName = cd.channelName || '';
        insuranceForm.tbr = cd.tbr || '';
        insuranceForm.tbrCardtype =
          typeof cd.tbrCardtype === 'number' ? cd.tbrCardtype : 0;
        insuranceForm.tbCard = cd.tbCard || '';
        insuranceForm.bbr = cd.bbr || '';
        insuranceForm.bbrCardtype =
          typeof cd.bbrCardtype === 'number' ? cd.bbrCardtype : 0;
        insuranceForm.bbCard = cd.bbCard || '';

        insuranceForm.policyNoAttach = cd.policyNoAttach || '';
        insuranceForm.companyAttach = cd.companyAttach || '';
        insuranceForm.insuredAttachName = cd.insuredAttachName || '';

        insuranceForm.tbrAttach = cd.tbrAttach || '';
        insuranceForm.tbrCardtypeAttach =
          typeof cd.tbrCardtypeAttach === 'number' ? cd.tbrCardtypeAttach : 0;
        insuranceForm.tbCardAttach = cd.tbCardAttach || '';
        insuranceForm.bbrAttach = cd.bbrAttach || '';
        insuranceForm.bbrCardtypeAttach =
          typeof cd.bbrCardtypeAttach === 'number' ? cd.bbrCardtypeAttach : 0;
        insuranceForm.bbCardAttach = cd.bbCardAttach || '';

        insuranceForm.stopName = cd.stopName || '';
        insuranceForm.stopOwnerName = cd.stopOwnerName || '';
        insuranceForm.stopOwnerPhone = cd.stopOwnerPhone || '';

        // Section 3: Accident
        accidentForm.details = cd.details || '';

        // Initialize area from codes
        accidentForm.caseArea =
          cd.provinceCode && cd.cityCode && cd.districtCode
            ? [
                String(cd.provinceCode),
                String(cd.cityCode),
                String(cd.districtCode),
              ]
            : [];
        accidentForm.address = cd.address || '';

        accidentForm.insureTime = cd.insureTime
          ? moment(Number(cd.insureTime)).format('YYYY-MM-DD HH:mm:ss')
          : '';

        // Third Party
        accidentForm.zts =
          cd.zts && Array.isArray(cd.zts) && cd.zts.length > 0
            ? cd.zts
                .filter((item: any) => item.zt !== '骑手')
                .map((item: any) => ({
                  username: item.username || '',
                  phone: item.phone || '',
                }))
            : [{ username: '', phone: '' }];
        // Ensure not empty if filtered resulted in empty
        if (accidentForm.zts.length === 0) {
          accidentForm.zts.push({ username: '', phone: '' });
        }

        // Section 4: Files
        fileList.value = cd.files || [];
      }
    }
  },
});

const id = ref('');
</script>

<template>
  <Modal>
    <div class="min-h-screen space-y-6 bg-gray-50 p-4 dark:bg-slate-900">
      <!-- Section 1: Rider Basic Info -->
      <div
        class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
      >
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800 dark:text-gray-100"
        >
          骑手基本信息
        </div>

        <ElForm
          ref="riderFormRef"
          :model="riderForm"
          :rules="riderRules"
          label-position="left"
          label-width="auto"
          :disabled="isReadonly"
        >
          <ElRow :gutter="24">
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手姓名" prop="name" required>
                <ElInput
                  v-model="riderForm.name"
                  placeholder="请输入骑手姓名"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手身份证号" prop="creditcard" required>
                <ElInput
                  v-model="riderForm.creditcard"
                  placeholder="请输入身份证号"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手手机号" prop="phone" required>
                <ElInput v-model="riderForm.phone" placeholder="请输入手机号" />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <div
            v-if="!isReadonly"
            class="my-4 border-t border-dashed border-gray-200 pt-4"
          >
            <div
              class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
            >
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="riderForm.reporterIsRider"
                  class="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >报案人同骑手本人信息</span
                >
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="riderForm.isManual"
                  class="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >是否手动填写报案</span
                >
              </div>
            </div>

            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人姓名">
                  <ElInput
                    v-model="riderForm.nameRep"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人姓名"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人身份证号">
                  <ElInput
                    v-model="riderForm.creditcardRep"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人身份证号"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人手机号">
                  <ElInput
                    v-model="riderForm.phoneRep"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人手机号"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton
              v-if="!isReadonly"
              type="primary"
              plain
              @click="handleUpdateRider"
            >
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 2: Insurance Info -->
      <div
        class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
      >
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800 dark:text-gray-100"
        >
          保险信息
        </div>

        <ElForm
          ref="insuranceFormRef"
          :model="insuranceForm"
          :rules="insuranceRules"
          label-position="left"
          label-width="auto"
          :disabled="isReadonly"
        >
          <!-- Main Insurance -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="mr-2 h-4 w-1 bg-blue-500"></div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                主险信息
              </h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="主险保单号">
                  <ElInput v-model="insuranceForm.policyNo" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="保险公司名称" prop="companyMain" required>
                  <ElInput v-model="insuranceForm.companyMain" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="主险方案" prop="insuredMainName" required>
                  <ElInput v-model="insuranceForm.insuredMainName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属客户名">
                  <ElInput v-model="insuranceForm.customerName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属渠道名">
                  <ElInput v-model="insuranceForm.channelName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人名称" prop="tbr" required>
                  <ElInput v-model="insuranceForm.tbr" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件类型" prop="tbrCardtype" required>
                  <ElSelect
                    v-model="insuranceForm.tbrCardtype"
                    placeholder="请选择"
                    class="!w-full"
                  >
                    <ElOption label="身份证" :value="0" />
                    <ElOption label="企业信用代码" :value="1" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件号" prop="tbCard" required>
                  <ElInput v-model="insuranceForm.tbCard" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人名称" prop="bbr" required>
                  <ElInput v-model="insuranceForm.bbr" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件类型" prop="bbrCardtype" required>
                  <ElSelect
                    v-model="insuranceForm.bbrCardtype"
                    placeholder="请选择"
                    class="!w-full"
                  >
                    <ElOption label="身份证" :value="0" />
                    <ElOption label="企业信用代码" :value="1" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件号" prop="bbCard" required>
                  <ElInput v-model="insuranceForm.bbCard" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Additional Insurance -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="mr-2 h-4 w-1 bg-green-500"></div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                附加险信息
              </h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="附加险保单号">
                  <ElInput v-model="insuranceForm.policyNoAttach" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="保险公司名称">
                  <ElInput v-model="insuranceForm.companyAttach" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="附加险方案">
                  <ElInput v-model="insuranceForm.insuredAttachName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人名称">
                  <ElInput v-model="insuranceForm.tbrAttach" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件类型">
                  <ElSelect
                    v-model="insuranceForm.tbrCardtypeAttach"
                    placeholder="请选择"
                    class="!w-full"
                  >
                    <ElOption label="身份证" :value="0" />
                    <ElOption label="企业信用代码" :value="1" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件号" prop="tbCardAttach">
                  <ElInput v-model="insuranceForm.tbCardAttach" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人名称" prop="bbrAttach" required>
                  <ElInput v-model="insuranceForm.bbrAttach" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件类型">
                  <ElSelect
                    v-model="insuranceForm.bbrCardtypeAttach"
                    placeholder="请选择"
                    class="!w-full"
                  >
                    <ElOption label="身份证" :value="0" />
                    <ElOption label="企业信用代码" :value="1" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件号" prop="bbCardAttach" required>
                  <ElInput v-model="insuranceForm.bbCardAttach" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Station Info -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="mr-2 h-4 w-1 bg-yellow-500"></div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                站点信息
              </h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站点名称">
                  <ElInput v-model="insuranceForm.stopName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站长姓名" prop="stopOwnerName" required>
                  <ElInput v-model="insuranceForm.stopOwnerName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站长手机号" prop="stopOwnerPhone" required>
                  <ElInput v-model="insuranceForm.stopOwnerPhone" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton
              v-if="!isReadonly"
              type="primary"
              plain
              @click="handleUpdateInsurance"
            >
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 3: Accident & Third Party -->
      <div
        class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
      >
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800 dark:text-gray-100"
        >
          出险信息
        </div>

        <ElForm
          ref="accidentFormRef"
          :model="accidentForm"
          :rules="accidentRules"
          label-position="left"
          label-width="auto"
          :disabled="isReadonly"
        >
          <!-- Details Info -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="mr-2 h-4 w-1 bg-purple-500"></div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                详细信息
              </h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :span="24">
                <ElFormItem label="出险事故详细描述" prop="details" required>
                  <ElInput
                    type="textarea"
                    :rows="3"
                    v-model="accidentForm.details"
                    placeholder="请输入事故经过、原因、损失情况等详细描述..."
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="事故区域" prop="caseArea" required>
                  <ElCascader
                    v-model="accidentForm.caseArea"
                    :options="areaOptions"
                    class="!w-full"
                    placeholder="请选择省市区"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="事故时间" prop="insureTime" required>
                  <ElDatePicker
                    v-model="accidentForm.insureTime"
                    :disabled-date="disabledBegin"
                    type="datetime"
                    placeholder="精确到分"
                    class="!w-full"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="24">
                <ElFormItem label="详细地址" prop="address" required>
                  <ElInput
                    v-model="accidentForm.address"
                    placeholder="请输入详细地址"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Third Party Info -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="mr-2 h-4 w-1 bg-indigo-500"></div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                三者信息
              </h3>
            </div>

            <div
              v-for="(tp, idx) in accidentForm.zts"
              :key="idx"
              class="relative mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
            >
              <div
                class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div class="flex items-center justify-between sm:justify-start">
                  <div
                    class="whitespace-nowrap font-bold text-gray-700 dark:text-gray-200"
                  >
                    三者{{ idx + 1 }}
                  </div>
                  <!-- Mobile Delete Button (Visible only on mobile) -->
                  <div
                    v-if="accidentForm.zts.length > 1"
                    class="block cursor-pointer text-gray-400 hover:text-red-500 sm:hidden"
                    @click="removeThirdParty(idx)"
                  >
                    <ElIcon :size="20"><CircleClose /></ElIcon>
                  </div>
                </div>

                <ElFormItem
                  label="姓名"
                  label-width="50px"
                  class="!mb-0 w-full flex-1"
                >
                  <ElInput v-model="tp.username" placeholder="请输入" />
                </ElFormItem>
                <ElFormItem
                  label="手机号"
                  label-width="60px"
                  class="!mb-0 w-full flex-1"
                  :prop="`zts.${idx}.phone`"
                  :rules="[
                    {
                      validator: validateThirdPartyPhone,
                      trigger: 'blur',
                    },
                  ]"
                >
                  <ElInput v-model="tp.phone" placeholder="请输入" />
                </ElFormItem>

                <!-- Desktop Delete Button (Visible only on desktop) -->
                <div
                  v-if="accidentForm.zts.length > 1"
                  class="hidden flex-shrink-0 cursor-pointer text-gray-400 hover:text-red-500 sm:block"
                  @click="removeThirdParty(idx)"
                >
                  <ElIcon :size="20"><CircleClose /></ElIcon>
                </div>
              </div>
            </div>

            <ElButton
              v-if="!isReadonly"
              plain
              class="!w-full !border-dashed !border-indigo-300 !text-indigo-500 hover:!border-indigo-500 hover:!text-indigo-600"
              @click="addThirdParty"
            >
              + 添加事故三者信息
            </ElButton>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton
              v-if="!isReadonly"
              type="primary"
              plain
              @click="handleUpdateAccident"
            >
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 4: File Upload -->
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
          :readonly="isReadonly"
          :allow-delete="false"
          @tag-change="handleTagChange"
        />

        <div class="mt-4 flex justify-end">
          <!-- <ElButton
            v-if="!isReadonly"
            type="primary"
            plain
            @click="handleUpdateFiles"
          >
            更新
          </ElButton> -->
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
