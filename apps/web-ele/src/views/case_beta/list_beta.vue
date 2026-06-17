<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Warning } from '@element-plus/icons-vue';
import { useDebounceFn, useWindowSize } from '@vueuse/core';
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElLink,
  ElMessage,
  ElPopover,
  ElTag,
  ElText,
  ElTooltip,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { authUserListApi } from '#/api/core/authuser';
import { CaseRecordExportApi, CaseRecordListApi } from '#/api/core/case-record';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { useCaseStore } from '#/store/case';
import { formatIdCard } from '#/utils/formatIDCardUtils';

import TransferHandlerModal from './components/TransferHandlerModal.vue';

// 使用简化的接口，避免类型递归
interface CaseInfo {
  id?: number | string;
  companyName?: string;
  name?: string;
  creditcard?: string;
  phone?: string;
  insureTime?: string;
  status?: number;
  stopName?: string;
  stopOwnerName?: string;
  stopOwnerPhone?: string;
  zeren?: number;
  usernameOwner?: string;
  username?: string;
  lipeiPerson?: number;
  insureType?: number;
  insuredMainName?: string;
  insuredAttachName?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  details?: string;
  created?: string;
  moneyMain?: number;
  moneryAttach?: number;
  moneyDianfu?: number;
  closeTime?: string;
  policyNo?: string;
  casenoInsuredMain?: string;
  policyNoAttach?: string;
  casenoInsuredAttach?: string;
  owner?: string;
  ownerName?: string;
  exceptionTag?: number;
  exceptionType?: string;
  guaqiTag?: number;
  guaqiType?: string;
  cosed?: number;
  cuibanTag?: number;
  fengxianTag?: number;
  timeout?: number;
  timoutTL?: number; // 0: Normal, 1: Timeout, 2: Serious Timeout
  alarmCount?: number;
  cuibanCount?: number;
  panding?: string; // Special judgment IDs
  commentStatusText?: string;
  peifuStatusText?: string;
  finalPayText?: string;
  insureTypeDisplay?: string;
  specialTags?: string;
}

const router = useRouter();
const caseStore = useCaseStore();
const { hasAccessByRoles } = useAccess();

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
const dynamicCollapsedRows = computed(() => (isMobile.value ? 4 : 2));

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入案件号',
        allowClear: true,
      },
      fieldName: 'id',
      label: '案件号',
    },
    {
      component: 'ApiSelect',
      fieldName: 'companyId',
      label: '所属公司',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getCustomerList(),
        filterable: true,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入出险人',
        allowClear: true,
      },
      fieldName: 'name',
      label: '出险人',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入身份证号码',
        allowClear: true,
      },
      fieldName: 'creditcard',
      label: '身份证号码',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入骑手手机号',
        allowClear: true,
      },
      fieldName: 'phone',
      label: '骑手手机号',
    },
    {
      component: 'DatePicker',
      fieldName: 'insureTime',
      label: '出险时间',
      componentProps: {
        allowClear: true,
        type: 'datetimerange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        shortcuts,
      },
      formItemClass: 'col-span-1 md:col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请输入案件状态',
        allowClear: true,
        options: [
          { label: '案件待定损', value: 1 },
          { label: '已有定损表待对接', value: 2 },
          { label: '已创建保司对接表待提交', value: 3 },
          { label: '已提交保司待保司反馈', value: 4 },
          { label: '已有保司反馈待客户确认', value: 5 },
          { label: '客户协商已完成', value: 6 },
          { label: '理赔付款完成', value: 7 },
          { label: '已结案', value: 8 },
        ],
        multiple: true,
      },
      fieldName: 'status',
      label: '案件状态',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入所属站点',
        allowClear: true,
      },
      fieldName: 'stopName',
      label: '所属站点',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入站长姓名',
        allowClear: true,
      },
      fieldName: 'stopOwnerName',
      label: '站长姓名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入站长手机号',
        allowClear: true,
      },
      fieldName: 'stopOwnerPhone',
      label: '站长手机号',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请输入责任判定',
        allowClear: true,
        options: [
          { label: '全责', value: 1 },
          { label: '主责', value: 2 },
          { label: '次责', value: 3 },
          { label: '同责', value: 4 },
          { label: '无责', value: 5 },
          { label: '摔伤', value: 6 },
        ],
        multiple: true,
      },
      fieldName: 'zeren',
      label: '责任判定',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入事故区域',
        allowClear: true,
      },
      fieldName: 'locationtype',
      label: '事故区域',
    },
    {
      component: 'ApiSelect',
      fieldName: 'owner',
      label: '当前处理人',
      componentProps: {
        placeholder: '请选择当前处理人',
        allowClear: true,
        filterable: true,
        api: async () => await getAccountList(),
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'userid',
      label: '创建人',
      componentProps: {
        placeholder: '请选择创建人',
        allowClear: true,
        filterable: true,
        api: async () => await getAccountList(),
      },
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请输入赔偿对象',
        allowClear: true,
        options: [
          { label: '骑手', value: 0 },
          { label: '公司', value: 1 },
          { label: '三者', value: 2 },
        ],
        multiple: true,
      },
      fieldName: 'lipeiPerson',
      label: '赔偿对象',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请输入出险类型',
        allowClear: true,
        options: [
          { label: '自身受伤', value: 1 },
          { label: '三者受伤', value: 2 },
          { label: '三者物损', value: 3 },
        ],
        multiple: true,
      },
      fieldName: 'insureType',
      label: '出险类型',
    },
    {
      component: 'ApiSelect',
      fieldName: 'insuredMain',
      label: '主险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(1),
        multiple: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'insuredAttach',
      label: '附加险方案',
      componentProps: {
        clearable: true,
        placeholder: '请选择',
        api: async () => await getInsureList(2),
        multiple: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'historyOwnerId',
      label: '历史关联理赔员',
      componentProps: {
        placeholder: '请选择历史理赔员',
        allowClear: true,
        filterable: true,
        api: async () => await getAccountList(),
      },
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态/标签',
        allowClear: true,
        options: [
          { label: '理赔中', value: '1' },
          { label: '挂起', value: '2' },
          { label: '已结案', value: '3' },
          { label: '异常理赔中', value: '4' },
          { label: '异常已结案', value: '5' },
          { label: '异常挂起', value: '6' },
        ],
      },
      fieldName: 'statusWithTag',
      label: '案件状态',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择保司对接状态',
        allowClear: true,
        options: [
          { label: '提交保司', value: 1 },
          { label: '保司审核', value: 2 },
          { label: '保司反馈', value: 3 },
          { label: '保司协商', value: 4 },
          { label: '协商一致', value: 5 },
          { label: '沟通异常', value: 6 },
          { label: '付款失败', value: 7 },
        ],
      },
      fieldName: 'eventBsdj',
      label: '保司对接状态',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择骑手对接状态',
        allowClear: true,
        options: [
          { label: '初步协商一致', value: 1 },
          { label: '协商异常', value: 2 },
          { label: '协商一致', value: 3 },
          { label: '无法联系', value: 4 },
          { label: '其他情况', value: 5 },
        ],
      },
      fieldName: 'eventXsdj',
      label: '骑手对接状态',
    },
    // {
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入骑手对接最新状态',
    //     allowClear: true,
    //   },
    //   fieldName: 'peifuStatusText',
    //   label: '骑手最新状态文本',
    // },
    {
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择特殊标签',
        allowClear: true,
        api: async () => {
          await caseStore.fetchSpecialJudgmentList();
          return (caseStore.specialJudgmentList || []).map((item: any) => ({
            label: item.title,
            value: item.title,
          }));
        },
        multiple: true,
      },
      fieldName: 'specialTags',
      label: '特殊标签',
    },
    {
      component: 'DatePicker',
      fieldName: 'creatRangerDate',
      label: '创建时间',
      componentProps: {
        allowClear: true,
        type: 'datetimerange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        shortcuts,
      },
      formItemClass: 'col-span-1 md:col-span-2',
    },
    {
      component: 'DatePicker',
      fieldName: 'caseRangerDate',
      label: '结案时间',
      componentProps: {
        allowClear: true,
        type: 'datetimerange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        shortcuts,
      },
      formItemClass: 'col-span-1 md:col-span-2',
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  showCollapseButton: true,
  collapsedRows: dynamicCollapsedRows.value,
  collapsed: true,
  submitButtonOptions: {
    content: '查询',
  },
  resetButtonOptions: {
    onClick: () => {
      // 清除快速筛选状态
      activeFilter.value = null;
      currentStatus.value = '';
    },
  },
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<CaseInfo> = {
  columns: [
    { field: 'id', title: '案件号', width: 80 },
    { field: 'name', title: '出险人(骑手)', minWidth: 120 },
    {
      field: 'creditcard',
      title: '骑手身份证号码',
      minWidth: 150,
      formatter: ({ row }) => formatIdCard(row.creditcard!!),
    },
    {
      field: 'status_merged',
      title: '案件状态',
      slots: { default: 'status_merged' },
      minWidth: 250,
    },
    {
      field: 'insureTime',
      title: '出险时间',
      formatter: ({ row }) =>
        row.insureTime
          ? moment(row.insureTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 150,
    },
    {
      field: 'usernameOwner',
      title: '当前处理人',
      minWidth: 150,
      formatter: ({ row }) => (row.zeren === -1 ? '' : row.usernameOwner || ''),
    },
    { field: 'username', title: '创建人', minWidth: 150 },
    {
      field: 'created',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 140,
    },
    { field: 'companyName', title: '所属公司', minWidth: 160 },
    { field: 'stopName', title: '所属站点', minWidth: 150 },
    {
      field: 'addr',
      title: '事故区域',
      formatter: ({ row }) =>
        row.province ? `${row.province} / ${row.city} / ${row.district}` : '',
      minWidth: 180,
    },
    { field: 'details', title: '事故概况', minWidth: 300 },
    { field: 'policyNo', title: '主险保单号', minWidth: 120 },
    { field: 'policyNoAttach', title: '附加险保单号', minWidth: 120 },
    { field: 'phone', title: '骑手手机号', minWidth: 120 },
    {
      field: 'insureTypeDisplay',
      title: '出险类型',
      slots: { default: 'insureTypeDisplay' },
      minWidth: 150,
    },
    {
      field: 'specialTagsDisplay',
      title: '特殊标签',
      slots: { default: 'specialTagsDisplay' },
      minWidth: 150,
    },
    {
      field: 'riderConnectStatusDisplay',
      title: '骑手对接状态',
      slots: { default: 'riderConnectStatusDisplay' },
      minWidth: 180,
    },
    {
      field: 'insureConnectStatusDisplay',
      title: '保司对接状态',
      slots: { default: 'insureConnectStatusDisplay' },
      minWidth: 180,
    },
    {
      field: 'finalPaymentResultDisplay',
      title: '最终赔付结果',
      slots: { default: 'finalPaymentResultDisplay' },
      minWidth: 200,
    },
    {
      title: '操作',
      fixed: 'right',
      width: isMobile.value ? 80 : 200,
      slots: { default: 'operate' },
      showOverflow: true,
    },
  ],
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 30, 50],
  },
  sortConfig: {
    multiple: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
  minHeight: 500,
  stripe: true,
  border: true,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues: any) => {
        // Separate date ranges from payload if necessary, or just send them.
        // The API signature requires groupInfo and params.

        // Construct query params
        const params: any = {
          page: page.currentPage,
          size: page.pageSize,
          beginTime: formValues.creatRangerDate?.[0]
            ? moment(formValues.creatRangerDate?.[0]).valueOf()
            : undefined,
          endTime: formValues.creatRangerDate?.[1]
            ? moment(formValues.creatRangerDate?.[1]).valueOf()
            : undefined,
          anjianBeginTime: formValues.caseRangerDate?.[0]
            ? moment(formValues.caseRangerDate?.[0]).valueOf()
            : undefined,
          anjianEndTime: formValues.caseRangerDate?.[1]
            ? moment(formValues.caseRangerDate?.[1]).valueOf()
            : undefined,
          status: currentStatus.value || undefined,
        };

        // Construct groupInfo (body)
        // Clone formValues to avoid modifying original
        const groupInfo = {
          ...formValues,
          quickFilter:
            activeFilter.value === 'newCase'
              ? '1'
              : activeFilter.value === 'timeoutCase'
                ? '2'
                : undefined,
        };

        // 如果激活了快捷筛选，将普通的 status 条件置空，避免查询条件冲突
        if (groupInfo.quickFilter) {
          params.status = undefined;
        }

        // 如果是投保端业务账号，强制限制只查自己创建 of 案件
        if (isBusinessUser.value) {
          groupInfo.userid = String(userStore.userInfo?.id || '');
        }

        // Convert owner to array if it is present
        if (groupInfo.owner) {
          groupInfo.owner = [groupInfo.owner];
        }

        // Remove range fields from groupInfo if they shouldn't be in the body object (cleaner)
        delete groupInfo.creatRangerDate;
        delete groupInfo.caseRangerDate;

        return await CaseRecordListApi(groupInfo, params);
      },
    },
  },
};

const store = useCaseStore();
const userStore = useUserStore();

// 判断是否是投保端业务人员
const isBusinessUser = computed(() => {
  const roleName = userStore.userInfo?.roleName || '';
  return ['业务主管', '业务客户', '业务操作员', '业务管理员'].includes(
    roleName,
  );
});

const isClaimConnector = computed(() => {
  const roleId = Number(
    userStore.userInfo?.roleId || (userStore.userInfo as any)?.role,
  );
  const roleName = userStore.userInfo?.roleName || '';
  return roleId === 23 || roleName === '理赔对接员' || isBusinessUser.value;
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: gridOptions as any,
});

// 快速筛选状态
const activeFilter = ref<null | string>(null);
const currentStatus = ref<string>(''); // 当前筛选状态
const processingCount = ref(0);
const participatedCount = ref(0);
const pendingCount = ref(0);
const newCaseCount = ref(0);
const timeoutCaseCount = ref(0);
const isExporting = ref(false);

// 获取各筛选器的数量
const fetchFilterCounts = async () => {
  try {
    // 我处理中
    const res1 = await CaseRecordListApi({}, { page: 1, size: 1, status: '1' });
    processingCount.value = res1.total || 0;

    // 全部待处理
    const res2 = await CaseRecordListApi({}, { page: 1, size: 1, status: '2' });
    pendingCount.value = res2.total || 0;

    // 我参与的
    const res3 = await CaseRecordListApi({}, { page: 1, size: 1, status: '3' });
    participatedCount.value = res3.total || 0;

    // 新创建案件
    const res4 = await CaseRecordListApi(
      { quickFilter: '1' },
      { page: 1, size: 1 },
    );
    newCaseCount.value = res4.total || 0;

    // 未结案的超时案件
    const res5 = await CaseRecordListApi(
      { quickFilter: '2' },
      { page: 1, size: 1 },
    );
    timeoutCaseCount.value = res5.total || 0;
  } catch (error) {
    console.error('Failed to fetch filter counts:', error);
  }
};

// 快速筛选处理
const handleQuickFilter = async (filterType: string) => {
  activeFilter.value = activeFilter.value === filterType ? null : filterType;

  // 根据筛选类型设置 status 参数
  switch (activeFilter.value) {
    case 'newCase': {
      currentStatus.value = ''; // 快捷筛选使用 quickFilter，清空常规 status
      break;
    }
    case 'participated': {
      currentStatus.value = '3'; // 我参与的
      break;
    }
    case 'pending': {
      currentStatus.value = '2'; // 全部待处理
      break;
    }
    case 'processing': {
      currentStatus.value = '1'; // 我处理中
      break;
    }
    case 'timeoutCase': {
      currentStatus.value = ''; // 快捷筛选使用 quickFilter，清空常规 status
      break;
    }
    default: {
      currentStatus.value = '';
    }
  }

  // 触发查询
  await gridApi.query();
};

// 导出 Excel 方法
const handleExportExcel = async () => {
  try {
    const formValues = (await gridApi.formApi.getValues()) || {};

    // 判断表单或快捷筛选是否有条件
    const hasFormCondition = Object.keys(formValues).some((key) => {
      const val = formValues[key];
      if (Array.isArray(val)) {
        return val.length > 0;
      }
      return val !== undefined && val !== null && val !== '';
    });

    const hasCondition = hasFormCondition || !!activeFilter.value;

    if (!hasCondition) {
      ElMessage.error('请选择导出条件并查询数据');
      return;
    }

    isExporting.value = true;
    const params: any = {
      beginTime: formValues.creatRangerDate?.[0]
        ? moment(formValues.creatRangerDate?.[0]).valueOf()
        : undefined,
      endTime: formValues.creatRangerDate?.[1]
        ? moment(formValues.creatRangerDate?.[1]).valueOf()
        : undefined,
      anjianBeginTime: formValues.caseRangerDate?.[0]
        ? moment(formValues.caseRangerDate?.[0]).valueOf()
        : undefined,
      anjianEndTime: formValues.caseRangerDate?.[1]
        ? moment(formValues.caseRangerDate?.[1]).valueOf()
        : undefined,
      status: currentStatus.value || undefined,
    };

    const groupInfo = {
      ...formValues,
      quickFilter:
        activeFilter.value === 'newCase'
          ? '1'
          : activeFilter.value === 'timeoutCase'
            ? '2'
            : undefined,
    };

    if (groupInfo.quickFilter) {
      params.status = undefined;
    }

    if (isBusinessUser.value) {
      groupInfo.userid = String(userStore.userInfo?.id || '');
    }

    if (groupInfo.owner) {
      groupInfo.owner = [groupInfo.owner];
    }

    delete groupInfo.creatRangerDate;
    delete groupInfo.caseRangerDate;

    const exportUrl = await CaseRecordExportApi(groupInfo, params);
    if (exportUrl) {
      window.open(exportUrl, '_blank');
      ElMessage.success('导出成功');
    } else {
      ElMessage.error('导出失败，未获取到下载链接');
    }
  } catch (error) {
    console.error('Export excel failed:', error);
    ElMessage.error('导出失败，请重试');
  } finally {
    isExporting.value = false;
  }
};

// ... existing code ...

const canTransfer = hasAccessByRoles(['超级管理员', '管理员', '理赔管理员']);

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

// 手机端/横屏切换时动态更新操作列宽度
watch(isMobile, (val) => {
  gridApi.setGridOptions({
    columns: (gridOptions.columns || []).map((col: any) =>
      col.title === '操作' ? { ...col, width: val ? 80 : 200 } : col,
    ) as any,
  });
});

function resize() {
  if (height.value - 210 < 600) {
    gridApi.setGridOptions({
      height: height.value + 280,
      maxHeight: 0,
    });
  } else {
    gridApi.setGridOptions({
      height: 0,
      maxHeight: height.value - 210,
    });
  }
}

const detail = (id: number) => {
  // Update store with check mode or empty status checking
  // If viewing, we should probably set up store so detail knows it's view Check logic or just rely on query param?
  // User wants check logic. Let's pass check=1 in query and detail should handle it.
  // BUT we should also ensure store doesn't override with old "handle" data for this ID if any?
  // Actually, updating store is safer to ensure accurate latest state or clear it.
  // For 'view', maybe we don't care about owner/zeren in store?
  // But let's verify if detail_beta uses store to decide edit rights. YES.
  // So we should probably set store status to something that says 'read only' or just pass a flag.
  // Let's pass `check=1` in query.

  router.push(`/case_beta/detail_beta?id=${id}&check=1`);
};

const goHandle = (row: any) => {
  const { id, owner, zeren } = row;
  // Judge by zeren: if zeren is true/present, we consider passing owner.
  // But if zeren is -1 or owner is -1, we don't pass owner.

  // Update store before navigation so detail page can use it
  caseStore.updateCaseStatus(String(id), {
    zeren: String(zeren),
    owner: String(owner),
  });

  router.push(`/case_beta/detail_beta?id=${id}&owner=${owner}&zeren=${zeren}`);
};

const goCreate = () => {
  router.push('/case_beta/edit_beta');
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
  return list.map((item) => ({
    label: item.ordertype,
    value: item.id,
  }));
}

async function getCustomerList() {
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
  return list.map((item) => ({
    label: item.username,
    value: item.id,
  }));
}

async function getAccountList() {
  const { list } = await authUserListApi({
    page: 1,
    size: 2000,
    organid: 0,
  } as any);
  return (list || []).map((item: any) => {
    return {
      label: `${item.description || item.nickName || '未知'} - ${item.username || '未知'}`,
      value: String(item.userId || item.id),
    };
  });
}

// 组件每次被激活（切换回此 Tab 页）时执行
// keepAlive 开启后 onMounted 只在首次执行，后续返回列表页均走 onActivated
onActivated(() => {
  // 始终刷新统计计数，保证数字与实际数据同步
  fetchFilterCounts();
  // 仅在详情/编辑页触发了数据变更后才重新拉取表格数据，避免不必要的全量刷新
  if (store.isUpdated) {
    gridApi.query();
    store.changeCaseStatus(false);
  }
});

// 首次挂载时初始化
onMounted(() => {
  caseStore.fetchExceptionReasons();
  caseStore.fetchSuspendReasons();
});

// const [LogDrawer, logDrawerApi] = useVbenDrawer({
//   connectedComponent: logDrawer,
// });

// const [CaseReopenModal, CaseReopenModalApi] = useVbenModal({
//   connectedComponent: caseReopenModal,
//   closeOnClickModal: false,
//   draggable: true,
// });

// const reopen = (id: number) => {
//   CaseReopenModalApi.setData({ id });
//   CaseReopenModalApi.open();
// };

const [TransferHandlerModalComponent, transferModalApi] = useVbenModal({
  connectedComponent: TransferHandlerModal,
});

function openTransfer(id: number) {
  transferModalApi.setData({ id });
  transferModalApi.open();
}

// function openLog(id: number) {
//   logDrawerApi.setData({ id });
//   logDrawerApi.open();
// }

// 计算理赔主状态
const getMainStatus = (row: CaseInfo) => {
  // 优先级：挂起 > 结案 > 理赔中
  if (row.guaqiTag === 1) {
    return row.exceptionTag === 1 ? '异常案件挂起' : '挂起';
  }
  if (row.cosed === 1) {
    return row.exceptionTag === 1 ? '异常案件已结案' : '已结案';
  }
  return row.exceptionTag === 1 ? '异常案件理赔中' : '理赔中';
};

// 计算主状态对应的标签类型
const getMainStatusType = (
  row: CaseInfo,
): 'danger' | 'info' | 'success' | 'warning' => {
  if (row.guaqiTag === 1) return 'warning';
  if (row.cosed === 1) return 'info';
  return 'primary' as any;
};

// 获取理赔状态文本（基于status字段）
const getClaimStatus = (status?: number) => {
  const statusMap: Record<number, string> = {
    1: '案件待定损',
    2: '已有定损表待对接',
    3: '已创建保司对接表待提交',
    4: '已提交保司待保司反馈',
    5: '已有保司反馈待客户确认',
    6: '客户协商已完成',
    7: '理赔付款完成',
    8: '已结案',
  };
  return statusMap[status ?? 0] || '-';
};

// 获取理赔状态对应的标签类型
const getClaimStatusType = (
  status?: number,
): 'danger' | 'info' | 'primary' | 'success' | 'warning' => {
  if (status === 1) return 'warning';
  if (status === 2) return 'primary';
  if ([3, 4].includes(status ?? 0)) return 'info';
  if (status === 5) return 'warning';
  if ([6, 7].includes(status ?? 0)) return 'success';
  if (status === 8) return 'info';
  return 'info';
};

// 解析异常类型标签
const parseExceptionTypes = (typeStr?: string) => {
  return caseStore.getExceptionLabels(typeStr);
};

// 解析挂起类型标签
const parseGuaqiTypes = (typeStr?: string) => {
  return caseStore.getSuspendLabels(typeStr);
};

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="案件列表">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #toolbar_buttons>
          <div class="flex flex-wrap items-center gap-2">
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :type="activeFilter === 'processing' ? 'primary' : ''"
              @click="handleQuickFilter('processing')"
            >
              我处理中
              <span
                class="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ processingCount }}
              </span>
            </ElButton>
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :type="activeFilter === 'participated' ? 'success' : ''"
              @click="handleQuickFilter('participated')"
            >
              我参与的
              <span
                class="ml-1 rounded-full bg-success px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ participatedCount }}
              </span>
            </ElButton>
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :type="activeFilter === 'pending' ? 'warning' : ''"
              @click="handleQuickFilter('pending')"
            >
              全部待处理
              <span
                class="ml-1 rounded-full bg-warning px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ pendingCount }}
              </span>
            </ElButton>
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :color="activeFilter === 'newCase' ? '#8b5cf6' : ''"
              :class="activeFilter === 'newCase' ? '!text-white' : ''"
              @click="handleQuickFilter('newCase')"
            >
              新创建案件
              <span
                class="ml-1 rounded-full bg-[#8b5cf6] px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ newCaseCount }}
              </span>
            </ElButton>
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :type="activeFilter === 'timeoutCase' ? 'danger' : ''"
              @click="handleQuickFilter('timeoutCase')"
            >
              未结案超时案件
              <span
                class="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ timeoutCaseCount }}
              </span>
            </ElButton>
            <ElButton
              :size="isMobile ? 'small' : 'default'"
              :loading="isExporting"
              type="primary"
              class="ml-4"
              @click="handleExportExcel"
            >
              导出 Excel
            </ElButton>
          </div>
        </template>

        <template #insureTypeDisplay="{ row }">
          <ElTooltip
            v-if="
              row.insureTypeDisplay &&
              row.insureTypeDisplay.split(',').length > 2
            "
            :content="row.insureTypeDisplay"
            placement="top"
          >
            <div class="w-full truncate">
              {{ row.insureTypeDisplay.split(',').slice(0, 2).join(',') }}...
            </div>
          </ElTooltip>
          <div v-else>{{ row.insureTypeDisplay || '-' }}</div>
        </template>
        <template #specialTagsDisplay="{ row }">
          <ElTooltip
            v-if="row.specialTags && row.specialTags.split(',').length > 2"
            :content="row.specialTags"
            placement="top"
          >
            <div class="w-full truncate">
              {{ row.specialTags.split(',').slice(0, 2).join(',') }}...
            </div>
          </ElTooltip>
          <div v-else>{{ row.specialTags || '-' }}</div>
        </template>
        <template #riderConnectStatusDisplay="{ row }">
          <ElTooltip
            v-if="
              row.peifuStatusText && row.peifuStatusText.split(',').length > 1
            "
            :content="row.peifuStatusText"
            placement="top"
          >
            <div class="w-full truncate">
              {{ row.peifuStatusText.split(',').slice(0, 1).join(',') }}...
            </div>
          </ElTooltip>
          <div v-else>{{ row.peifuStatusText || '-' }}</div>
        </template>
        <template #insureConnectStatusDisplay="{ row }">
          <ElTooltip
            v-if="
              row.commentStatusText &&
              row.commentStatusText.split(',').length > 1
            "
            :content="row.commentStatusText"
            placement="top"
          >
            <div class="w-full truncate">
              {{ row.commentStatusText.split(',').slice(0, 1).join(',') }}...
            </div>
          </ElTooltip>
          <div v-else>{{ row.commentStatusText || '-' }}</div>
        </template>
        <template #finalPaymentResultDisplay="{ row }">
          <ElTooltip
            v-if="row.finalPayText && row.finalPayText.split(']').length > 2"
            :content="row.finalPayText"
            placement="top"
          >
            <div class="w-full truncate">
              {{ row.finalPayText.split(']').slice(0, 1).join(']') }}]...
            </div>
          </ElTooltip>
          <div v-else>{{ row.finalPayText || '-' }}</div>
        </template>

        <template #status_merged="{ row }">
          <div class="flex-center flex items-center gap-1">
            <!-- 主状态标签 -->
            <ElTag :type="getMainStatusType(row)" size="small">
              {{ getMainStatus(row) }}
            </ElTag>

            <!-- 理赔状态标签 -->
            <ElTag :type="row.cosed === 1 ? 'info' : getClaimStatusType(row.status)" size="small">
              {{ row.cosed === 1 ? (row.closeReasonTag || row.closeReason || '已结案') : getClaimStatus(row.status) }}
            </ElTag>

            <!-- Tags Indicator (Popup) -->
            <ElPopover
              placement="top"
              title="状态详情"
              :width="300"
              trigger="hover"
            >
              <template #reference>
                <div class="flex cursor-pointer gap-1">
                  <!-- Show a small badge/icon if there are any tags -->
                  <div
                    v-if="
                      row.exceptionTag === 1 ||
                      row.guaqiTag === 1 ||
                      row.fengxianTag === 1 ||
                      row.cuibanTag === 1 ||
                      row.timeout === 1 ||
                      (row.alarmCount && row.alarmCount > 0) ||
                      (row.cuibanCount && row.cuibanCount > 0) ||
                      row.timoutTL === 1 ||
                      row.timoutTL === 2 ||
                      row.panding
                    "
                    class="flex cursor-pointer items-center"
                  >
                    <ElIcon class="text-red-500" size="16" color="#F56C6C">
                      <Warning />
                    </ElIcon>
                  </div>
                </div>
              </template>
              <div class="flex flex-col gap-2">
                <div v-if="row.exceptionTag === 1" class="flex justify-between">
                  <span class="font-bold">异常标签</span>
                  <div class="flex flex-wrap justify-end gap-1">
                    <ElTag
                      v-for="type in parseExceptionTypes(row.exceptionType)"
                      :key="type"
                      type="danger"
                      size="small"
                    >
                      {{ type }}
                    </ElTag>
                    <span v-if="!row.exceptionType">-</span>
                  </div>
                </div>
                <div v-if="row.guaqiTag === 1" class="flex justify-between">
                  <span class="font-bold">挂起标签</span>
                  <div class="flex flex-wrap justify-end gap-1">
                    <ElTag
                      v-for="type in parseGuaqiTypes(row.guaqiType)"
                      :key="type"
                      type="warning"
                      size="small"
                    >
                      {{ type }}
                    </ElTag>
                    <span v-if="!row.guaqiType">-</span>
                  </div>
                </div>
                <div v-if="row.fengxianTag === 1" class="flex justify-between">
                  <span class="font-bold">风险标签</span>
                  <ElTag type="danger">风险</ElTag>
                </div>
                <div
                  v-if="row.alarmCount && row.alarmCount > 0"
                  class="flex justify-between"
                >
                  <span class="font-bold">风险数量</span>
                  <ElTag type="danger">风险{{ row.alarmCount }}</ElTag>
                </div>
                <div v-if="row.cuibanTag === 1" class="flex justify-between">
                  <span class="font-bold">催办标签</span>
                  <ElTag type="warning">催办</ElTag>
                </div>
                <div
                  v-if="row.cuibanCount && row.cuibanCount > 0"
                  class="flex justify-between"
                >
                  <span class="font-bold">催办数量</span>
                  <ElTag type="warning">催办{{ row.cuibanCount }}</ElTag>
                </div>
                <div v-if="row.timeout === 1" class="flex justify-between">
                  <span class="font-bold">超时状态</span>
                  <ElTag type="danger">超时</ElTag>
                </div>
                <div
                  v-if="row.timoutTL === 1 || row.timoutTL === 2"
                  class="flex justify-between"
                >
                  <span class="font-bold">超时级别</span>
                  <ElTag v-if="row.timoutTL === 1" type="danger">已超时</ElTag>
                  <ElTag v-if="row.timoutTL === 2" type="danger" effect="dark"
                    >严重超时</ElTag
                  >
                </div>
                <!-- Special Judgment -->
                <div v-if="row.panding" class="flex justify-between">
                  <span class="font-bold">定损特殊判定</span>
                  <div class="flex flex-wrap justify-end gap-1">
                    <ElTag
                      v-for="label in caseStore.getSpecialJudgmentLabels(
                        row.panding,
                      )"
                      :key="label"
                      type="info"
                      size="small"
                    >
                      {{ label }}
                    </ElTag>
                  </div>
                </div>
              </div>
            </ElPopover>
          </div>
        </template>

        <template #status="{ row }">
          <ElText v-if="row.status === 1" type="warning"> 案件待定损 </ElText>
          <ElText v-else-if="row.status === 2" type="primary">
            已有定损表待对接
          </ElText>
          <ElText v-else-if="row.status === 3" type="info">
            已创建保司对接表待提交
          </ElText>
          <ElText v-else-if="row.status === 4" type="info">
            已提交保司待保司反馈
          </ElText>
          <ElText v-else-if="row.status === 5" type="warning">
            已有保司反馈待客户确认
          </ElText>
          <ElText v-else-if="row.status === 6" type="success">
            客户协商已完成
          </ElText>
          <ElText v-else-if="row.status === 7" type="success">
            理赔付款完成
          </ElText>
          <ElText v-else-if="row.status === 8" type="info"> 已结案 </ElText>
        </template>

        <template #operate="{ row }">
          <!-- 手机端：展开操作 -->
          <ElDropdown v-if="isMobile" trigger="click">
            <ElButton link type="primary" size="small">操作 ▾</ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem @click="detail(row.id)">查看</ElDropdownItem>
                <ElDropdownItem
                  v-if="
                    row.status !== 8 &&
                    !isClaimConnector &&
                    row.zeren === 7 &&
                    Number(row.owner) !== Number(userStore.userInfo?.id)
                  "
                  disabled
                  >立即处理（占用中）</ElDropdownItem
                >
                <ElDropdownItem
                  v-else-if="
                    row.status !== 8 &&
                    (!isClaimConnector ||
                      (row.zeren === 7 &&
                        Number(row.owner) === Number(userStore.userInfo?.id)))
                  "
                  @click="goHandle(row)"
                  >{{
                    row.zeren === 7 &&
                    Number(row.owner) === Number(userStore.userInfo?.id)
                      ? '继续处理'
                      : '立即处理'
                  }}</ElDropdownItem
                >
                <ElDropdownItem v-if="canTransfer && row.status !== 8" @click="openTransfer(row.id)"
                  >转派处理人</ElDropdownItem
                >
              </ElDropdownMenu>
            </template>
          </ElDropdown>

          <!-- PC端：平铺 -->
          <template v-else>
            <ElLink class="mr-2" type="primary" @click="detail(row.id)">
              查看
            </ElLink>

            <!-- Process Now Logic -->
            <ElTooltip
              v-if="
                row.status !== 8 &&
                !isClaimConnector &&
                row.zeren === 7 &&
                Number(row.owner) !== Number(userStore.userInfo?.id)
              "
              :content="`该案件正在由 ${row.usernameOwner || row.ownerName || '理赔员'} 负责操作，暂时无法操作。`"
              placement="top"
            >
              <ElLink class="mr-2" type="info" disabled> 立即处理 </ElLink>
            </ElTooltip>
            <ElLink
              v-else-if="
                row.status !== 8 &&
                (!isClaimConnector ||
                  (row.zeren === 7 &&
                    Number(row.owner) === Number(userStore.userInfo?.id)))
              "
              class="mr-2"
              type="primary"
              @click="goHandle(row)"
            >
              {{
                row.zeren === 7 &&
                Number(row.owner) === Number(userStore.userInfo?.id)
                  ? '继续处理'
                  : '立即处理'
              }}
            </ElLink>

            <!-- Transfer Handler (Admin Only) -->
            <ElLink
              v-if="canTransfer && row.status !== 8"
              class="mr-2"
              type="primary"
              @click="openTransfer(row.id)"
            >
              转派处理人
            </ElLink>
          </template>
        </template>
      </Grid>
    </div>

    <TransferHandlerModalComponent @success="handleReloadList" />
    <!-- <LogDrawer /> -->
    <!-- <CaseReopenModal @reload-list="handleReloadList" /> -->
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--month) {
  width: 100%;
}
</style>
