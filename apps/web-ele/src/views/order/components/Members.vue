<script lang="ts" setup>
import type { OrderForm } from '../operate/detail.vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserIdStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElText,
} from 'element-plus';
import { saveAs } from 'file-saver';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  MembersExportApi,
  OrderMembersApi,
  OrderMembersStatusApi,
  OrderUpdateApi,
} from '#/api/core/order';
import { formatIdCard } from '#/utils/formatIDCardUtils';
import { extractTextFromRichText } from '#/utils/formmatRichText';
import { checkSettlementTime } from '#/utils/timeCheck';

import modal from './Modal.vue';

export interface PlanParams {
  id?: string;
  保险编码: string;
  备注1: string;
  备注2: string;
  身份证: string;
  姓名: string;
  所属站点名称: string;
  骑手编号: string;
  username?: string;
  beginTime: string;
  endTime: string;
  statusPerson: number;
  creditcard: string;
}

interface Props {
  orderId?: string;
  locationtype: number | string;
  insureSn?: string | undefined;
  orderInfo?: OrderForm;
}

const props = defineProps<Props>();
const useridStore = useUserIdStore();

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
        allowClear: true,
      },
      fieldName: 'username',
      label: '姓名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入身份证',
        allowClear: true,
      },
      fieldName: 'creditcard',
      label: '身份证',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<PlanParams> = {
  columns: [
    { field: '姓名*', title: '姓名', minWidth: 120 },
    {
      field: '身份证*',
      title: '身份证',
      minWidth: 180,
      visible: props.orderId === undefined,
    },
    {
      field: 'creditcard',
      title: '身份证',
      minWidth: 150,
      formatter: ({ row }) => formatIdCard(row.creditcard),
      visible: props.orderId !== undefined,
    },
    { field: '保险编码*', title: '保险编码', minWidth: 180 },
    {
      field: 'statusPerson',
      title: '状态',
      minWidth: 140,
      visible: props.orderId !== undefined,
      slots: { default: 'status' },
    },
    {
      field: 'beginTime',
      title: '起保日期',
      minWidth: 120,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        row.beginTime && row.statusPerson !== 5
          ? moment(row.beginTime).format('YYYY-MM-DD')
          : '',
    },
    {
      field: 'endTime',
      title: '终保日期',
      minWidth: 120,
      visible: props.orderId !== undefined,
      formatter: ({ row }) =>
        row.endTime && row.statusPerson !== 5
          ? moment(row.endTime).format('YYYY-MM-DD')
          : '',
    },
    { field: '所属站点名称', title: '所属站点名称', minWidth: 180 },
    { field: '骑手编号', title: '骑手编号', minWidth: 180 },
    { field: '备注1', title: '备注1', minWidth: 180 },
    { field: '备注2', title: '备注2', minWidth: 180 },
    {
      field: 'action',
      title: '操作',
      minWidth: 100,
      visible: props.orderId !== undefined,
      fixed: 'right',
      slots: { default: 'operate' },
    },
  ],
  editRules: {
    姓名: [
      { required: true, message: '姓名不能为空' },
      {
        validator({ cellValue }) {
          if (!/^[\u4E00-\u9FA5·]{2,16}$/.test(cellValue)) {
            return new Error('姓名格式不正确');
          }
        },
      },
    ],
    身份证: [
      { required: true, message: '身份证不能为空' },
      {
        validator({ cellValue }) {
          if (
            !/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[12]\d|30|31)\d{3}[\dX]$/i.test(
              cellValue,
            )
          ) {
            return new Error('身份证格式不正确');
          }
        },
      },
    ],
    保险编码: [
      { required: true, message: '保险编码不能为空' },
      {
        validator({ cellValue }) {
          if (cellValue !== props.insureSn) {
            return new Error('保险编码与所选保险编码不一致');
          }
        },
      },
    ],
  },
  validConfig: {
    msgMode: 'full',
  },
  pagerConfig: {
    enabled: props.orderId !== undefined,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  showOverflow: true,
  height: 500,
  importConfig: {
    afterImportMethod: async ({ $table }) => {
      const data = $table.getFullData();
      data.forEach((item) => {
        item['姓名*'] = extractTextFromRichText(item['姓名*']);
        item['身份证*'] = extractTextFromRichText(item['身份证*']);
        item['保险编码*'] = extractTextFromRichText(item['保险编码*']);
        item.所属站点名称 = extractTextFromRichText(item.所属站点名称);
        item.骑手编号 = extractTextFromRichText(item.骑手编号);
        item.备注1 = extractTextFromRichText(item.备注1);
        item.备注2 = extractTextFromRichText(item.备注2);
      });
      fullValidEvent();
    },
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        if (!props.orderId)
          return {
            list: [
              {
                '姓名*': '模板-张三',
                '身份证*': '1234567890*****',
                '保险编码*': '1234567890',
                所属站点名称: '站点1',
                骑手编号: '88888888',
                备注1: '备注1',
                备注2: '备注2',
              },
            ],
            total: 0,
          };
        const { list, total } = await OrderMembersApi(
          {
            iscurrent: 1,
            orderId: props.orderId,
            ...formValues,
          },
          {
            page: page.currentPage,
            size: page.pageSize,
          },
        );
        const membersData = list.map((item) => {
          return {
            '姓名*': item.username,
            '身份证*': item.creditcard,
            '保险编码*': item.bxbm,
            备注1: item.comment,
            备注2: item.comment2,
            所属站点名称: item.stopName,
            骑手编号: item.idNum,
            ...item,
          };
        });
        return { list: membersData, total };
      },
    },
  },
};

const [Grid, gridApi] =
  props.orderId === undefined
    ? useVbenVxeGrid({ gridOptions })
    : useVbenVxeGrid({ formOptions, gridOptions });

const exportEvent = () => {
  const path = import.meta.env.VITE_GLOB_API_URL;
  const url = import.meta.env.VITE_PERSON_TEMPLATE_URL;
  saveAs(`${path}${url}`, '人员清单模板.xlsx');
};

const importEvent = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    $grid.importData({
      types: ['xlsx', 'xls'],
    });
  }
};

const dataLength = ref(0);

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    dataLength.value = $grid.getFullData().length;
    const errMap = await $grid.fullValidate(true);
    if (errMap) {
      return false;
    }
  }
}

const [Modal, modalApi] = useVbenModal({
  connectedComponent: modal,
  closeOnClickModal: false,
  draggable: true,
});

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getTableData().fullData;
  }
};

async function openModal() {
  // 检查是否在结算时间段内
  if (await checkSettlementTime()) {
    return; // 如果在结算时间段内，则不执行后续操作
  }

  modalApi.setData({
    id: props.orderId,
  });
  modalApi.open();
}

const handleMember = async (row: PlanParams, operateTag: number) => {
  // 检查是否在结算时间段内
  if (await checkSettlementTime()) {
    return; // 如果在结算时间段内，则不执行后续操作
  }

  const modalTitle =
    operateTag === 2 ? '减员' : operateTag === 3 ? '撤销增员' : '撤销减员';
  ElMessageBox.confirm(
    '注意：删除后无法在后台查询，如果需要恢复请联系技术',
    `确认${modalTitle}【${row.username}】`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    await OrderUpdateApi({
      id: Number(props.orderId),
      consignTime: props.orderInfo?.consignTime,
      memberDtos: [
        {
          id: Number(row.id),
          operateTag,
          username: row['姓名'],
          bxbm: row['保险编码'],
          creditcard: row['身份证'],
          stopName: row['所属站点名称'],
          idNum: row['骑手编号'],
          comment: row['备注1'],
          comment2: row['备注2'],
          userid: useridStore.userId as number,
        },
      ],
    });
    gridApi.reload();
    ElMessage.success('删除成功');
  });
};

defineExpose({
  fullValidEvent,
  getData,
});

const handleReloadList = () => {
  gridApi.query();
};

const btnLoading = ref(false);
const handleExport = async () => {
  try {
    btnLoading.value = true;
    const exportUrl = await MembersExportApi({
      orderId: props.orderId,
      iscurrent: 1,
    });
    window.open(exportUrl, '_blank');
  } catch (error) {
    console.error(error);
  } finally {
    btnLoading.value = false;
  }
};

const peoplecountShow = ref(0);
const status2Show = ref(0);
const status3Show = ref(0);
const status4Show = ref(0);

const getMembersStatus = async () => {
  if (!props.orderId) return;
  const { peoplecount, status2, status3, status4 } =
    await OrderMembersStatusApi(props.orderId);
  peoplecountShow.value = peoplecount;
  status2Show.value = status2;
  status3Show.value = status3;
  status4Show.value = status4;
};

onMounted(async () => {
  watch(
    () => props.orderId,
    (newOrderId) => {
      if (newOrderId) {
        getMembersStatus();
      }
    },
    { immediate: true },
  );

  if (props.orderId) await getMembersStatus();
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div class="mb-2 flex items-center">
            <span class="mr-4 font-medium">人员清单</span>
            <div v-if="!props.orderId">
              <span>({{ dataLength }})</span>
            </div>
          </div>
          <div v-if="props.orderId" class="flex flex-wrap gap-2">
            <ElText type="success" size="large" class="flex items-center gap-1">
              <span>在保</span>
              <span class="font-bold">{{ status2Show }}</span>
            </ElText>
            <ElText type="primary" size="large" class="flex items-center gap-1">
              <span>等待增员生效</span>
              <span class="font-bold">{{ peoplecountShow }}</span>
            </ElText>
            <ElText type="danger" size="large" class="flex items-center gap-1">
              <span>等待减员生效</span>
              <span class="font-bold">{{ status3Show }}</span>
            </ElText>
            <ElText type="warning" size="large" class="flex items-center gap-1">
              <span>已减员</span>
              <span class="font-bold">{{ status4Show }}</span>
            </ElText>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <ElButton
            v-if="!props.orderId"
            :disabled="!props.locationtype"
            type="primary"
            @click="importEvent"
          >
            导入
          </ElButton>
          <ElButton v-if="!props.orderId" @click="exportEvent">
            下载模板
          </ElButton>
          <ElButton v-if="props.orderId" type="primary" @click="openModal">
            增员
          </ElButton>
          <ElButton
            v-if="props.orderId"
            :loading="btnLoading"
            type="primary"
            @click="handleExport"
          >
            导出人员清单
          </ElButton>
        </div>
      </div>
    </template>

    <Grid>
      <template #status="{ row }">
        <ElText v-if="row.statusPerson === 1" type="primary">
          等待增员生效
        </ElText>
        <ElText v-else-if="row.statusPerson === 2" type="success">
          在保
        </ElText>
        <ElText v-else-if="row.statusPerson === 3" type="warning">
          在保 等待减员生效
        </ElText>
        <ElText v-else-if="row.statusPerson === 4" type="danger">
          不在保
        </ElText>
        <ElText v-else-if="row.statusPerson === 5" type="danger">
          不在保 起保前删除
        </ElText>
        <ElText v-else type="success">已增员</ElText>
      </template>

      <template #operate="{ row }">
        <ElLink
          v-if="row.statusPerson === 1"
          class="mr-2"
          type="primary"
          @click="handleMember(row, 3)"
        >
          撤销增员
        </ElLink>
        <ElLink
          v-if="row.statusPerson === 2"
          class="mr-2"
          type="primary"
          @click="handleMember(row, 2)"
        >
          减员
        </ElLink>
        <ElLink
          v-if="row.statusPerson === 3"
          class="mr-2"
          type="primary"
          @click="handleMember(row, 4)"
        >
          撤销减员
        </ElLink>
      </template>
    </Grid>
  </ElCard>

  <Modal
    v-if="props.orderId"
    :order-info="props.orderInfo"
    @reload-list="handleReloadList"
  />
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}
</style>
