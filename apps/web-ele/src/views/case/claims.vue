<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseApi } from '#/api/core/case';

import { onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { ElButton, ElLink, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseListApi } from '#/api/core/case';
import { CustomerListApi } from '#/api/core/customer';
import { InsureListApi } from '#/api/core/insure';
import { useCaseStore } from '#/store/case';

import caseReopenModal from './components/CaseReopenModal.vue';
import logDrawer from './components/LogDrawer.vue';

type CaseInfo = CaseApi.PageData & {
  insureType: number;
  lipeiPerson: number;
  status: number;
  zeren: number;
};

const router = useRouter();

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
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请输入案件状态',
        allowClear: true,
        options: [
          { label: '理赔待处理', value: 2 },
          { label: '保险公司定损', value: 3 },
          { label: '待诉讼', value: 4 },
          { label: '诉讼', value: 5 },
          { label: '协议文件', value: 6 },
          { label: '公司盖章', value: 7 },
          { label: '待打款', value: 8 },
          { label: '资料搜集', value: 9 },
          { label: '待骑手提供资料', value: 10 },
          { label: '劳动仲裁', value: 11 },
          { label: '死亡案件', value: 12 },
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
      formItemClass: 'col-span-2',
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
      formItemClass: 'col-span-2',
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  showCollapseButton: true,
  collapsedRows: 3,
  collapsed: true,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<CaseInfo> = {
  columns: [
    { field: 'id', title: '案件号', width: 120 },
    { field: 'companyName', title: '所属公司', minWidth: 160 },
    { field: 'name', title: '出险人(骑手)', minWidth: 120 },
    { field: 'creditcard', title: '骑手身份证号码', minWidth: 160 },
    { field: 'phone', title: '骑手手机号', minWidth: 120 },
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
      field: 'status',
      title: '案件状态',
      slots: { default: 'status' },
      minWidth: 120,
    },
    { field: 'stopName', title: '所属站点', minWidth: 150 },
    { field: 'stopOwnerName', title: '站长姓名', minWidth: 120 },
    { field: 'stopOwnerPhone', title: '站长手机号', minWidth: 120 },
    {
      field: 'zeren',
      title: '责任判定',
      formatter: ({ row }) =>
        row.zeren === 1
          ? '全责'
          : row.zeren === 2
            ? '主责'
            : row.zeren === 3
              ? '次责'
              : row.zeren === 4
                ? '同责'
                : row.zeren === 5
                  ? '无责'
                  : row.zeren === 6
                    ? '摔伤'
                    : '',
      minWidth: 120,
    },
    { field: 'usernameOwner', title: '理赔员', minWidth: 150 },
    { field: 'username', title: '创建人', minWidth: 150 },
    {
      field: 'lipeiPerson',
      title: '赔偿对象',
      formatter: ({ row }) =>
        row.lipeiPerson === 0
          ? '骑手'
          : row.lipeiPerson === 1
            ? '公司'
            : row.lipeiPerson === 2
              ? '三者'
              : '',
      minWidth: 150,
    },
    {
      field: 'insureType',
      title: '出险类型',
      formatter: ({ row }) =>
        row.insureType === 1
          ? '自身受伤'
          : row.insureType === 2
            ? '三者受伤'
            : row.insureType === 3
              ? '三者物损'
              : '',
      minWidth: 150,
    },
    { field: 'insuredMainName', title: '主险方案', minWidth: 120 },
    { field: 'insuredAttachName', title: '附加险方案', minWidth: 120 },
    {
      field: 'addr',
      title: '事故区域',
      formatter: ({ row }) =>
        row.province ? `${row.province} / ${row.city} / ${row.district}` : '',
      minWidth: 180,
    },
    { field: 'address', title: '事故地址', minWidth: 300 },
    { field: 'details', title: '事故概况', minWidth: 300 },
    {
      field: 'created',
      showOverflow: true,
      title: '创建时间',
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
      minWidth: 140,
    },
    { field: 'moneyMain', title: '主险赔付金额', minWidth: 120 },
    { field: 'moneryAttach', title: '附加险赔付金额', minWidth: 120 },
    { field: 'moneyDianfu', title: '垫付金额', minWidth: 120 },
    // {
    //   field: 'updateTime',
    //   showOverflow: true,
    //   title: '首次联系时间',
    //   formatter: ({ row }) =>
    //     row.updateTime
    //       ? moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
    //       : '',
    //   minWidth: 150,
    // },
    // { field: 'addiInsure2', title: '滞留时间', minWidth: 120 },
    {
      field: 'updateTime1',
      showOverflow: true,
      title: '结案时间',
      formatter: ({ row }) =>
        row.closeTime
          ? moment(row.closeTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      minWidth: 150,
    },
    { field: 'policyNo', title: '主险保单号', minWidth: 120 },
    { field: 'casenoInsuredMain', title: '主险报案号', minWidth: 120 },
    { field: 'policyNoAttach', title: '附加险保单号', minWidth: 120 },
    { field: 'casenoInsuredAttach', title: '附加险报案号', minWidth: 120 },
    // { field: 'addiInsure4', title: '审核被拒原因', minWidth: 150 },
    {
      title: '操作',
      fixed: 'right',
      width: 165,
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
      query: async ({ page }, formValues) => {
        return await CaseListApi(
          {
            ...formValues,
            status: formValues.status ?? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          {
            page: page.currentPage,
            size: page.pageSize,
            beginTime: formValues.creatRangerDate?.[0]
              ? moment(formValues.creatRangerDate?.[0]).valueOf()
              : '',
            endTime: formValues.creatRangerDate?.[1]
              ? moment(formValues.creatRangerDate?.[1]).valueOf()
              : '',
            anjianBeginTime: formValues.caseRangerDate?.[0]
              ? moment(formValues.caseRangerDate?.[0]).valueOf()
              : '',
            anjianEndTime: formValues.caseRangerDate?.[1]
              ? moment(formValues.caseRangerDate?.[1]).valueOf()
              : '',
          },
        );
      },
    },
  },
};

const store = useCaseStore();

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  gridApi.setGridOptions({
    maxHeight: height.value - 210,
  });
}
resize();

const detail = (id: number) => {
  router.push(`/case/detail?id=${id}`);
};

const goHandle = (id: number) => {
  router.push(`/case/handle?id=${id}`);
};

const goCreate = () => {
  router.push('/case/edit');
};

const editCustomer = (id: number) => {
  router.push(`/case/edit?id=${id}`);
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

const [LogDrawer, logDrawerApi] = useVbenDrawer({
  connectedComponent: logDrawer,
});

const [CaseReopenModal, CaseReopenModalApi] = useVbenModal({
  connectedComponent: caseReopenModal,
  closeOnClickModal: false,
  draggable: true,
});

const reopen = (id: number) => {
  CaseReopenModalApi.setData({ id });
  CaseReopenModalApi.open();
};

function openLog(id: number) {
  logDrawerApi.setData({ id });
  logDrawerApi.open();
}

const handleReloadList = () => {
  gridApi.query();
};
</script>

<template>
  <Page title="理赔员待处理">
    <template #extra>
      <ElButton type="primary" @click="goCreate">新建</ElButton>
    </template>

    <div class="vp-raw w-full">
      <Grid>
        <template #status="{ row }">
          <ElText v-if="row.status === 0" type="info"> 注销 </ElText>
          <ElText v-else-if="row.status === 1" type="info"> 结案 </ElText>
          <ElText v-else-if="row.status === 2" type="warning">
            理赔待处理
          </ElText>
          <ElText v-else-if="row.status === 3" style="color: pink">
            保险公司定损
          </ElText>
          <ElText v-else-if="row.status === 4" style="color: #f56c6c">
            待诉讼
          </ElText>
          <ElText v-else-if="row.status === 5" type="danger"> 诉讼 </ElText>
          <ElText v-else-if="row.status === 6" style="color: yellow">
            协议文件
          </ElText>
          <ElText v-else-if="row.status === 7" style="color: green">
            公司盖章
          </ElText>
          <ElText v-else-if="row.status === 8" type="primary"> 待打款 </ElText>
          <ElText v-else-if="row.status === 9" style="color: purple">
            资料搜集
          </ElText>
          <ElText v-else-if="row.status === 10" style="color: orange">
            待骑手提供资料
          </ElText>
          <ElText v-else-if="row.status === 11" style="color: blue">
            劳动仲裁
          </ElText>
          <ElText v-else-if="row.status === 12" type="danger">
            死亡案件
          </ElText>
        </template>

        <template #operate="{ row }">
          <ElLink class="mr-2" type="primary" @click="detail(row.id)">
            详情
          </ElLink>
          <ElLink
            v-if="row.status === 0 || row.status === 1"
            class="mr-2"
            type="primary"
            @click="reopen(row.id)"
          >
            重开
          </ElLink>
          <span v-else>
            <ElLink class="mr-2" type="primary" @click="editCustomer(row.id)">
              编辑
            </ElLink>
            <ElLink class="mr-2" type="primary" @click="goHandle(row.id)">
              处理
            </ElLink>
          </span>
          <ElLink type="primary" @click="openLog(row.id)"> 日志 </ElLink>
        </template>
      </Grid>
    </div>

    <LogDrawer />
    <CaseReopenModal @reload-list="handleReloadList" />
  </Page>
</template>

<style scoped>
:deep(.el-date-editor--month) {
  width: 100%;
}
</style>
