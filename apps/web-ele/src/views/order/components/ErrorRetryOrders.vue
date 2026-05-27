<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElCard,
  ElLink,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElText,
} from 'element-plus';
import moment from 'moment';

import { TaskPostListApi } from '#/api/core/task';

interface Props {
  orderId: number | string;
}

const props = defineProps<Props>();
const router = useRouter();

const loading = ref(false);
const buTouList = ref<any[]>([]);

const getBuTouOrders = async () => {
  if (!props.orderId) return;
  loading.value = true;
  try {
    const { list } = await TaskPostListApi({
      orderId: String(props.orderId),
      page: 1,
      size: 100, // 自动投保记录单页记录一般不超过100
    });

    // 过滤出已经进行错单补投的记录
    buTouList.value =
      list && Array.isArray(list)
        ? list.filter((item: any) => item.hasBuTou === 1 && item.buTouOrderNo)
        : [];
  } catch (error) {
    console.error('获取关联错单补投订单失败:', error);
    ElMessage.error('获取关联错单补投订单失败');
  } finally {
    loading.value = false;
  }
};

const goOrderDetail = (orderNo: string) => {
  router.push(`/order/detail?id=${orderNo}`);
};

const formatDateTime = (dateTime: any) => {
  if (!dateTime) return '无';
  // 检查是否是时间戳
  const timestamp = Number(dateTime);
  if (!Number.isNaN(timestamp)) {
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  }
  return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

onMounted(() => {
  getBuTouOrders();
});
</script>

<template>
  <ElCard class="mb-4">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-base font-bold text-gray-800 dark:text-gray-100"
          >关联的错单补投订单</span
        >
      </div>
    </template>

    <div class="vp-raw w-full">
      <ElTable
        v-loading="loading"
        :data="buTouList"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        class="rounded-md dark:border-gray-700 dark:bg-gray-800"
      >
        <ElTableColumn
          prop="uuid"
          label="关联的失败名义保单系统编号"
          min-width="220"
          align="center"
        >
          <template #default="{ row }">
            <span
              class="select-all font-mono text-xs text-gray-600 dark:text-gray-400"
            >
              {{ row.uuid || '无' }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="buTouOrderNo"
          label="订单号"
          min-width="180"
          align="center"
        >
          <template #default="{ row }">
            <ElLink
              type="primary"
              underline="always"
              @click="goOrderDetail(row.buTouOrderNo)"
            >
              {{ row.buTouOrderNo }}
            </ElLink>
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="tbr"
          label="投保人"
          min-width="150"
          align="center"
        />

        <ElTableColumn prop="num" label="人数" min-width="90" align="center" />

        <ElTableColumn
          prop="beginTime"
          label="起保时间"
          min-width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.beginTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="endTime"
          label="终保时间"
          min-width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="policy.bxfa"
          label="险种方案"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            {{ row.policy?.bxfa || '暂无方案' }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="policy.type"
          label="险种类型"
          min-width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row.policy?.type === 0 ? '主险' : '附加险' }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="created"
          label="补投操作时间"
          min-width="170"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.created) }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          prop="buTouStatus"
          label="状态"
          min-width="120"
          align="center"
        >
          <template #default="{ row }">
            <ElText
              v-if="row.buTouStatus === 2"
              type="success"
              class="font-bold"
            >
              投保成功
            </ElText>
            <ElText
              v-else-if="row.buTouStatus === 3"
              type="danger"
              class="font-bold"
            >
              投保失败
            </ElText>
            <ElText v-else type="warning"> 投保中 </ElText>
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="保单下载"
          min-width="140"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <ElLink
              v-if="row.buTouStatus === 2 && row.buTouPdf"
              type="success"
              underline="always"
              :href="row.buTouPdf"
              target="_blank"
            >
              下载补投保单
            </ElLink>
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElCard>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}
</style>
