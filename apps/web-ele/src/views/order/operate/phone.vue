<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { PhoneCustomerApi, PhoneDelApi, PhoneListApi } from '#/api/core/phone';

import phoneEditModal from '../components/PhoneEditModal.vue';

const router = useRouter();

const { closeCurrentTab } = useTabs();
const back = () => {
  closeCurrentTab();
  router.back();
};

interface Tag {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  customerInfo: {
    customerTags: Tag[];
    id: number;
    systemnum: string;
    tagsShow: string;
    username: string;
  };
}
interface AutoPhone {
  id: number;
  created: string;
  phone: string;
  type: number;
  user: string;
  customerList: Customer[];
}

const [PhoneEditModal, PhoneEditModalApi] = useVbenModal({
  connectedComponent: phoneEditModal,
  closeOnClickModal: false,
  draggable: true,
});

const editPhoneCustomer = (id: number, phone: string) => {
  PhoneEditModalApi.setData({ id, phone });
  PhoneEditModalApi.open();
};

const delPhone = (id: number) => {
  confirm({
    content: '确定要删除此投保手机号吗？',
    icon: 'warning',
  })
    .then(async () => {
      await PhoneDelApi(id);
      ElMessage.success('删除成功');
      handleReloadList();
    })
    .catch(() => {
      // 取消删除
    });
};

function openModal() {
  PhoneEditModalApi.setData({ id: '' });
  PhoneEditModalApi.open();
}

const phoneList = ref<AutoPhone[]>([]);
const currentPage = ref<number>(1);
const pageSize = ref<number>(5);
const total = ref<number>(0);

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getPhoneList();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getPhoneList();
};

const getCustomerList = async (id: number) => {
  const { list } = await PhoneCustomerApi({ id, page: 1, size: 100 });
  return list;
};

const getPhoneList = async () => {
  const { list, total: totalCount } = await PhoneListApi({
    page: currentPage.value,
    size: pageSize.value,
  });
  phoneList.value = list;
  phoneList.value.forEach(async (item) => {
    item.customerList = await getCustomerList(item.id);
    item.customerList.forEach((customer) => {
      if (customer.customerInfo.customerTags) {
        customer.customerInfo.tagsShow = customer.customerInfo.customerTags
          .map((tag) => tag.name)
          .join(',');
      }
    });
  });
  total.value = totalCount;
};

const handleReloadList = () => {
  currentPage.value = 1;
  getPhoneList();
};

onMounted(() => {
  getPhoneList();
});
</script>

<template>
  <Page title="管理自动投保手机号">
    <template #extra>
      <ElButton type="primary" @click="openModal">新建自动投保手机号</ElButton>
      <ElButton @click="back">关闭</ElButton>
    </template>

    <ElEmpty
      :image-size="200"
      v-if="total === 0"
      description="暂未添加自动投保手机号"
    />

    <ElCard class="mb-4" v-for="item in phoneList" :key="item.id">
      <template #header>
        <div class="flex items-center">
          <div class="flex">
            <span class="mr-2">自动投保手机号</span>
            <span class="mr-2">
              {{ item.type === 0 ? '河南平安' : '辽宁平安' }}
            </span>
            <span class="font-bold">{{ item.phone }}</span>
          </div>
          <div class="ml-auto">
            <ElButton
              type="primary"
              @click="editPhoneCustomer(item.id, item.phone)"
            >
              编辑
            </ElButton>
            <ElButton type="danger" @click="delPhone(item.id)">删除</ElButton>
          </div>
        </div>
      </template>

      <ElTable
        :data="item.customerList"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        class="rounded-md dark:border-gray-700 dark:bg-gray-800"
      >
        <ElTableColumn prop="id" label="ID." width="80" />
        <ElTableColumn
          prop="customerInfo.username"
          label="公司名称"
          min-width="200"
        />
        <ElTableColumn
          prop="customerInfo.tagsShow"
          label="公司分组"
          min-width="160"
        />
        <ElTableColumn
          prop="customerInfo.systemnum"
          label="统一信用代码"
          min-width="200"
        />
      </ElTable>
    </ElCard>

    <div class="flex justify-end pb-4 pt-6" v-if="total > 0">
      <ElPagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        :page-sizes="[5, 10]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <PhoneEditModal @reload-list="handleReloadList" />
  </Page>
</template>

<style scoped></style>
