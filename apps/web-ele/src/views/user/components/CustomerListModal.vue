<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElEmpty, ElTable, ElTableColumn, ElTag } from 'element-plus';
import moment from 'moment';

import { CustomerListApi } from '#/api/core/customer';

interface CustomerType {
  id: number;
  username: string;
  systemnum: string;
  created: string;
}

const customerList = ref<CustomerType[]>([]);
const tagName = ref('');
const loading = ref(false);

const [CustomerModal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      tagName.value = data.name || '';
      if (data.id) {
        await loadCustomerList(data.id);
      } else {
        customerList.value = [];
      }
    }
  },
  title: '绑定客户列表',
  showConfirmButton: false,
  cancelText: '关闭',
});

async function loadCustomerList(tagId: number) {
  loading.value = true;
  try {
    const res = await CustomerListApi(
      { tags: String(tagId) },
      {
        page: 1,
        size: 1000,
        withTag: 1,
        withStop: 0,
        withInsure: 0,
      },
    );
    customerList.value = res.list || [];
  } catch {
    customerList.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <CustomerModal class="w-[700px]">
    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">分组名称：</span>
          <ElTag type="primary" effect="plain">{{ tagName }}</ElTag>
        </div>
        <div class="text-sm text-gray-400">
          共
          <span class="font-medium text-gray-600">{{
            customerList.length
          }}</span>
          个客户
        </div>
      </div>

      <ElTable
        v-if="customerList.length > 0"
        :data="customerList"
        border
        stripe
        :max-height="400"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <ElTableColumn prop="id" label="ID" width="80" align="center" />
        <ElTableColumn
          prop="username"
          label="公司名称"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="systemnum"
          label="统一信用代码"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <span class="text-gray-500">
              {{
                row.created
                  ? moment(row.created).format('YYYY-MM-DD HH:mm:ss')
                  : '-'
              }}
            </span>
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-else class="py-6">
        <ElEmpty description="暂无绑定的客户" :image-size="80" />
      </div>
    </div>
  </CustomerModal>
</template>
