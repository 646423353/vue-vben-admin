<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { ElButton, ElCard, ElMessage, ElText } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderMembersApi } from '#/api/core/order';
import { PolicyBBRGetApi } from '#/api/core/policy';
import { formatIdCard } from '#/utils/formatIDCardUtils';

export interface MemeberParams {
  id?: string;
  bxbm?: string;
  comment?: string;
  comment2?: string;
  creditcard?: string;
  idNum?: string;
  stopName?: string;
  username?: string;
  beginTime: string;
  endTime: string;
  statusPerson: number;
}

interface Props {
  orderId?: number | string;
  policyId?: number | string;
  insureTime?: Date | number | string;
}

const props = defineProps<Props>();

const emit = defineEmits(['calcPayment']);

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
        allowClear: true,
      },
      fieldName: 'name',
      label: '姓名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入身份证',
        allowClear: true,
      },
      fieldName: 'card',
      label: '身份证',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnEnter: false,
};

const totalValue = ref(0);

const gridOptions: VxeGridProps<MemeberParams> = {
  columns: [
    { field: 'username', title: '姓名', minWidth: 120 },
    { field: 'cardtype', title: '证件类型', minWidth: 120 },
    {
      field: 'creditcard',
      title: '证件号',
      minWidth: 150,
      formatter: ({ row }) => formatIdCard(row.creditcard!!),
    },
  ],
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  showOverflow: true,
  height: 500,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        if (props.policyId) {
          const { list, total } = await PolicyBBRGetApi({
            id: props.policyId,
            page: page.currentPage,
            size: page.pageSize,
            name: formValues.name,
            card: formValues.card,
          });

          if (!formValues.name && !formValues.card) {
            totalValue.value = total;
          }
          return { list, total };
        } else {
          if (!props.orderId) return;
          const { list, total } = await OrderMembersApi(
            {
              ...formValues,
              orderId: props.orderId,
              insureTime: props.insureTime
                ? moment(props.insureTime).valueOf()
                : undefined,
            },
            {
              page: page.currentPage,
              size: page.pageSize,
            },
          );
          totalValue.value = total;
          emit('calcPayment', totalValue.value);
          list.forEach((item) => (item.cardtype = '身份证'));
          return { list, total };
        }
      },
    },
  },
};

const [Grid, gridApi] =
  props.policyId === undefined
    ? useVbenVxeGrid({ gridOptions })
    : useVbenVxeGrid({ formOptions, gridOptions } as any);

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    const errMap = await $grid.fullValidate(true);
    if (errMap) {
      return false;
    }
  }
}

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getTableData().fullData;
  }
};

const loadMembers = async () => {
  if (!props.orderId) return;
  if (!props.insureTime) return ElMessage.error('请选择保险时间');
  gridApi.query();
};

defineExpose({
  totalValue,
  fullValidEvent,
  getData,
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          被保人 <span class="mr-4">({{ totalValue }})</span>
          <ElButton type="primary" @click="loadMembers" v-if="!props.policyId">
            载入订单当前在保人员名单（含增员待生效,不含减员待生效）
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
    </Grid>
  </ElCard>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}
</style>
