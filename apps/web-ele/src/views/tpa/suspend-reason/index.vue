<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElMessage,
  ElMessageBox,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import moment from 'moment';

// import { CaseSetApi } from '#/api/core/case-set';
import { CaseSuspendApi } from '#/api/core/case-suspend';

import SuspendReasonModal from './SuspendReasonModal.vue';

const tableData = ref<CaseSuspendApi.SuspendSettingGuaqiType[]>([]);
const loading = ref(false);

const [Modal, modalApi] = useVbenModal({
  connectedComponent: SuspendReasonModal,
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await CaseSuspendApi.getSuspendReasonList();
    tableData.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  modalApi.setData(undefined);
  modalApi.open();
};

const handleEdit = (row: CaseSuspendApi.SuspendSettingGuaqiType) => {
  modalApi.setData(row);
  modalApi.open();
};

const handleDelete = async (row: CaseSuspendApi.SuspendSettingGuaqiType) => {
  try {
    await ElMessageBox.confirm('确认停用该挂起原因吗？', '提示', {
      type: 'warning',
    });
    await CaseSuspendApi.delSuspendReason({ id: row.id! });
    ElMessage.success('停用成功');
    getList();
  } catch (error) {
    console.error(error);
  }
};

const handleEnable = async (row: CaseSuspendApi.SuspendSettingGuaqiType) => {
  try {
    await ElMessageBox.confirm('确认启用该挂起原因吗？', '提示', {
      type: 'success',
    });
    await CaseSuspendApi.updateSuspendReason({
      id: row.id,
      status: 1,
    });
    ElMessage.success('启用成功');
    getList();
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  getList();
});
</script>

<template>
  <Page title="挂起原因管理">
    <ElCard class="!rounded-lg border-none shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">挂起原因列表</span>
          <ElButton type="primary" @click="handleAdd"> 新增挂起原因 </ElButton>
        </div>
      </template>
      <ElTable :data="tableData" border stripe v-loading="loading">
        <ElTableColumn label="ID" prop="id" width="80" />
        <ElTableColumn label="挂起原因名称" prop="title" min-width="150" />
        <ElTableColumn label="备注" prop="comments" min-width="200" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">
            {{
              row.created
                ? moment(Number(row.created)).format('YYYY-MM-DD HH:mm:ss')
                : '-'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="handleEdit(row)">
              编辑
            </ElButton>
            <ElButton
              v-if="row.status === 1"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              停用
            </ElButton>
            <ElButton v-else link type="success" @click="handleEnable(row)">
              启用
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <Modal @success="getList" />
  </Page>
</template>
