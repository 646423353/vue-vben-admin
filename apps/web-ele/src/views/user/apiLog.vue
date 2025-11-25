<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElLink, ElMessage, ElTag } from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { OrderListApi } from '#/api/core/order';
import { OpenLogListApi } from '#/api/core/out';
import { PolicyListApi } from '#/api/core/policy';

interface RowType {
  // 调用序列
  id?: number;
  // 应用id
  appid?: string;
  // 已返回代码
  codeRes?: string;
  // 请求时间
  created?: string;
  // 已返回消息
  messageRes?: string;
  // 请求类型
  methodType?: string;
  // aes key
  orderNo?: string;
  // pdf下载地址
  pdfUrl?: string;
  // 方案编号
  planId?: string;
  // 签名key
  policyNo?: string;
  // 产品编号
  productId?: string;
  // 投保状态 1投保成功 2调用成功保险公司返回错误 3接口调用错误
  status?: number;
  // 请求时间戳
  tms?: string;
  // 渠道账户id
  uid?: string;
  // 更新时间
  updated?: string;
  // 渠道账户
  username?: string;
  // uuid
  uuid?: string;
}

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'API调用序号', width: 150 },
    { field: 'username', title: '渠道账号名', width: 150 },
    { field: 'appid', title: '应用ID（渠道编号）', minWidth: 200 },
    {
      field: 'created',
      title: '请求时间',
      minWidth: 160,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    { field: 'methodType', title: '请求类型', minWidth: 200 },
    // { field: 'codeRes', title: '报文详情', minWidth: 300 },
    { field: 'tms', title: '时间戳', minWidth: 150 },
    { field: 'codeRes', title: '已返回代码', minWidth: 120 },
    { field: 'messageRes', title: '已返回信息', minWidth: 300 },
    {
      field: 'state',
      title: '传输状态',
      minWidth: 150,
      formatter: ({ row }) => {
        if (row.status === 1) {
          return '投保成功';
        }
        if (row.status === 2) {
          return '调用成功保险公司返回错误';
        }
        return '接口调用错误';
      },
    },
    {
      field: 'operation',
      title: '操作栏',
      width: 150,
      slots: { default: 'operation' },
      fixed: 'right',
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
  stripe: true,
  border: true,
  showOverflow: true,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        return await OpenLogListApi({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ gridOptions });

const [Modal, modalApi] = useVbenModal();
const orderList = ref<string[]>([]);
const policyList = ref<string[]>([]);
const isShowOrder = ref<boolean>(true);

const showOrder = async (uuid: string) => {
  const { list } = await OrderListApi(
    { orderSn: uuid },
    {
      page: 1,
      size: 100,
    },
  );

  orderList.value = list.map((item) => item.orderId);
  isShowOrder.value = true;
  modalApi.open();
};

const showPolicy = async (uuid: string) => {
  const { list } = await PolicyListApi(
    { orderComment: uuid },
    {
      page: 1,
      size: 100,
    },
  );

  policyList.value = list.map((item) => item.policyNo) || [];
  isShowOrder.value = false;
  modalApi.open();
};

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success('复制成功');
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
};
</script>

<template>
  <Page title="API调用记录">
    <div class="vp-raw w-full">
      <Grid>
        <template #operation="{ row }">
          <div v-if="row.methodType === 'order.accept'">
            <ElLink
              type="primary"
              size="small"
              class="mr-2"
              @click="showOrder(row.uuid)"
            >
              关联订单
            </ElLink>
            <ElLink type="primary" size="small" @click="showPolicy(row.uuid)">
              关联保单
            </ElLink>
          </div>
        </template>
      </Grid>
    </div>

    <Modal
      class="w-[400px]"
      :title="isShowOrder ? '关联订单' : '关联保单'"
      cancel-text="关闭"
      :show-confirm-button="false"
    >
      <!-- 订单列表 -->
      <div v-if="isShowOrder">
        <div v-if="orderList.length > 0" class="space-y-2">
          <div
            v-for="orderId in orderList"
            :key="orderId"
            class="flex items-center justify-between"
          >
            <span class="text-gray-700">订单号：</span>
            <ElTag
              type="primary"
              size="large"
              class="w-auto cursor-pointer px-3 py-2"
              @click="copyToClipboard(orderId)"
            >
              {{ orderId }}
            </ElTag>
          </div>
        </div>
        <div v-else class="py-4 text-center text-gray-500">暂无关联订单</div>
      </div>
      <!-- 保单列表 -->
      <div v-else>
        <div v-if="policyList.length > 0" class="space-y-2">
          <div
            v-for="policyNo in policyList"
            :key="policyNo"
            class="flex items-center justify-between"
          >
            <span class="text-gray-700">保单号：</span>
            <ElTag
              type="success"
              size="large"
              class="w-auto cursor-pointer px-3 py-2"
              @click="copyToClipboard(policyNo)"
            >
              {{ policyNo }}
            </ElTag>
          </div>
        </div>
        <div v-else class="py-4 text-center text-gray-500">暂无关联保单</div>
      </div>
    </Modal>
  </Page>
</template>
