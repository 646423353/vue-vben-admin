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
  ElSwitch,
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

const validatePhone = (_: any, value: any, callback: any) => {
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

const validateIdentityCard = (_: any, value: any, callback: any) => {
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
            comments: item.comments,
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
          // Cleanup legacy fields
          medicalDesc: undefined,
          vehicleDamageDesc: undefined,
          liabilityDesc: undefined,
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
  bxbm: '', // Insurance code (single field for both main/attach)
  insuredMainName: '', // mainPlan -> insuredMainName
  goodPicture: '', // Policy system code -> uuid
  companyName: '', // customerName/companyName
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

  selectedPolicyType: 0, // 0: Main, 1: Attach

  stopName: '', // stationName -> stopName
  stopOwnerName: '', // stationMaster -> stopOwnerName
  stopOwnerPhone: '', // stationMasterPhone -> stopOwnerPhone
  oritext: '', // Rider ID (Custom editable string)

  // 新职伤
  xinzhishangPolicyNo: '',
  xinzhishangCompanyName: '',
  xinzhishangPlanName: '',
  xinzhishangTbr: '',
  xinzhishangTbrCardtype: 0,
  xinzhishangTbCard: '',
  xinzhishangBbr: '',
  xinzhishangBbrCardtype: 0,
  xinzhishangBbCard: '',

  // 手动填写开关
  isManualMain: true,
  isManualAttach: true,
  isManualXzs: true,
});

const validateInsuranceIdCard = (typeField: string) => {
  return (_: any, value: any, callback: any) => {
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
  tbCard: [
    { validator: validateInsuranceIdCard('tbrCardtype'), trigger: 'blur' },
  ],
  bbCard: [
    { validator: validateInsuranceIdCard('bbrCardtype'), trigger: 'blur' },
  ],
  tbCardAttach: [
    {
      validator: validateInsuranceIdCard('tbrCardtypeAttach'),
      trigger: 'blur',
    },
  ],
  bbCardAttach: [
    {
      validator: validateInsuranceIdCard('bbrCardtypeAttach'),
      trigger: 'blur',
    },
  ],
  xinzhishangTbCard: [
    {
      validator: validateInsuranceIdCard('xinzhishangTbrCardtype'),
      trigger: 'blur',
    },
  ],
  xinzhishangBbCard: [
    {
      validator: validateInsuranceIdCard('xinzhishangBbrCardtype'),
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
            comments: item.comments,
            id: item.id,
          }));

        const rawPayload = {
          id: Number(id.value),
          policyNo: insuranceForm.policyNo,
          companyMain: insuranceForm.companyMain,
          bxbm: insuranceForm.bxbm, // Use single bxbm field
          insuredMainName: insuranceForm.insuredMainName,
          insuredAttachName: insuranceForm.insuredAttachName,
          goodPicture: insuranceForm.goodPicture,
          customerName: insuranceForm.companyName,
          companyName: insuranceForm.companyName,
          channelName: insuranceForm.channelName,
          tbr: insuranceForm.tbr,
          tbrCardtype: Number(insuranceForm.tbrCardtype),
          tbCard: insuranceForm.tbCard,
          bbr: insuranceForm.bbr,
          bbrCardtype: Number(insuranceForm.bbrCardtype),
          bbCard: insuranceForm.bbCard,
          policyNoAttach: insuranceForm.policyNoAttach,
          companyAttach: insuranceForm.companyAttach,
          tbrAttach: insuranceForm.tbrAttach,
          tbrCardtypeAttach: Number(insuranceForm.tbrCardtypeAttach),
          tbCardAttach: insuranceForm.tbCardAttach,
          bbrAttach: insuranceForm.bbrAttach,
          bbrCardtypeAttach: Number(insuranceForm.bbrCardtypeAttach),
          bbCardAttach: insuranceForm.bbCardAttach,
          // 新职伤
          insured_xinzhishang: insuranceForm.xinzhishangPolicyNo,
          company_xinzhishang: insuranceForm.xinzhishangCompanyName,
          insured_xinzhishang_name: insuranceForm.xinzhishangPlanName,
          tbr_xinzhishang: insuranceForm.xinzhishangTbr,
          tbr_cardtype_xinzhishang: Number(
            insuranceForm.xinzhishangTbrCardtype,
          ),
          tb_card_xinzhishang: insuranceForm.xinzhishangTbCard,
          bbr_xinzhishang: insuranceForm.xinzhishangBbr,
          bbr_cardtype_xinzhishang: Number(
            insuranceForm.xinzhishangBbrCardtype,
          ),
          bb_card_xinzhishang: insuranceForm.xinzhishangBbCard,
          shougong_xinzhishang: insuranceForm.isManualXzs ? 1 : 0,

          stopName: insuranceForm.stopName,
          stopOwnerName: insuranceForm.stopOwnerName,
          stopOwnerPhone: insuranceForm.stopOwnerPhone,
          oritext: insuranceForm.oritext,
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
  addressPicture: '',
  accidentPicture: '',
  orderPicture: '',
  caseArea: [] as string[], // array for Cascader
  address: '', // Detailed address
  insureTime: '', // time -> insureTime
  zts: [{ username: '', phone: '', comments: '' }],
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

const validateThirdPartyPhone = (_: any, value: any, callback: any) => {
  if (!value) {
    callback(); // Empty value is valid
  } else if (/^1[3-9]\d{9}$/.test(value)) {
    callback();
  } else {
    callback(new Error('手机号格式错误'));
  }
};

function addThirdParty() {
  accidentForm.zts.push({ username: '', phone: '', comments: '' });
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
          ...accidentForm.zts
            .filter(
              (item) =>
                item.username?.trim() ||
                item.phone?.trim() ||
                item.comments?.trim(),
            )
            .map((item) => ({
              username: item.username,
              phone: item.phone,
              comments: item.comments,
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
          addressPicture: accidentForm.addressPicture,
          accidentPicture: accidentForm.accidentPicture,
          orderPicture: accidentForm.orderPicture,
          // Cleanup legacy fields
          medicalDesc: undefined,
          vehicleDamageDesc: undefined,
          liabilityDesc: undefined,
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
            comments: item.comments,
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
      comments: item.comments,
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
        if (cd.policyNo) {
          // 匹配到主险 -> 填充主险信息，清空附加险所有输入框
          insuranceForm.selectedPolicyType = 0;
          insuranceForm.policyNo = cd.policyNo || '';
          insuranceForm.companyMain = cd.companyMain || cd.companyName || '';
          insuranceForm.bxbm = cd.bxbm || ''; // Use single bxbm field
          insuranceForm.insuredMainName = cd.insuredMainName || '';
          insuranceForm.goodPicture = cd.goodPicture || '';
          insuranceForm.companyName = cd.companyName || cd.customerName || '';
          insuranceForm.channelName = cd.channelName || '';
          insuranceForm.tbr = cd.tbr || '';
          insuranceForm.tbrCardtype =
            typeof cd.tbrCardtype === 'number' ? cd.tbrCardtype : 0;
          insuranceForm.tbCard = cd.tbCard || '';
          insuranceForm.bbr = cd.bbr || '';
          insuranceForm.bbrCardtype =
            typeof cd.bbrCardtype === 'number' ? cd.bbrCardtype : 0;
          insuranceForm.bbCard = cd.bbCard || '';

          // 强制清空附加险相关字段
          insuranceForm.policyNoAttach = '';
          insuranceForm.companyAttach = '';
          insuranceForm.insuredAttachName = '';
          insuranceForm.tbrAttach = '';
          insuranceForm.tbrCardtypeAttach = 0;
          insuranceForm.tbCardAttach = '';
          insuranceForm.bbrAttach = '';
          insuranceForm.bbrCardtypeAttach = 0;
          insuranceForm.bbCardAttach = '';
        } else if (cd.policyNoAttach) {
          // 匹配到附加险 -> 填充附加险信息，清空主险所有输入框
          insuranceForm.selectedPolicyType = 1;
          insuranceForm.policyNo = '';
          insuranceForm.companyMain = '';
          insuranceForm.bxbm = cd.bxbm || ''; // Use single bxbm field
          insuranceForm.insuredMainName = '';
          insuranceForm.companyName = cd.companyName || cd.customerName || ''; // 共享字段？按需保留
          insuranceForm.channelName = cd.channelName || '';
          insuranceForm.tbr = '';
          insuranceForm.tbrCardtype = 0;
          insuranceForm.tbCard = '';
          insuranceForm.bbr = '';
          insuranceForm.bbrCardtype = 0;
          insuranceForm.bbCard = '';

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
        } else {
          // 未匹配到任何保险 -> 全部清空
          insuranceForm.selectedPolicyType = 0; // Default to main if unknown
          insuranceForm.policyNo = '';
          insuranceForm.companyMain = '';
          insuranceForm.bxbm = ''; // Use single bxbm field
          insuranceForm.insuredMainName = '';
          insuranceForm.goodPicture = cd.goodPicture || '';
          insuranceForm.companyName = cd.companyName || cd.customerName || '';
          insuranceForm.channelName = cd.channelName || '';
          insuranceForm.policyNoAttach = '';
          insuranceForm.companyAttach = '';
          insuranceForm.insuredAttachName = '';
          insuranceForm.tbr = '';
          insuranceForm.tbCard = '';
          insuranceForm.bbr = '';
          insuranceForm.bbCard = '';
          insuranceForm.tbrAttach = '';
          insuranceForm.tbCardAttach = '';
          insuranceForm.bbrAttach = '';
          insuranceForm.bbCardAttach = '';
        }

        // 新职伤
        insuranceForm.xinzhishangPolicyNo = cd.insured_xinzhishang || '';
        insuranceForm.xinzhishangCompanyName = cd.company_xinzhishang || '';
        insuranceForm.xinzhishangPlanName = cd.insured_xinzhishang_name || '';
        insuranceForm.xinzhishangTbr = cd.tbr_xinzhishang || '';
        insuranceForm.xinzhishangTbrCardtype =
          typeof cd.tbr_cardtype_xinzhishang === 'number'
            ? cd.tbr_cardtype_xinzhishang
            : 0;
        insuranceForm.xinzhishangTbCard = cd.tb_card_xinzhishang || '';
        insuranceForm.xinzhishangBbr = cd.bbr_xinzhishang || '';
        insuranceForm.xinzhishangBbrCardtype =
          typeof cd.bbr_cardtype_xinzhishang === 'number'
            ? cd.bbr_cardtype_xinzhishang
            : 0;
        insuranceForm.xinzhishangBbCard = cd.bb_card_xinzhishang || '';

        // 判断是否有手动填写状态
        insuranceForm.isManualMain = cd.shougong !== 0;
        insuranceForm.isManualAttach = cd.shougong !== 0;
        insuranceForm.isManualXzs = cd.shougong_xinzhishang !== 0;

        insuranceForm.stopName = cd.stopName || '';
        insuranceForm.stopOwnerName = cd.stopOwnerName || '';
        insuranceForm.stopOwnerPhone = cd.stopOwnerPhone || '';
        insuranceForm.oritext = cd.oritext || '';

        // Section 3: Accident
        accidentForm.details = cd.details || '';
        accidentForm.addressPicture = cd.addressPicture || '';
        accidentForm.accidentPicture = cd.accidentPicture || '';
        accidentForm.orderPicture = cd.orderPicture || '';

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
                  comments: item.comments || '',
                }))
            : [{ username: '', phone: '', comments: '' }];
        // Ensure not empty if filtered resulted in empty
        if (accidentForm.zts.length === 0) {
          accidentForm.zts.push({ username: '', phone: '', comments: '' });
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
              class="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="flex items-center">
                <div class="mr-2 h-4 w-1 bg-blue-500"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                  主险信息
                </h3>
              </div>
              <div
                class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span class="mr-2">手动填写</span>
                <el-switch v-model="insuranceForm.isManualMain" />
              </div>
            </div>
            <fieldset
              :disabled="!insuranceForm.isManualMain"
              class="m-0 min-w-0 border-0 p-0"
            >
              <ElRow :gutter="24">
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="保单系统编号">
                    <ElInput v-model="insuranceForm.goodPicture" disabled />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="主险保单号">
                    <ElInput v-model="insuranceForm.policyNo" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="保障编码">
                    <ElInput
                      :model-value="
                        insuranceForm.selectedPolicyType === 0
                          ? insuranceForm.bxbm
                          : ''
                      "
                      @update:model-value="
                        (val) => (insuranceForm.bxbm = val as string)
                      "
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="保险公司名称"
                    prop="companyMain"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.companyMain" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="主险方案"
                    prop="insuredMainName"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.insuredMainName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="所属客户名">
                    <ElInput v-model="insuranceForm.companyName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="所属渠道名">
                    <ElInput v-model="insuranceForm.channelName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人名称"
                    prop="tbr"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.tbr" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人证件类型"
                    prop="tbrCardtype"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElSelect
                      v-model="insuranceForm.tbrCardtype"
                      class="!w-full"
                    >
                      <ElOption label="身份证" :value="0" />
                      <ElOption label="企业信用代码" :value="1" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人证件号"
                    prop="tbCard"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.tbCard" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="被保人名称"
                    prop="bbr"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.bbr" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="被保人证件类型"
                    prop="bbrCardtype"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElSelect
                      v-model="insuranceForm.bbrCardtype"
                      class="!w-full"
                    >
                      <ElOption label="身份证" :value="0" />
                      <ElOption label="护照" :value="1" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="被保人证件号"
                    prop="bbCard"
                    :required="insuranceForm.selectedPolicyType === 0"
                  >
                    <ElInput v-model="insuranceForm.bbCard" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </fieldset>
          </div>

          <!-- Additional Insurance -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="flex items-center">
                <div class="mr-2 h-4 w-1 bg-green-500"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                  附加险信息
                </h3>
              </div>
              <div
                class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span class="mr-2">手动填写</span>
                <el-switch v-model="insuranceForm.isManualAttach" />
              </div>
            </div>
            <fieldset
              :disabled="!insuranceForm.isManualAttach"
              class="m-0 min-w-0 border-0 p-0"
            >
              <ElRow :gutter="24">
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="保单系统编号">
                    <ElInput v-model="insuranceForm.goodPicture" disabled />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="附加险保单号">
                    <ElInput v-model="insuranceForm.policyNoAttach" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="保障编码">
                    <ElInput
                      :model-value="
                        insuranceForm.selectedPolicyType === 1
                          ? insuranceForm.bxbm
                          : ''
                      "
                      @update:model-value="
                        (val) => (insuranceForm.bxbm = val as string)
                      "
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="保险公司名称"
                    prop="companyAttach"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
                    <ElInput v-model="insuranceForm.companyAttach" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="附加险方案"
                    prop="insuredAttachName"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
                    <ElInput v-model="insuranceForm.insuredAttachName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="所属客户名">
                    <ElInput v-model="insuranceForm.companyName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="所属渠道名">
                    <ElInput v-model="insuranceForm.channelName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人名称"
                    prop="tbrAttach"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
                    <ElInput v-model="insuranceForm.tbrAttach" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人证件类型"
                    prop="tbrCardtypeAttach"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
                    <ElSelect
                      v-model="insuranceForm.tbrCardtypeAttach"
                      class="!w-full"
                    >
                      <ElOption label="身份证" :value="0" />
                      <ElOption label="企业信用代码" :value="1" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="投保人证件号"
                    prop="tbCardAttach"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
                    <ElInput v-model="insuranceForm.tbCardAttach" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem
                    label="被保人名称"
                    prop="bbrAttach"
                    :required="insuranceForm.selectedPolicyType === 1"
                  >
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
                  <ElFormItem label="被保人证件号" prop="bbCardAttach">
                    <ElInput v-model="insuranceForm.bbCardAttach" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </fieldset>
          </div>

          <!-- 新职伤 Insurance -->
          <div class="mb-4">
            <div
              class="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
            >
              <div class="flex items-center">
                <div class="mr-2 h-4 w-1 bg-purple-500"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                  新职伤信息
                </h3>
              </div>
              <div
                class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span class="mr-2">手动填写</span>
                <el-switch v-model="insuranceForm.isManualXzs" />
              </div>
            </div>
            <fieldset
              :disabled="!insuranceForm.isManualXzs"
              class="m-0 min-w-0 border-0 p-0"
            >
              <ElRow :gutter="24">
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="新职伤保单号">
                    <ElInput v-model="insuranceForm.xinzhishangPolicyNo" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="保险公司名称">
                    <ElInput v-model="insuranceForm.xinzhishangCompanyName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="新职伤方案">
                    <ElInput v-model="insuranceForm.xinzhishangPlanName" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="投保人名称">
                    <ElInput v-model="insuranceForm.xinzhishangTbr" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="投保人证件类型">
                    <ElSelect
                      v-model="insuranceForm.xinzhishangTbrCardtype"
                      class="!w-full"
                    >
                      <ElOption label="身份证" :value="0" />
                      <ElOption label="企业信用代码" :value="1" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="投保人证件号" prop="xinzhishangTbCard">
                    <ElInput v-model="insuranceForm.xinzhishangTbCard" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="被保人名称">
                    <ElInput v-model="insuranceForm.xinzhishangBbr" />
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="被保人证件类型">
                    <ElSelect
                      v-model="insuranceForm.xinzhishangBbrCardtype"
                      class="!w-full"
                    >
                      <ElOption label="身份证" :value="0" />
                      <ElOption label="企业信用代码" :value="1" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :xs="24" :sm="12" :md="8">
                  <ElFormItem label="被保人证件号" prop="xinzhishangBbCard">
                    <ElInput v-model="insuranceForm.xinzhishangBbCard" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </fieldset>
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
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="骑手 ID">
                  <ElInput v-model="insuranceForm.oritext" placeholder="" />
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
              <ElCol :span="24">
                <ElFormItem label="医疗情况描述" prop="addressPicture">
                  <ElInput
                    type="textarea"
                    :rows="3"
                    v-model="accidentForm.addressPicture"
                    placeholder="请输入就诊医院、医疗住院基本情况、预估费用等..."
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="24">
                <ElFormItem label="车损情况描述" prop="accidentPicture">
                  <ElInput
                    type="textarea"
                    :rows="3"
                    v-model="accidentForm.accidentPicture"
                    placeholder="请输入车损细节、车损预估等..."
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="24">
                <ElFormItem label="责任认定情况" prop="orderPicture">
                  <ElInput
                    type="textarea"
                    :rows="3"
                    v-model="accidentForm.orderPicture"
                    placeholder="请输入报警或责任认定结果情况..."
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
              <div class="mt-3">
                <ElFormItem
                  label="备注"
                  label-width="50px"
                  class="!mb-0 w-full"
                >
                  <ElInput v-model="tp.comments" placeholder="备注信息..." />
                </ElFormItem>
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
          <ElButton
            v-if="!isReadonly"
            type="primary"
            plain
            @click="handleUpdateFiles"
          >
            更新
          </ElButton>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
