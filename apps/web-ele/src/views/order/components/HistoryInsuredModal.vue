<script lang="ts" setup>
import type { CustomerApi } from '#/api/core/customer';

import { ref, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElMessage,
  ElPagination,
  ElTag,
} from 'element-plus';

import { CustomerInsuredListApi } from '#/api/core/customer';

// ─── Props / Emits ──────────────────────────────────────
const props = defineProps<{
  /** 当前客户 ID */
  customerId: number | string;
  /** 是否展示弹窗 */
  visible: boolean;
}>();

const emit = defineEmits<{
  /** 用户选中某条历史投保人 */
  (e: 'select', insured: CustomerApi.HistoryInsured): void;
  /** 关闭弹窗 */
  (e: 'update:visible', val: boolean): void;
}>();

// ─── 响应式状态 ──────────────────────────────────────────
const loading = ref(false);
const list = ref<CustomerApi.HistoryInsured[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;

// ─── 获取列表 ─────────────────────────────────────────────
const fetchList = async () => {
  if (!props.customerId) return;
  loading.value = true;
  try {
    const res = await CustomerInsuredListApi({
      customerId: props.customerId,
      page: page.value,
      size: pageSize,
    });
    list.value = (res.list ?? []) as CustomerApi.HistoryInsured[];
    total.value = res.total ?? 0;
  } catch {
    ElMessage.error('获取历史投保人列表失败');
  } finally {
    loading.value = false;
  }
};

// ─── 弹窗打开时自动拉取数据 ──────────────────────────────
watch(
  () => props.visible,
  (val) => {
    if (val) {
      page.value = 1;
      fetchList();
    }
  },
);

// ─── 关闭弹窗 ─────────────────────────────────────────────
const close = () => {
  emit('update:visible', false);
};

// ─── 选中某条记录 ─────────────────────────────────────────
const handleSelect = (row: CustomerApi.HistoryInsured) => {
  emit('select', row);
  emit('update:visible', false);
};

// ─── 分页 ─────────────────────────────────────────────────
const handlePageChange = (p: number) => {
  page.value = p;
  fetchList();
};

/** 证件类型显示 */
const cardTypeLabel = (type: string) =>
  type === '0' ? '统一信用代码' : type === '1' ? '身份证' : type;
</script>

<template>
  <ElDialog
    :model-value="visible"
    title="历史投保人"
    width="860px"
    :close-on-click-modal="false"
    draggable
    @update:model-value="(val: boolean) => emit('update:visible', val)"
  >
    <!-- 顶部信息 -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="panel-loading">加载中...</div>

    <!-- 无数据 -->
    <div v-else-if="list.length === 0" class="panel-empty">暂无历史投保人</div>

    <!-- 卡片列表 -->
    <div v-else class="card-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="insured-card"
      >
        <div class="card-body">
          <!-- 第一行：姓名 + 证件类型 -->
          <div class="card-row">
            <div class="card-field">
              <span class="field-label">投保人名称</span>
              <span class="field-value name">{{ item.tbrName }}</span>
            </div>
            <div class="card-field">
              <span class="field-label">证件类型</span>
              <ElTag size="small" type="info">
                {{ cardTypeLabel(item.tbCardtype) }}
              </ElTag>
            </div>
          </div>
          <!-- 第二行：证件号 + 手机号 -->
          <div class="card-row">
            <div class="card-field">
              <span class="field-label">证件号码</span>
              <span class="field-value">{{ item.tbCard }}</span>
            </div>
            <div class="card-field">
              <span class="field-label">手机号</span>
              <span class="field-value">{{ item.tbrPhone }}</span>
            </div>
          </div>
          <!-- 第三行：地址 + 邮箱 -->
          <div class="card-row">
            <div class="card-field">
              <span class="field-label">地址</span>
              <span class="field-value">{{ item.tbrAddress || '-' }}</span>
            </div>
            <div class="card-field">
              <span class="field-label">邮箱</span>
              <span class="field-value">{{ item.tbrEmail || '-' }}</span>
            </div>
          </div>
        </div>
        <!-- 选用按钮 -->
        <div class="card-action">
          <ElButton type="primary" size="small" @click="handleSelect(item)">
            选用
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="mt-3 flex justify-end">
      <ElPagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>

    <template #footer>
      <ElButton @click="close">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.panel-loading,
.panel-empty {
  text-align: center;
  padding: 24px 0;
  color: #909399;
  font-size: 13px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 450px;
  overflow-y: auto;
}

.insured-card {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.insured-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-row {
  display: flex;
  gap: 24px;
  margin-bottom: 4px;
}

.card-row:last-child {
  margin-bottom: 0;
}

.card-field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}

.field-value {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-value.name {
  font-weight: 600;
  color: #409eff;
}

.card-action {
  flex-shrink: 0;
  margin-left: 16px;
}
</style>
