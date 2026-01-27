<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CaseApi } from '#/api/core/case';
import type { TbCaseWithBLOBs } from '#/api/core/case-record';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { createIconifyIcon } from '@vben/icons';

import { useWindowSize } from '@vueuse/core';
import { codeToText, regionData } from 'element-china-area-data';
import {
  ElButton,
  ElCard,
  ElCascader,
  ElCheckbox,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRow,
  ElSelect,
  ElStep,
  ElSteps,
} from 'element-plus';
import moment from 'moment';

import { authUserListApi } from '#/api/core/authuser';
import { CaseCardGetApi } from '#/api/core/case';
import {
  CaseRecordAddApi,
  CaseRecordGetApi,
  CaseRecordUnlockApi,
  CaseRecordUpdateApi,
} from '#/api/core/case-record';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { PlanListApi } from '#/api/core/plan';
import { PolicyDetailApi, PolicyListByCardApi } from '#/api/core/policy';
import { StopListApi } from '#/api/core/stop';

import DraggableUploadList from '../components/DraggableUploadList.vue';

const CircleClose = createIconifyIcon('ant-design:close-circle-outlined');
const AntdArrowLeftOutlined = createIconifyIcon(
  'ant-design:arrow-left-outlined',
);
const AntdEyeOutlined = createIconifyIcon('ant-design:eye-outlined');

const areaOptions = ref(regionData);

const uploadListRef = ref<any>(null);

const caseFormRef = ref<FormInstance>();
const originalCaseData = ref<Partial<TbCaseWithBLOBs>>({});
const caseForm = reactive<
  Partial<TbCaseWithBLOBs> & {
    customername?: string;
    isManual?: boolean;
    orderNo?: string;
    uuid?: string;
  }
>({
  address: '',
  bxbm: '',
  casenoInsuredAttach: '',
  casenoInsuredMain: '',
  city: '',
  cityCode: '',
  companyId: '',
  companyMain: '', // Main Insurance Company
  companyAttach: '', // Additional Insurance Company
  bbCard: '', // Insured ID
  bbCardAttach: '',
  details: '',
  district: '',
  districtCode: '',
  fujiaxian: '',
  insureTime: '',
  insureType: 0,
  insuredAttach: '',
  insuredAttachName: '',
  insuredMain: '',
  insuredMainName: '',
  name: '', // Rider Name (Same as Main Insured BBR?)
  bbr: '', // Main Insured Name
  bbrAttach: '',
  bbrCardtype: 0, // Main Insured ID Type (0: ID Card)
  bbrCardtypeAttach: 0,
  oritext: '',
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
  zeren: 0,
  nameRep: '',
  phoneRep: '',
  creditcardRep: '',
  tbr: '', // Applicant Name
  tbrAttach: '',
  tbrCardtype: undefined, // Applicant ID Type (No Default)
  tbrCardtypeAttach: undefined,
  tbCard: '', // Applicant ID No
  tbCardAttach: '',
  isManual: false,
  zts: [{ username: '', phone: '' }],
  files: [],
  caseArea: [],
  riderZtId: undefined as number | undefined,
});

const isPolicyMatched = ref(false);
const isSuccess = ref(false);
const createdCaseId = ref<string>('');

const addThirdParty = () => {
  if (!caseForm.zts) caseForm.zts = [];
  caseForm.zts.push({ username: '', phone: '' });
};

const removeThirdParty = (index: number) => {
  if (caseForm.zts) caseForm.zts.splice(index, 1);
};

const isReporterSameAsRider = ref(false);

// 监听是否同骑手本人
watch(isReporterSameAsRider, (val) => {
  if (val) {
    caseForm.nameRep = caseForm.name;
    caseForm.phoneRep = caseForm.phone;
    caseForm.creditcardRep = caseForm.creditcard;
  } else {
    // 只有当字段值与骑手信息完全一致时才清空，避免误删用户手动修改后的数据？
    // 或者按照原逻辑清空，用户体验可能更好，明确"不同"了
    caseForm.nameRep = '';
    caseForm.phoneRep = '';
    caseForm.creditcardRep = '';
  }
});

// 监听骑手信息变化用于同步（仅在勾选时）
watch(
  () => [caseForm.name, caseForm.phone, caseForm.creditcard],
  ([newName, newPhone, newCard]) => {
    if (isReporterSameAsRider.value) {
      if (newName) caseForm.nameRep = newName as string;
      if (newPhone) caseForm.phoneRep = newPhone as string;
      if (newCard) caseForm.creditcardRep = newCard as string;
    }
  },
);

// 监听报案人手机号变化同步回骑手手机号（仅在勾选时，实现双向同步的单向部分）
// 注意：双向同步可能会导致循环，但因为值一样 update 不会触发 watch，或者 Vue 内部处理了
// 我们可以加一个 flag 或者是直接同步
watch(
  () => caseForm.phoneRep,
  (newVal) => {
    if (isReporterSameAsRider.value && newVal !== caseForm.phone) {
      caseForm.phone = newVal;
    }
  },
);
// 同时也需要监听 caseForm.phone 的变化同步给 phoneRep (上面数组监听里涵盖了，但单独拿出来也可以)
// 上面的数组监听是 单向的 Rider -> Reporter
// 如果加上下面的 Reporter -> Rider，就是双向
// 为了避免竞争，可以简化逻辑：
// 1. isReporterSameAsRider 开启时，完全锁定两者一致。
// 2. 修改任意一个，另一个跟着变。

// 移除旧的变化处理逻辑，改用 watch 实现更细粒度的同步
// const handleSameAsRiderChange ...

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
      required: false, // 改为非必填
      trigger: 'blur',
      validator: (_rule: any, value: any, callback: any) => {
        if (!value) {
          callback(); // 为空不校验
          return;
        }
        if (!/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error('手机号格式错误'));
          return;
        }
        callback();
      },
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
      required: false,
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
      required: false,
      message: '请输入详细地址',
      trigger: 'blur',
    },
  ],
  details: [
    {
      required: false,
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
  nameRep: [
    {
      required: true,
      message: '请输入报案人姓名',
      trigger: 'blur',
    },
  ],
  phoneRep: [
    {
      required: true,
      message: '请输入报案人手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式错误',
      trigger: 'blur',
    },
  ],
  creditcardRep: [
    {
      required: true,
      message: '请输入报案人身份证',
      trigger: 'blur',
    },
    {
      pattern:
        /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|12]\d)|3[01])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|12]\d)|3[01])(\d{4}|\d{3}x)$/i,
      message: '身份证格式错误',
      trigger: 'blur',
    },
  ],
  policyNo: [
    {
      required: true,
      message: '请输入主险保单号',
      trigger: 'blur',
    },
  ],
  companyMain: [
    {
      required: true,
      message: '请输入保险公司名称',
      trigger: 'blur',
    },
  ],
  insuredMain: [
    {
      required: true,
      message: '请选择主险方案',
      trigger: 'change',
    },
  ],
  tbr: [
    {
      required: true,
      message: '请输入投保人姓名',
      trigger: 'blur',
    },
  ],
  tbrCardtype: [
    {
      required: true,
      message: '请选择投保人证件类型',
      trigger: 'change',
    },
  ],
  tbCard: [
    {
      required: true,
      message: '请输入投保人证件号',
      trigger: 'blur',
    },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!value) {
          callback();
          return;
        }
        // 0: 身份证, 1: 统一信用代码
        if (caseForm.tbrCardtype === 0) {
          // 身份证正则 (Strict)
          const pattern =
            /^[1-9]\d{5}(?:18|19|20)?\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}(?:\d|X)$/i;
          if (!pattern.test(value)) {
            callback(new Error('身份证格式错误'));
            return;
          }
        } else if (caseForm.tbrCardtype === 1) {
          // 统一信用代码正则 (Standard: 18 chars, digits and letters)
          const pattern = /^[0-9A-Z]{18}$/;
          if (!pattern.test(value)) {
            callback(new Error('统一信用代码格式错误'));
            return;
          }
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  bbrCardtype: [
    {
      required: true,
      message: '请选择被保人证件类型',
      trigger: 'change',
    },
  ],
  bbrAttach: [
    {
      required: false,
      message: '请输入被保人名称',
      trigger: 'blur',
    },
  ],
  bbrCardtypeAttach: [
    {
      required: false,
      message: '请选择被保人证件类型',
      trigger: 'change',
    },
  ],
  bbCardAttach: [
    {
      required: false,
      message: '请输入被保人证件号',
      trigger: 'blur',
    },
  ],
});

// Default ID Types (0: ID Card)
caseForm.bbrCardtype = 0;
caseForm.bbrCardtypeAttach = 0;

const router = useRouter();
const route = useRoute();

const { closeCurrentTab, setTabTitle } = useTabs();
const id = ref<string>('');
const newlyCreatedCaseId = ref<string>('');
const currentStep = ref(0);

const back = () => {
  closeCurrentTab();
  router.back();
};

const loading = ref<boolean>(false);
const extractLoading = ref(false);
const policyList = ref<any[]>([]);
const showPolicySelection = ref(false);

const handleExtractPolicy = async () => {
  if (!caseForm.creditcard) {
    ElMessage.warning('请先输入身份证号');
    return;
  }
  extractLoading.value = true;
  policyList.value = [];
  showPolicySelection.value = false;
  isPolicyMatched.value = false;

  try {
    const tm = caseForm.insureTime
      ? String(moment(caseForm.insureTime).valueOf())
      : '';
    const res = await PolicyListByCardApi({
      card: caseForm.creditcard!,
      tm,
      page: 1,
      size: 50, // Increase size to show all potential matches
    });
    if (res.list && res.list.length > 0) {
      // Auto-fill rider name from the first policy result
      caseForm.name = res.list[0]?.username || '';

      policyList.value = res.list;
      // Always show selection list if policies found, to let user confirm.
      // Or if only 1, auto-select? User requested selection, so list view is safer.
      // But for UX, if 1, maybe auto-Expand but allow back?
      // Let's show list if > 0.
      showPolicySelection.value = true;
      ElMessage.success(`查询到 ${res.list.length} 条保单，请选择`);
    } else {
      isPolicyMatched.value = false;
      ElMessage.warning('未查询到相关保单');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('查询失败');
    isPolicyMatched.value = false;
  } finally {
    extractLoading.value = false;
  }
};

const handleSelectPolicy = async (policy: any) => {
  extractLoading.value = true;
  try {
    const detail = await PolicyDetailApi({
      id: String(policy.orderid),
      card: caseForm.creditcard!,
    });
    if (detail) {
      // Populate common fields
      caseForm.stopName = detail.stops?.[0]?.name ?? (detail.zt || '');
      caseForm.name = detail.username || policy.username || '';
      caseForm.phone = detail.phone || '';
      caseForm.policyNo = detail.policyNo;
      caseForm.orderNo = detail.orderNo;
      caseForm.beginTime = detail.beginTime; // Preserve raw timestamp
      caseForm.endTimeRaw = detail.endTime;
      caseForm.uuid = detail.uuid;
      caseForm.customername = detail.customername;

      // New mappings
      caseForm.tbr = detail.tbr;
      caseForm.tbrCardtype = detail.tbrCardtype ?? 0;
      caseForm.tbCard = detail.tbCard;

      caseForm.bbr = detail.bbr;
      caseForm.bbrCardtype = detail.bbrCardtype ?? 0;
      caseForm.bbCard = detail.bbCard;

      caseForm.companyMain = detail.companyMain;
      caseForm.companyAttach = detail.companyAttach;

      caseForm.startTime = detail.beginTime
        ? moment(Number(detail.beginTime)).format('YYYY-MM-DD HH:mm:ss')
        : '';
      caseForm.endTime = detail.endTime
        ? moment(Number(detail.endTime)).format('YYYY-MM-DD HH:mm:ss')
        : '';
      // companyName might be customer name, let's keep it if needed for Step 1 display?
      // But in Step 2 manual, we use companyMain.
      // If matched, we might not show Step 2 manual fields.
      // caseForm.companyName = detail.customername;

      caseForm.channelName = detail.channel?.username;

      // ... existing logic ...

      if (detail.type === 0) {
        caseForm.insuredMainName =
          detail.insuredMainName || detail.dplan?.ordertype || '主险';
        caseForm.insuredAttachName = '';
      } else if (detail.type === 1) {
        caseForm.insuredAttachName =
          detail.insuredAttachName || detail.fplan?.ordertype || '附加险';
        caseForm.insuredMainName = '';
      } else {
        caseForm.insuredMainName =
          detail.insuredMainName || detail.dplan?.ordertype;
        caseForm.insuredAttachName =
          detail.insuredAttachName || detail.fplan?.ordertype;
      }

      isPolicyMatched.value = true;
      showPolicySelection.value = false;
      ElMessage.success('保单选择成功');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('获取保单详情失败');
  } finally {
    extractLoading.value = false;
  }
};

const handleAutoExtract = () => {
  if (caseForm.creditcard && caseForm.insureTime) {
    handleExtractPolicy();
  }
};

const handleCreateCase = async (formEl: FormInstance | undefined) => {
  if (!formEl) return false;

  try {
    const valid = await formEl.validate();
    if (valid) {
      loading.value = true;
      // Upload list is not available in step 2 (creation step), so we pass empty files.
      // Files will be added in step 3 (update step).
      const files: any[] = [];

      // Sync Insured info with Rider info for Manual Entry if disabled/empty
      if (!caseForm.bbr) caseForm.bbr = caseForm.name;
      if (!caseForm.bbCard) caseForm.bbCard = caseForm.creditcard;
      // Default bbrCardtype to 0 if not set (though initialized to 0)
      if (caseForm.bbrCardtype === undefined) caseForm.bbrCardtype = 0;

      const payload = {
        ...caseForm,

        // Ensure manual fields are present
        companyMain: caseForm.companyMain,
        tbr: caseForm.tbr,
        tbrCardtype: caseForm.tbrCardtype,
        tbCard: caseForm.tbCard,
        bbr: caseForm.bbr,
        bbrCardtype: caseForm.bbrCardtype,
        bbCard: caseForm.bbCard,

        // ... existing overrides if needed ...
        bxbm: caseForm.bxbm ? String(caseForm.bxbm) : undefined,
        companyId: caseForm.companyId ? String(caseForm.companyId) : undefined,
        insuredMain: caseForm.insuredMain
          ? String(caseForm.insuredMain)
          : undefined,
        insuredAttach: caseForm.insuredAttach
          ? String(caseForm.insuredAttach)
          : undefined,
        owner: caseForm.owner ? String(caseForm.owner) : undefined,
        stopId: caseForm.stopId ? String(caseForm.stopId) : undefined,
        fujiaxian: caseForm.fujiaxian ? String(caseForm.fujiaxian) : undefined,
        insureType: caseForm.insureType
          ? Number(caseForm.insureType)
          : undefined,
        lipeiPerson: undefined,
        zeren: caseForm.zeren ? Number(caseForm.zeren) : undefined,
        accidentTime: caseForm.insureTime
          ? String(moment(caseForm.insureTime).valueOf())
          : undefined,
        insureTime: caseForm.insureTime
          ? String(moment(caseForm.insureTime).valueOf())
          : undefined,
        beginTime: caseForm.beginTime
          ? String(caseForm.beginTime)
          : caseForm.startTime
            ? String(moment(caseForm.startTime).valueOf())
            : undefined,
        startTime: caseForm.beginTime
          ? String(caseForm.beginTime)
          : caseForm.startTime
            ? String(moment(caseForm.startTime).valueOf())
            : undefined,
        endTime: caseForm.endTimeRaw
          ? String(caseForm.endTimeRaw)
          : caseForm.endTime
            ? String(moment(caseForm.endTime).valueOf())
            : undefined,
        zts: [
          {
            zt: '骑手',
            username: caseForm.name,
            phone: caseForm.phone,
            comments: '',
          },
          ...(caseForm.zts
            ?.filter((item) => item.username || item.phone)
            .map((item) => ({
              zt: '三者',
              username: item.username,
              phone: item.phone,
              comments: '',
            })) || []),
        ],
        shougong: isPolicyMatched.value ? 0 : 1,
        files,
        id: undefined,
        created: caseForm.created ? String(caseForm.created) : undefined,
      };

      const result = await CaseRecordAddApi(payload);
      loading.value = false;

      ElMessage.success('案件创建成功');

      // 调用接口锁定案件（后续此接口调用会被取消）
      // if (result) {
      //   try {
      //     await CaseRecordLockApi(String(result));
      //   } catch (error) {
      //     console.error('Auto-lock failed', error);
      //   }
      // }

      newlyCreatedCaseId.value = result as unknown as string;
      createdCaseId.value = result as unknown as string;
      // Fetch detail to get auto-generated IDs (e.g. Rider zt ID)
      await getCaseDetail(createdCaseId.value);
      return true;
    }
  } catch (error) {
    console.error(error);
    loading.value = false;
    ElMessage.error('创建失败');
  }
  return false;
};

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

  // Sort by username + phone for comparison
  const sorter = (a: any, b: any) =>
    (a.username + a.phone).localeCompare(b.username + b.phone);
  const sortedA = realA.toSorted(sorter);
  const sortedB = realB.toSorted(sorter);

  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
};

const handleUpdateCase = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  try {
    const valid = await formEl.validate();
    if (valid) {
      loading.value = true;
      const files: any[] = uploadListRef.value
        ? uploadListRef.value.getTbCaseFiles()
        : [];

      // Sync Insured info with Rider info
      if (!caseForm.bbr) caseForm.bbr = caseForm.name;
      if (!caseForm.bbCard) caseForm.bbCard = caseForm.creditcard;

      // Construct zts separately to check if it's effectively empty (only Rider)
      const constructedZts = [
        {
          zt: '骑手',
          username: caseForm.name,
          phone: caseForm.phone,
          comments: '',
          id: caseForm.riderZtId,
        },
        ...(caseForm.zts
          ?.filter((item) => item.username || item.phone)
          .map((item) => ({
            zt: '三者', // or specific logic if needed
            username: item.username,
            phone: item.phone,
            comments: '',
            id: item.id,
          })) || []),
      ];

      const payload = {
        ...caseForm,

        // Ensure manual fields are present
        companyMain: caseForm.companyMain,
        tbr: caseForm.tbr,
        tbrCardtype: caseForm.tbrCardtype,
        tbCard: caseForm.tbCard,
        bbr: caseForm.bbr,
        bbrCardtype: caseForm.bbrCardtype,
        bbCard: caseForm.bbCard,

        bxbm: caseForm.bxbm ? String(caseForm.bxbm) : undefined,
        companyId: caseForm.companyId ? String(caseForm.companyId) : undefined,
        insuredMain: caseForm.insuredMain
          ? String(caseForm.insuredMain)
          : undefined,
        insuredAttach: caseForm.insuredAttach
          ? String(caseForm.insuredAttach)
          : undefined,
        owner: caseForm.owner ? String(caseForm.owner) : undefined,
        stopId: caseForm.stopId ? String(caseForm.stopId) : undefined,
        fujiaxian: caseForm.fujiaxian ? String(caseForm.fujiaxian) : undefined,
        insureType: caseForm.insureType
          ? Number(caseForm.insureType)
          : undefined,
        lipeiPerson: undefined,
        zeren: caseForm.zeren ? Number(caseForm.zeren) : undefined,
        accidentTime: caseForm.insureTime
          ? String(moment(caseForm.insureTime).valueOf())
          : undefined,
        insureTime: caseForm.insureTime
          ? String(moment(caseForm.insureTime).valueOf())
          : undefined,
        beginTime: caseForm.beginTime
          ? String(caseForm.beginTime)
          : caseForm.startTime
            ? String(moment(caseForm.startTime).valueOf())
            : undefined,
        startTime: caseForm.beginTime
          ? String(caseForm.beginTime)
          : caseForm.startTime
            ? String(moment(caseForm.startTime).valueOf())
            : undefined,
        endTime: caseForm.endTimeRaw
          ? String(caseForm.endTimeRaw)
          : caseForm.endTime
            ? String(moment(caseForm.endTime).valueOf())
            : undefined,

        shougong: isPolicyMatched.value ? 0 : 1,
        files,
        id: newlyCreatedCaseId.value
          ? Number(newlyCreatedCaseId.value)
          : id.value
            ? Number(id.value)
            : undefined,
        created: caseForm.created ? String(caseForm.created) : undefined,
      };

      // Only add zts if there are actual third parties (length > 1)
      if (constructedZts.length > 1) {
        (payload as any).zts = constructedZts;
      } else {
        delete (payload as any).zts;
      }

      // Filter payload: remove fields that are empty (undefined/null/'') OR equal to original
      const finalPayload: any = {};

      // Always include ID
      if (payload.id !== undefined) {
        finalPayload.id = payload.id;
      }

      // Deep comparison for zts
      const originalZts = originalCaseData.value.zts || [];
      const normalizeZt = (list: any[]) =>
        list.map((item) => ({
          zt: item.zt,
          username: item.username,
          phone: item.phone,
          id: item.id,
        }));
      // Filter out empty rows from constructedZts just like we do for comparison
      // constructedZts already filters username/phone.
      // But we should verify if we need to filter originalZts.
      // originalCaseData from API shouldn't have empty rows potentially?

      const currentZtsNormalized = normalizeZt(constructedZts);
      const originalZtsNormalized = normalizeZt(originalZts);

      if (areZtsEqual(currentZtsNormalized, originalZtsNormalized)) {
        (finalPayload as any).zts = [];
      } else {
        (finalPayload as any).zts = constructedZts;
      }

      // Deep comparison for files
      const currentFiles = files || [];
      const originalFiles = originalCaseData.value.files || [];
      const normalizeFile = (list: any[]) =>
        list.map((f) => ({
          cateId: f.cateId,
          url: f.url,
          title: f.title,
          id: f.id,
        }));

      finalPayload.files = isDeepEqual(
        normalizeFile(currentFiles),
        normalizeFile(originalFiles),
      )
        ? []
        : files;

      // Check other fields
      for (const key in payload) {
        if (key === 'id' || key === 'zts' || key === 'files') continue;

        const val = (payload as any)[key];
        const originalVal = (originalCaseData.value as any)[key];

        // 1. Check if empty
        if (val === undefined || val === null || val === '') {
          continue;
        }

        // 2. Check if modified (loose equality to handle number vs string diffs if values are effectively same)
        // Note: moment timestamps string vs original number timestamp.
        // original might be number 167...
        // payload is string "167..."
        // loose equality 167... == "167..." is true.
        if (String(val) === String(originalVal)) {
          continue;
        }

        // Special case: `shougong` logic handles its own state, always send if changed?
        // If shougong calc result is same as original, we don't need to send it?
        // Assuming strict requirements:
        finalPayload[key] = val;
      }

      await CaseRecordUpdateApi(finalPayload);
      loading.value = false;

      // Unlock if it is a newly created case
      if (!id.value && newlyCreatedCaseId.value) {
        try {
          await CaseRecordUnlockApi(String(newlyCreatedCaseId.value));
        } catch (error) {
          console.error(error);
        }
      }

      ElMessage.success('提交成功');
      if (id.value) {
        back();
      } else {
        isSuccess.value = true;
      }
    }
  } catch (error) {
    loading.value = false;
    console.error(error);
    ElMessage.error('提交失败');
  }
};

// Rename submitForm to specific handlers or remove if unused,
// but sticking to new function names is cleaner.

const customerList = ref<any>(null);
const getCustomerList = async () => {
  const { list } = await CustomerListApi(
    {},
    {
      page: 1,
      size: 2000,
      withTag: 0,
      withStop: 0,
      withInsure: 0,
    },
  );
  customerList.value = list;
};

const planList = ref<any>([]);
const getGroupList = async (id: number) => {
  const { list } = await PlanListApi(
    {
      customerId: id,
      validTag: 1,
      status: 1,
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

// 地区选择
const areaChange = (value: any) => {
  if (value && value.length > 0) {
    caseForm.provinceCode = value[0];
    caseForm.cityCode = value[1];
    caseForm.districtCode = value[2];
    caseForm.province = codeToText[value[0]];
    caseForm.city = codeToText[value[1]];
    caseForm.district = codeToText[value[2]];
  }
};

const setMainName = (val: any) => {
  const item = mainInsureList.value.find((item: any) => item.id === val);
  if (item) {
    caseForm.insuredMainName = item.ordertype;
  }
};

const setAddiName = (val: any) => {
  const item = addiInsureList.value.find((item: any) => item.id === val);
  if (item) {
    caseForm.insuredAttachName = item.ordertype;
  }
};

const setStopInfo = (id: any) => {
  const stop = stopList.value.find((item: any) => item.id === id);
  if (stop) {
    caseForm.stopName = stop.name;
    caseForm.stopOwnerName = stop.username;
    caseForm.stopOwnerPhone = stop.phone;
  }
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
  const { username, phone, customer, stops } = result;
  // statusPerson
  // if (statusPerson !== 2) {
  //   ElMessageBox.alert('该人员未处于在保状态，请检查', '提示', {
  //     confirmButtonText: '关闭',
  //     type: 'warning',
  //   });
  //   return;
  // }

  caseForm.name = username;
  caseForm.phone = phone;
  customerList.value = [customer];
  if (!customer) getCustomerList();
  caseForm.companyId = customer?.id ? String(customer.id) : undefined;
  caseForm.companyName = customer?.username;
  await getStopList(customer?.id);
  await getGroupList(customer?.id);
  caseForm.stopId = stops[0]?.id;
  caseForm.stopName = stops[0]?.name;
  if (caseForm.stopId) setStopInfo(caseForm.stopId as string);
};

const getCaseDetail = async (id: number | string) => {
  const {
    tbr,
    tbrCardtype,
    tbCard,
    tbrAttach,
    tbrCardtypeAttach,
    tbCardAttach,
    bbr,
    bbrCardtype,
    bbCard,
    bbrAttach,
    bbrCardtypeAttach,
    bbCardAttach,
    companyMain,
    companyAttach,
    // ...
    // Note: removing obsolete ones if they don't exist in return, but TS might not complain if I don't remove.
    // However, I should map them.
    address,
    bxbm,
    casenoInsuredAttach,
    casenoInsuredMain,
    city,
    cityCode,
    companyId,
    // companyName, // If backend returns it, fine.
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
    orderNo,
    policyNoAttach,
    province,
    provinceCode,
    stopId,
    stopName,
    stopOwner,
    stopOwnerName,
    stopOwnerPhone,
    zeren,
    nameRep,
    phoneRep,
    creditcardRep,
    zts,
    files,
    created,
  } = await CaseRecordGetApi(id);

  originalCaseData.value = {
    tbr,
    tbrCardtype,
    tbCard,
    tbrAttach,
    tbrCardtypeAttach,
    tbCardAttach,
    bbr,
    bbrCardtype,
    bbCard,
    bbrAttach,
    bbrCardtypeAttach,
    bbCardAttach,
    companyMain,
    companyAttach,
    address,
    bxbm,
    casenoInsuredAttach,
    casenoInsuredMain,
    city,
    cityCode,
    companyId,
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
    orderNo,
    policyNoAttach,
    province,
    provinceCode,
    stopId,
    stopName,
    stopOwner,
    stopOwnerName,
    stopOwnerPhone,
    zeren,
    nameRep,
    phoneRep,
    creditcardRep,
    zts,
    files,
    created,
    id: typeof id === 'string' ? Number(id) : id,
  };

  caseForm.address = address!;
  caseForm.bxbm = bxbm || '';
  caseForm.casenoInsuredAttach = casenoInsuredAttach!;
  caseForm.casenoInsuredMain = casenoInsuredMain!;
  caseForm.city = city!;
  caseForm.cityCode = cityCode!;
  caseForm.companyId = companyId!;
  // caseForm.companyName = companyName!; // Careful with companyName mapping
  caseForm.companyMain = companyMain || '';
  caseForm.companyAttach = companyAttach || '';

  caseForm.creditcard = creditcard || ''; // Restore Rider ID mapping

  caseForm.tbr = tbr || '';
  caseForm.tbrCardtype = tbrCardtype ?? 0;
  caseForm.tbCard = tbCard || '';
  caseForm.tbrAttach = tbrAttach || '';
  caseForm.tbrCardtypeAttach = tbrCardtypeAttach ?? 0;
  caseForm.tbCardAttach = tbCardAttach || '';

  caseForm.bbr = bbr || '';
  caseForm.bbrCardtype = bbrCardtype ?? 0;
  caseForm.bbCard = bbCard || '';
  caseForm.bbrAttach = bbrAttach || '';
  caseForm.bbrCardtypeAttach = bbrCardtypeAttach ?? 0;
  caseForm.bbCardAttach = bbCardAttach || '';

  // existing mappings
  // caseForm.creditcard = creditcard!; // If used for Rider ID
  await getMemberInfo(creditcard || bbCard!); // Pass either?
  caseForm.details = details!;
  caseForm.district = district!;
  caseForm.districtCode = districtCode!;
  caseForm.fujiaxian = fujiaxian!;
  caseForm.insureTime = insureTime!;
  caseForm.insureType = insureType!;
  caseForm.insuredAttach = insuredAttach || '';
  caseForm.insuredAttachName = insuredAttachName!;
  caseForm.insuredMain = insuredMain || '';
  caseForm.insuredMainName = insuredMainName!;
  caseForm.name = name!;
  caseForm.owner = owner || '';
  caseForm.phone = phone!;
  caseForm.phoneOwner = phoneOwner!;
  caseForm.policyNo = policyNo!;
  caseForm.policyNoAttach = policyNoAttach!;
  caseForm.province = province!;
  caseForm.provinceCode = provinceCode!;
  if (provinceCode && cityCode && districtCode) {
    caseForm.caseArea = [
      String(provinceCode),
      String(cityCode),
      String(districtCode),
    ];
  }
  caseForm.stopId = stopId || '';
  caseForm.stopName = stopName!;
  caseForm.stopOwner = stopOwner!;
  caseForm.stopOwnerName = stopOwnerName!;
  caseForm.stopOwnerPhone = stopOwnerPhone!;
  caseForm.zeren = zeren!;

  caseForm.nameRep = nameRep!;
  caseForm.phoneRep = phoneRep!;
  caseForm.creditcardRep = creditcardRep!;

  const rider = zts?.find((item: any) => item.zt === '骑手');
  caseForm.riderZtId = rider?.id;

  caseForm.zts =
    zts && zts.length > 0
      ? zts
          .filter((item: any) => item.zt !== '骑手')
          .map((item: any) => ({
            username: item.username || '',
            phone: item.phone || '',
            id: item.id,
            zt: item.zt,
            comments: item.comments,
          }))
      : [{ username: '', phone: '' }];
  // If result is empty after filter, insert empty one
  if (caseForm.zts.length === 0) {
    caseForm.zts.push({ username: '', phone: '' });
  }

  caseForm.files = files || [];
  caseForm.orderNo = orderNo || ''; // Mapped orderNo
  caseForm.created = created!;

  caseForm.id = Number(id);
};

const disabledBegin = (time: { getTime: () => number }) => {
  return time.getTime() > Date.now();
};

// 步骤切换逻辑
const nextStep = async () => {
  // 验证当前步骤的表单
  const valid = await validateCurrentStep();
  if (valid) {
    if (currentStep.value === 0) {
      await checkPolicy();

      // Sync Step 1 data to Step 2 defaults
      if (!caseForm.bbCard && caseForm.creditcard) {
        caseForm.bbCard = caseForm.creditcard;
      }
      if (!caseForm.bbr && caseForm.name) {
        caseForm.bbr = caseForm.name;
      }
      // Sync to Additional Insured defaults if empty
      if (!caseForm.bbrAttach && caseForm.bbr) {
        caseForm.bbrAttach = caseForm.bbr;
      }
      if (!caseForm.bbCardAttach && caseForm.bbCard) {
        caseForm.bbCardAttach = caseForm.bbCard;
      }

      // Ensure Default ID Types are 0 (ID Card)
      if (caseForm.bbrCardtype === undefined) caseForm.bbrCardtype = 0;
      if (caseForm.bbrCardtypeAttach === undefined)
        caseForm.bbrCardtypeAttach = 0;
    } else if (currentStep.value === 2) {
      // Step 2 (Reporter Info) -> Step 3 (Supplement)
      // triggering Case Creation
      const success = await handleCreateCase(caseFormRef.value);
      if (!success) return;
    }
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 验证当前步骤的表单
const validateCurrentStep = async (): Promise<boolean> => {
  if (!caseFormRef.value) return true;

  try {
    // Step 1: Basic Info Validation
    if (currentStep.value === 0) {
      await caseFormRef.value!.validateField([
        'name',
        'creditcard',
        'insureTime',
      ]);
      return true;
    }
    // Step 2: Policy Info Validation
    if (currentStep.value === 1) {
      if (isPolicyMatched.value) {
        // If matched, no manual input validation needed (or maybe just confirm selection?)
        return true;
      } else {
        // Manual input validation
        await caseFormRef.value!.validateField([
          'policyNo',
          'companyMain',
          'insuredMain',
          'tbr',
          'tbrCardtype',
          'tbCard',
          // 'name', // Validated in Step 1
          'bbrCardtype',
          'bbCard',
          'bbrAttach',
          'bbrCardtypeAttach',
          'bbCardAttach',
        ]);
        return true;
      }
    }
    // Step 3: Reporter Info Validation
    if (currentStep.value === 2) {
      await caseFormRef.value!.validateField([
        'nameRep',
        'phoneRep',
        'creditcardRep',
        'phone',
      ]);
      return true;
    }
    // Step 4: Supplement Info Validation
    if (currentStep.value === 3) {
      // Optional fields, maybe just 'details' if required?
      return true;
    }

    return true;
  } catch {
    return false;
  }
};

const checkPolicy = async () => {
  if (!caseForm.creditcard) return;

  // Reuse handleExtractPolicy for consistency.
  // It returns boolean indicating match success.
  await handleExtractPolicy();
};

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getCaseDetail(id.value);
    // Direct jump to Step 4 (Index 3) for editing
    currentStep.value = 3;
    setTabTitle('编辑案件');
  } else {
    setTabTitle('新建案件');
  }
  mainInsureList.value = await getInsureList(1);
  addiInsureList.value = await getInsureList(2);
});

const handleBackToList = () => {
  closeCurrentTab();
  router.push('/case_beta/list_beta');
};

const handleViewCase = () => {
  if (!createdCaseId.value) return;
  closeCurrentTab();
  router.push(`/case_beta/detail_beta?id=${createdCaseId.value}`);
};
</script>

<template>
  <Page
    :title="`${id ? '更新' : '新建'}案件`"
    v-loading="loading"
    content-class="!p-0 md:!p-4"
  >
    <div
      v-if="isSuccess"
      class="flex min-h-[400px] flex-col items-center justify-center px-6 py-8 md:min-h-[600px] md:py-16"
    >
      <!-- 成功图标动画区域 -->
      <div class="mb-4 flex flex-col items-center md:mb-8">
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg md:mb-6 md:h-24 md:w-24"
        >
          <svg
            class="h-8 w-8 text-white md:h-12 md:w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2
          class="mb-1 text-xl font-bold text-gray-800 md:mb-2 md:text-3xl dark:text-gray-100"
        >
          案件创建成功!
        </h2>
        <p class="text-base text-gray-500 md:text-lg dark:text-gray-400">
          案件已提交至案件池
        </p>
      </div>

      <!-- 案件信息卡片 -->
      <div
        class="mb-6 w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl md:mb-10 dark:from-slate-800 dark:to-slate-900"
      >
        <div
          class="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 md:px-6 md:py-4"
        >
          <h3 class="text-base font-semibold text-white md:text-lg">
            案件信息
          </h3>
        </div>
        <div class="p-4 md:p-6">
          <div class="mb-3 flex items-center justify-between md:mb-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >案件号</span
            >
            <span
              class="rounded-lg bg-white px-3 py-1 font-mono text-base font-bold text-indigo-600 shadow-sm md:px-4 md:py-2 md:text-lg dark:bg-slate-700 dark:text-indigo-400"
            >
              {{ createdCaseId }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >创建时间</span
            >
            <span class="text-xs text-gray-700 md:text-sm dark:text-gray-300">
              {{ new Date().toLocaleString('zh-CN') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="success-actions flex w-full max-w-md flex-col gap-3 md:gap-4">
        <ElButton
          type="primary"
          size="large"
          class="!h-10 !w-full !rounded-xl !text-base !font-semibold !shadow-lg hover:!shadow-xl md:!h-14 md:!text-lg"
          :icon="AntdArrowLeftOutlined"
          @click="handleBackToList"
        >
          返回案件列表
        </ElButton>
        <ElButton
          size="large"
          class="!h-10 !w-full !rounded-xl !border-2 !border-gray-300 !bg-white !text-base !font-semibold !text-gray-700 hover:!border-indigo-400 hover:!bg-indigo-50 hover:!text-indigo-600 md:!h-14 md:!text-lg dark:!border-gray-600 dark:!bg-slate-800 dark:!text-gray-200 dark:hover:!border-indigo-500 dark:hover:!bg-slate-700 dark:hover:!text-indigo-400"
          :icon="AntdEyeOutlined"
          @click="handleViewCase"
        >
          查看案件详情
        </ElButton>
      </div>
    </div>

    <div v-else class="mx-auto max-w-5xl">
      <div
        class="steps-container mb-8 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900"
      >
        <ElSteps
          :active="currentStep"
          :direction="isMobile ? 'vertical' : 'horizontal'"
          :simple="false"
          :space="isMobile ? 45 : ''"
          align-center
          class="custom-steps"
          finish-status="success"
        >
          <ElStep title="录入信息" />
          <ElStep title="选择保单" />
          <ElStep title="报案人" />
          <ElStep title="报案信息" />
        </ElSteps>
      </div>
      <ElForm
        ref="caseFormRef"
        :model="caseForm"
        :rules="rules"
        class="demo-caseForm"
        label-width="120px"
        status-icon
      >
        <ElCard
          class="box-card !rounded-xl !border-none !shadow-lg dark:!bg-slate-900"
        >
          <template #header>
            <div class="card-header flex items-center justify-between py-2">
              <span
                class="text-lg font-bold text-gray-800 dark:text-gray-100"
                >{{
                  currentStep === 0
                    ? '基本信息'
                    : currentStep === 1
                      ? '保单信息'
                      : currentStep === 2
                        ? '报案人信息'
                        : '补充信息'
                }}</span
              >
            </div>
          </template>

          <div class="md:px-4 md:py-2">
            <!-- 步骤1：录入基本信息 -->
            <div v-if="currentStep === 0" class="mx-auto max-w-2xl py-8">
              <ElRow :gutter="20">
                <ElCol :span="24">
                  <ElFormItem
                    label="骑手姓名"
                    prop="name"
                    class="mb-6 items-center"
                    label-width="80px"
                  >
                    <ElInput
                      v-model="caseForm.name"
                      :readonly="!!id"
                      placeholder="请输入骑手姓名"
                      class="!h-10"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem
                    label="身份证号"
                    prop="creditcard"
                    class="mb-6 items-center"
                    label-width="80px"
                  >
                    <ElInput
                      v-model="caseForm.creditcard"
                      :readonly="!!id"
                      placeholder="请输入身份证号"
                      class="!h-10"
                      @blur="handleAutoExtract"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem
                    label="出险时间"
                    prop="insureTime"
                    class="mb-6 items-center"
                    label-width="80px"
                  >
                    <ElDatePicker
                      v-model="caseForm.insureTime"
                      :disabled-date="disabledBegin"
                      placeholder="请选择出险时间"
                      type="datetime"
                      class="!h-10 !w-full"
                      @change="handleAutoExtract"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <div class="mt-8 flex justify-center gap-4">
                <ElButton
                  type="primary"
                  size="large"
                  class="!px-12"
                  @click="nextStep"
                >
                  下一步
                </ElButton>
                <ElButton size="large" class="!px-12" @click="back">
                  取消
                </ElButton>
              </div>
            </div>

            <!-- 步骤2：选择保单 -->
            <div v-else-if="currentStep === 1" class="py-4">
              <!-- Policy Selection List -->
              <div
                v-if="showPolicySelection && !isPolicyMatched"
                class="mx-auto max-w-4xl"
              >
                <div class="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800">
                  <span class="font-bold">提示：</span>
                  查询到多条保单，请选择一条进行操作
                </div>
                <div class="policy-list grid gap-4">
                  <ElCard
                    v-for="(item, index) in policyList"
                    :key="index"
                    class="cursor-pointer !rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md"
                    @click="handleSelectPolicy(item)"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div
                          class="mb-1 text-lg font-bold text-gray-800 dark:text-gray-100"
                        >
                          {{ item.username || '未命名' }}
                        </div>
                        <div class="text-sm text-gray-500">
                          <span class="mr-4">
                            电话: {{ item.phone || '-' }}
                          </span>
                          <span> 保单号: {{ item.policyNo || '-' }} </span>
                          <span class="ml-4">
                            保单系统编号: {{ item.uuid || '-' }}
                          </span>
                          <!-- Add other info if available like policyNo or time -->
                        </div>
                      </div>
                      <ElButton type="primary" size="small" plain>
                        选择
                      </ElButton>
                    </div>
                  </ElCard>
                </div>
                <div class="mt-6 text-center">
                  <a
                    class="cursor-pointer text-sm text-blue-500 hover:text-blue-700 hover:underline"
                    @click="
                      showPolicySelection = false;
                      isPolicyMatched = false;
                    "
                  >
                    没有找到想要的保单？手动输入 &rarr;
                  </a>
                </div>
                <div class="mt-8 flex justify-center">
                  <ElButton size="large" class="!px-12" @click="prevStep">
                    上一步
                  </ElButton>
                </div>
              </div>

              <!-- Matched Policy Info -->
              <div v-else-if="isPolicyMatched" class="mx-auto max-w-3xl">
                <div
                  class="mb-6 flex items-center justify-center rounded-lg bg-green-50 py-4 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                >
                  <span class="mr-2 text-xl">✅</span>
                  <span class="text-lg font-bold">已匹配到相关保单</span>
                </div>
                <div
                  class="policy-details overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-900"
                >
                  <div
                    class="bg-gray-50 px-6 py-4 font-bold text-gray-700 dark:bg-slate-800 dark:text-gray-100"
                  >
                    保单详情
                  </div>
                  <div class="p-6">
                    <ElRow :gutter="24">
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          主险/附加险
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{
                            caseForm.insuredAttachName ||
                            caseForm.insuredMainName ||
                            '-'
                          }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          保单号
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{ caseForm.policyNo || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          保单系统编号
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{ caseForm.uuid || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          起保时间
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{ caseForm.startTime || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          终保时间
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{ caseForm.endTime || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          所属客户名
                        </div>
                        <div class="font-medium dark:text-gray-200">
                          {{ caseForm.customername || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          所属渠道名
                        </div>
                        <div class="font-medium">
                          {{ caseForm.channelName || '-' }}
                        </div>
                      </ElCol>
                      <ElCol :span="12" class="mb-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          骑手所属站点名
                        </div>
                        <div class="font-medium">
                          {{ caseForm.stopName || '-' }}
                        </div>
                      </ElCol>
                    </ElRow>
                  </div>
                </div>
                <div class="mt-8 text-center">
                  <ElButton
                    type="primary"
                    size="large"
                    class="!px-12"
                    @click="nextStep"
                  >
                    选择该保单
                  </ElButton>
                  <div class="mt-6 flex flex-col items-center gap-2">
                    <a
                      v-if="policyList.length > 0"
                      class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 hover:underline"
                      @click="
                        isPolicyMatched = false;
                        showPolicySelection = true;
                      "
                    >
                      &larr; 返回重新选择保单
                    </a>
                    <a
                      class="cursor-pointer text-sm text-blue-500 hover:text-blue-700 hover:underline"
                      @click="
                        isPolicyMatched = false;
                        showPolicySelection = false;
                      "
                    >
                      未匹配到相关保单，您可以手动输入保单信息以继续创建 &rarr;
                    </a>
                  </div>
                </div>
              </div>

              <!-- Manual Input Form -->
              <div v-else class="mx-auto max-w-4xl">
                <div
                  class="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                >
                  <span class="font-bold">提示：</span>
                  请手动完善以下保单信息
                </div>

                <div class="mb-8">
                  <div
                    class="mb-4 flex items-center border-b border-gray-200 pb-2"
                  >
                    <div class="mr-2 h-4 w-1 bg-blue-500"></div>
                    <h3
                      class="text-lg font-bold text-gray-800 dark:text-gray-100"
                    >
                      主险信息
                    </h3>
                  </div>
                  <ElRow :gutter="24">
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="主险保单号" prop="policyNo">
                        <ElInput
                          v-model="caseForm.policyNo"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="保险公司名称" prop="companyMain">
                        <ElInput
                          v-model="caseForm.companyMain"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="主险方案" prop="insuredMain">
                        <ElSelect
                          v-model="caseForm.insuredMain"
                          filterable
                          placeholder="请选择"
                          class="!w-full"
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
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="投保人名称" prop="tbr">
                        <ElInput v-model="caseForm.tbr" placeholder="请输入" />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="投保人证件类型" prop="tbrCardtype">
                        <ElSelect
                          v-model="caseForm.tbrCardtype"
                          placeholder="请选择"
                          class="!w-full"
                        >
                          <ElOption label="身份证" :value="0" />
                          <ElOption label="企业信用代码" :value="1" />
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="投保人证件号" prop="tbCard">
                        <ElInput
                          v-model="caseForm.tbCard"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="被保人名称" prop="name">
                        <ElInput v-model="caseForm.name" placeholder="请输入" />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="被保人证件类型" prop="bbrCardtype">
                        <ElSelect
                          v-model="caseForm.bbrCardtype"
                          placeholder="请选择"
                          class="!w-full"
                        >
                          <ElOption label="身份证" :value="0" />
                          <ElOption label="护照" :value="1" />
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="被保人证件号" prop="bbCard">
                        <ElInput
                          v-model="caseForm.bbCard"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <div class="mb-8">
                  <div
                    class="mb-4 flex items-center border-b border-gray-200 pb-2"
                  >
                    <div class="mr-2 h-4 w-1 bg-green-500"></div>
                    <h3 class="text-lg font-bold text-gray-800">附加险信息</h3>
                  </div>
                  <ElRow :gutter="24">
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="附加险保单号" prop="policyNoAttach">
                        <ElInput
                          v-model="caseForm.policyNoAttach"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="保险公司名称" prop="companyAttach">
                        <ElInput
                          v-model="caseForm.companyAttach"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="附加险方案" prop="insuredAttach">
                        <ElSelect
                          v-model="caseForm.insuredAttach"
                          filterable
                          placeholder="请选择"
                          class="!w-full"
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
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="投保人名称" prop="tbrAttach">
                        <ElInput
                          v-model="caseForm.tbrAttach"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem
                        label="投保人证件类型"
                        prop="tbrCardtypeAttach"
                      >
                        <ElSelect
                          v-model="caseForm.tbrCardtypeAttach"
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
                        <ElInput
                          v-model="caseForm.tbCardAttach"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="被保人名称" prop="bbrAttach">
                        <ElInput
                          v-model="caseForm.bbrAttach"
                          placeholder="同主险"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem
                        label="被保人证件类型"
                        prop="bbrCardtypeAttach"
                      >
                        <ElSelect
                          v-model="caseForm.bbrCardtypeAttach"
                          placeholder="同主险"
                          class="!w-full"
                        >
                          <ElOption label="身份证" :value="0" />
                          <ElOption label="企业信用代码" :value="1" />
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="被保人证件号" prop="bbCardAttach">
                        <ElInput
                          v-model="caseForm.bbCardAttach"
                          placeholder="同主险"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <div class="mb-8">
                  <div
                    class="mb-4 flex items-center border-b border-gray-200 pb-2"
                  >
                    <div class="mr-2 h-4 w-1 bg-orange-500"></div>
                    <h3 class="text-lg font-bold text-gray-800">站点信息</h3>
                  </div>
                  <ElRow :gutter="24">
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="站点名称" prop="stopName">
                        <ElInput
                          v-model="caseForm.stopName"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="站长姓名" prop="stopOwnerName">
                        <ElInput
                          v-model="caseForm.stopOwnerName"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :xs="24" :sm="12" :md="8">
                      <ElFormItem label="站长手机号" prop="stopOwnerPhone">
                        <ElInput
                          v-model="caseForm.stopOwnerPhone"
                          placeholder="请输入"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                  <ElButton @click="prevStep">上一步</ElButton>
                  <ElButton
                    type="primary"
                    size="large"
                    class="!px-12"
                    @click="nextStep"
                  >
                    确认创建案件
                  </ElButton>
                  <ElButton @click="back">取消</ElButton>
                </div>
              </div>
            </div>

            <!-- 步骤3：报案人信息 -->
            <div v-else-if="currentStep === 2" class="mx-auto max-w-2xl py-8">
              <div
                class="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20"
              >
                <ElCheckbox v-model="isReporterSameAsRider" class="!mr-0">
                  <span
                    class="text-base font-bold text-blue-800 dark:text-blue-300"
                  >
                    报案人同骑手本人信息
                  </span>
                </ElCheckbox>
                <div class="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  勾选后将自动填充骑手信息到下方报案人信息中
                </div>
              </div>

              <div
                class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-900"
              >
                <ElFormItem
                  label="报案人姓名"
                  prop="nameRep"
                  class="mb-6 items-center"
                >
                  <ElInput
                    v-model="caseForm.nameRep"
                    placeholder="请输入报案人姓名"
                    class="!h-10"
                  />
                </ElFormItem>
                <ElFormItem
                  label="报案人手机号"
                  prop="phoneRep"
                  class="mb-6 items-center"
                >
                  <ElInput
                    v-model="caseForm.phoneRep"
                    placeholder="请输入报案人手机号"
                    class="!h-10"
                  />
                </ElFormItem>
                <ElFormItem
                  label="报案人身份证号"
                  prop="creditcardRep"
                  class="mb-6 items-center"
                >
                  <ElInput
                    v-model="caseForm.creditcardRep"
                    placeholder="请输入报案人身份证号"
                    class="!h-10"
                  />
                </ElFormItem>

                <ElFormItem
                  label="骑手手机号"
                  prop="phone"
                  class="mb-0 items-center"
                >
                  <ElInput
                    v-model="caseForm.phone"
                    placeholder="请输入骑手手机号"
                    class="!h-10"
                  />
                </ElFormItem>
              </div>

              <div class="mt-8 flex justify-center gap-4 text-center">
                <ElButton size="large" class="!px-12" @click="prevStep">
                  上一步
                </ElButton>
                <ElButton
                  type="primary"
                  size="large"
                  class="!px-12"
                  @click="nextStep"
                >
                  确认创建案件
                </ElButton>
              </div>
            </div>

            <!-- 步骤4：补充信息 -->
            <div v-else-if="currentStep === 3" class="mx-auto max-w-4xl py-4">
              <div
                class="mb-8 rounded-xl bg-green-50 p-6 text-center dark:bg-green-900/20"
              >
                <div
                  class="mb-2 text-2xl font-bold text-green-700 dark:text-green-400"
                >
                  🎉 案件创建成功
                </div>
                <div class="text-green-600">
                  案件号：<span class="font-mono font-bold">{{
                    newlyCreatedCaseId || id || 'New'
                  }}</span>
                </div>
                <div class="mt-2 text-sm text-gray-500">
                  请继续补充以下出险信息，以便我们更好地为您服务
                </div>
              </div>

              <div class="mb-8">
                <div
                  class="mb-4 flex items-center border-b border-gray-200 pb-2"
                >
                  <div class="mr-2 h-4 w-1 bg-purple-500"></div>
                  <h3
                    class="text-lg font-bold text-gray-800 dark:text-gray-100"
                  >
                    详细信息
                  </h3>
                </div>
                <ElRow :gutter="24">
                  <ElCol :span="24">
                    <ElFormItem
                      label="出险事故详细描述"
                      prop="details"
                      label-width="140px"
                    >
                      <ElInput
                        v-model="caseForm.details"
                        :autosize="{ minRows: 4 }"
                        placeholder="请输入事故经过、原因、损失情况等详细描述..."
                        type="textarea"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24" :sm="12">
                    <ElFormItem
                      label="事故区域"
                      prop="caseArea"
                      label-width="140px"
                    >
                      <ElCascader
                        v-model="caseForm.caseArea"
                        :options="areaOptions"
                        class="!w-full"
                        @change="areaChange"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24" :sm="12">
                    <ElFormItem
                      label="事故时间"
                      prop="insureTime"
                      label-width="140px"
                    >
                      <ElDatePicker
                        v-model="caseForm.insureTime"
                        type="datetime"
                        placeholder="请选择"
                        class="!w-full"
                        disabled
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="24">
                    <ElFormItem
                      label="详细地址"
                      prop="address"
                      label-width="140px"
                    >
                      <ElInput
                        v-model="caseForm.address"
                        placeholder="请输入详细地址"
                      />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
              </div>

              <!-- Third Party Info -->
              <div class="mb-8">
                <div
                  class="mb-4 flex items-center border-b border-gray-200 pb-2"
                >
                  <div class="mr-2 h-4 w-1 bg-indigo-500"></div>
                  <h3
                    class="text-lg font-bold text-gray-800 dark:text-gray-100"
                  >
                    三者信息
                  </h3>
                </div>
                <div
                  v-for="(item, index) in caseForm.zts"
                  :key="index"
                  class="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
                >
                  <div class="flex flex-col gap-4 md:flex-row md:items-center">
                    <div
                      class="flex items-center justify-between font-bold text-gray-700 md:block md:whitespace-nowrap"
                    >
                      <span>三者{{ index + 1 }}</span>
                      <div
                        v-if="caseForm.zts && caseForm.zts.length > 1"
                        class="cursor-pointer text-gray-400 hover:text-red-500 md:hidden"
                        @click="removeThirdParty(index)"
                      >
                        <ElIcon :size="20"><CircleClose /></ElIcon>
                      </div>
                    </div>
                    <ElFormItem
                      label="姓名"
                      label-width="50px"
                      class="!mb-0 w-full md:w-auto md:flex-1"
                    >
                      <ElInput v-model="item.username" placeholder="请输入" />
                    </ElFormItem>
                    <ElFormItem
                      label="手机号"
                      label-width="60px"
                      class="!mb-0 w-full md:w-auto md:flex-1"
                      :prop="`zts.${index}.phone`"
                      :rules="[
                        {
                          pattern: /^1[3-9]\d{9}$/,
                          message: '手机号格式错误',
                          trigger: 'blur',
                        },
                      ]"
                    >
                      <ElInput v-model="item.phone" placeholder="请输入" />
                    </ElFormItem>
                    <div
                      v-if="caseForm.zts && caseForm.zts.length > 1"
                      class="hidden flex-shrink-0 cursor-pointer text-gray-400 hover:text-red-500 md:block"
                      @click="removeThirdParty(index)"
                    >
                      <ElIcon :size="20"><CircleClose /></ElIcon>
                    </div>
                  </div>
                </div>
                <ElButton
                  plain
                  class="!w-full !border-dashed !border-indigo-300 !text-indigo-500 hover:!border-indigo-500 hover:!text-indigo-600"
                  @click="addThirdParty"
                >
                  + 添加事故三者信息
                </ElButton>
              </div>

              <div class="mb-8">
                <div
                  class="mb-4 flex items-center border-b border-gray-200 pb-2"
                >
                  <div class="mr-2 h-4 w-1 bg-blue-500"></div>
                  <h3
                    class="text-lg font-bold text-gray-800 dark:text-gray-100"
                  >
                    影像资料
                  </h3>
                </div>
                <DraggableUploadList
                  :id="id"
                  ref="uploadListRef"
                  v-model:files="caseForm.files"
                />
              </div>

              <div
                class="mt-8 flex flex-col justify-center gap-4 md:flex-row"
                v-if="!id"
              >
                <ElButton
                  size="large"
                  class="!w-full !px-8 md:!w-auto"
                  @click="back"
                >
                  暂持案件并稍后补充
                </ElButton>
                <ElButton
                  type="primary"
                  size="large"
                  class="!ml-0 !w-full !px-8 md:!w-auto"
                  @click="handleUpdateCase(caseFormRef)"
                >
                  完成创建并提交
                </ElButton>
              </div>
            </div>
          </div>
        </ElCard>
      </ElForm>
    </div>

    <div class="btn-container max-w-5xl" v-if="id && !isSuccess">
      <!-- 更新案件 -->
      <ElButton
        type="primary"
        @click="handleUpdateCase(caseFormRef)"
        class="btn-responsive"
      >
        更新
      </ElButton>
      <ElButton @click="back" class="btn-responsive">取消</ElButton>
    </div>
  </Page>
</template>

<style scoped>
/* 响应式样式 */
@media screen and (max-width: 768px) {
  /* 调整steps组件在手机端的显示 */
  :deep(.el-steps) {
    margin-bottom: 20px;
  }

  :deep(.el-step__title) {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    white-space: nowrap;
  }

  /* 调整表单布局 */
  .demo-caseForm {
    padding: 0 10px;
  }

  /* 调整卡片样式 */
  :deep(.el-card) {
    margin-bottom: 15px;
  }

  /* 调整按钮布局 */
  .flex.w-full.justify-end {
    flex-direction: column;
    gap: 10px;
    padding: 0 10px 20px;
  }

  /* 调整输入框样式 */
  :deep(.el-input__inner),
  :deep(.el-select__wrapper) {
    font-size: 14px;
  }

  /* 调整表单标签样式 */
  :deep(.el-form-item__label) {
    padding-right: 10px;
    font-size: 14px;
  }

  /* 调整滚动条高度 */
}

/* 手机端步骤条样式 */
@media (max-width: 768px) {
  .steps-container {
    padding: 15px;
    margin: 0 10px 20px;
  }

  .custom-steps {
    height: auto;

    /* 调整步骤节点样式 */
    :deep(.el-step__head) {
      /* height: 28px; */

      /* line-height: 28px; */
      font-size: 12px;

      /* display: flex; */

      /* align-items: center; */

      /* justify-content: center; */
    }

    /* 调整标题样式 */
    :deep(.el-step__title) {
      font-size: 14px;
      line-height: 24px;
    }

    :deep(.el-step__description) {
      margin-top: 0;
      font-size: 12px;
    }

    /* 调整手机端步骤线样式 */

    /* :deep(.el-step__line) {
      top: 14px;
    } */
  }

  /* 手机端按钮样式 */
  .btn-container {
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: center !important;
    padding: 0 10px 20px !important;
  }

  .btn-container .btn-responsive {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
}

:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-form-item .el-date-editor) {
  width: 100%;
}

/* 覆盖完成页按钮的默认左边距 */
.success-actions .el-button + .el-button {
  margin-left: 0;
}

/* 按钮容器样式 */
.btn-container {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
  padding: 10px 0;
  margin: 0 auto;
}

/* 响应式按钮样式 */
.btn-responsive {
  width: 120px;
}

/* 美化步骤条样式 */
.steps-container {
  padding: 20px;

  /* background-color: #fff;  Removed to allow utility classes to work */
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.dark .custom-steps .el-step__title {
  color: #f3f4f6 !important;
}

.dark .custom-steps .el-step__description {
  color: #9ca3af !important;
}

.dark .custom-steps .el-step__head.is-wait {
  color: #6b7280 !important;
  border-color: #6b7280 !important;
}

.custom-steps {
  /* 调整步骤条整体样式 */
  margin-bottom: 0;

  /* 调整步骤节点样式 */
  :deep(.el-step__head) {
    /* height: 32px; */

    /* line-height: 32px; */
    font-size: 14px;

    /* display: flex; */

    /* align-items: center; */

    /* justify-content: center; */
  }

  /* 调整激活状态的样式 */
  :deep(.el-step__head.is-active) {
    color: #409eff;
    border-color: #409eff;

    .el-step__icon {
      background-color: #ecf5ff;
      border-color: #409eff;
    }
  }

  /* 调整完成状态的样式 */
  :deep(.el-step__head.is-finish) {
    color: #67c23a;
    border-color: #67c23a;

    .el-step__icon {
      background-color: #f0f9eb;
      border-color: #67c23a;
    }
  }

  /* 调整标题样式 */
  :deep(.el-step__title) {
    font-size: 15px;
    font-weight: 500;
  }

  :deep(.el-step__description) {
    font-size: 12px;
    color: #909399;
  }

  /* 调整步骤线样式 */

  /* :deep(.el-step__line) {
    top: 16px;
  } */

  /* :deep(.el-step__line-inner) {
    height: 3px;
  } */
}
</style>
