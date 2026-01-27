<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onActivated, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Warning } from '@element-plus/icons-vue';
import { useDebounceFn, useWindowSize } from '@vueuse/core';
import {
  ElButton,
  ElIcon,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElPopover,
  ElTag,
  ElText,
  ElTooltip,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseRecordListApi } from '#/api/core/case-record';
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
      component: 'Input',
      componentProps: {
        placeholder: '请输入理赔员',
        allowClear: true,
      },
      fieldName: 'owner',
      label: '理赔员',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入创建人',
        allowClear: true,
      },
      fieldName: 'userid',
      label: '创建人',
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
  resetButtonOptions: {},
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<CaseInfo> = {
  columns: [
    { field: 'id', title: '案件号', width: 120 },
    {
      field: 'guaqiType',
      title: '挂起标签',
      minWidth: 150,
      slots: { default: 'guaqiType' },
    },
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
      field: 'recentInsureConnect',
      title: '最近保司对接',
      formatter: () => '-',
      minWidth: 150,
    },
    {
      field: 'recentNegotiateConnect',
      title: '最近协商对接',
      formatter: () => '-',
      minWidth: 150,
    },
    {
      field: 'totalDamageAmount',
      title: '定损总额',
      formatter: () => '-',
      minWidth: 120,
    },
    {
      title: '操作',
      fixed: 'right',
      width: 280,
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
  toolbarConfig: {},
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
        const params = {
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
          status: undefined,
          type: 2,
        };

        // Construct groupInfo (body)
        // Clone formValues to avoid modifying original
        const groupInfo = { ...formValues };

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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: gridOptions as any,
});

// ... existing code ...

const canTransfer = hasAccessByRoles(['超级管理员', '管理员']);

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
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

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeCaseStatus(false);
  }
});

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

onActivated(() => {
  if (store.isUpdated) {
    gridApi.query();
    store.changeCaseStatus(false);
  }
});

// const [LogDrawer, logDrawerApi] = useVbenDrawer({
//   connectedComponent: logDrawer,
// });

onMounted(() => {
  caseStore.fetchExceptionReasons();
  caseStore.fetchSuspendReasons();
});

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
  // 优先级：挂起 > 结案 > 赔付状态 > 理赔中
  if (row.guaqiTag === 1) {
    return row.exceptionTag === 1 ? '异常案件挂起' : '挂起';
  }
  if (row.cosed === 1) {
    return '已结案';
  }
  if (row.status === 7) {
    return row.exceptionTag === 1 ? '异常案件赔付完成' : '赔付完成';
  }
  return row.exceptionTag === 1 ? '异常案件理赔中' : '理赔中';
};

// 计算主状态对应的标签类型
const getMainStatusType = (
  row: CaseInfo,
): 'danger' | 'info' | 'success' | 'warning' => {
  if (row.guaqiTag === 1) return 'warning';
  if (row.cosed === 1) return 'info';
  if (row.status === 7) return 'success';
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

const handleReleaseSuspend = (_row: CaseInfo) => {
  ElMessageBox.confirm('确定要解除该案件的挂起状态吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // TODO: 调用解除挂起API
      ElMessage.success('解除挂起成功');
      gridApi.reload();
    })
    .catch(() => {});
};
</script>

<template>
  <Page title="挂起案件列表">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #guaqiType="{ row }">
          <div class="flex-center flex gap-1">
            <ElTag
              v-for="type in parseGuaqiTypes(row.guaqiType)"
              :key="type"
              size="small"
              type="warning"
            >
              {{ type }}
            </ElTag>
            <span v-if="!row.guaqiType">-</span>
          </div>
        </template>

        <template #status_merged="{ row }">
          <div class="flex-center flex items-center gap-1">
            <!-- 主状态标签 -->
            <ElTag :type="getMainStatusType(row)" size="small">
              {{ getMainStatus(row) }}
            </ElTag>

            <!-- 理赔状态标签 -->
            <ElTag :type="getClaimStatusType(row.status)" size="small">
              {{ getClaimStatus(row.status) }}
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
                <!-- 风险数量 -->
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
                <!-- 催办数量 -->
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
                <!-- 超时级别 -->
                <div
                  v-if="row.timoutTL === 1 || row.timoutTL === 2"
                  class="flex justify-between"
                >
                  <span class="font-bold">超时级别</span>
                  <ElTag v-if="row.timoutTL === 1" type="danger">
                    已超时
                  </ElTag>
                  <ElTag v-if="row.timoutTL === 2" type="danger" effect="dark">
                    严重超时
                  </ElTag>
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
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            查看
          </ElLink>

          <!-- Process Now Logic -->
          <ElTooltip
            v-if="
              row.zeren === 7 &&
              Number(row.owner) !== Number(userStore.userInfo?.id)
            "
            :content="`该案件正在由 ${row.usernameOwner || row.ownerName || '理赔员'} 负责操作，暂时无法操作。`"
            placement="top"
          >
            <ElLink class="mr-2" type="info" disabled> 立即处理 </ElLink>
          </ElTooltip>
          <ElLink
            v-else-if="row.status !== 8"
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
            v-if="canTransfer"
            class="mr-2"
            type="primary"
            @click="openTransfer(row.id)"
          >
            转派处理人
          </ElLink>

          <ElLink
            class="mr-2"
            type="primary"
            @click="handleReleaseSuspend(row)"
          >
            解除挂起
          </ElLink>
          <!-- 
          <ElLink
            v-if="row.status === 7 || row.status === 8"
            class="mr-2"
            type="primary"
            @click="reopen(row.id)"
          >
            重开
          </ElLink>

          <ElLink class="ml-2" type="primary" @click="openLog(row.id)">
            日志
          </ElLink> -->
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
