<script lang="ts" setup>
import type { Component } from 'vue';

import { computed } from 'vue';

import { AntdIdcard } from '@vben/icons';

import { ElCard } from 'element-plus';

interface Props {
  handler: string;
  accountId: string;
  processingCount: number;
  exceptionCount: number;
}

const props = defineProps<Props>();

// 判断是否有异常案件
const hasException = computed(() => props.exceptionCount > 0);

// 动态图标
const accountIcon: Component = AntdIdcard;
</script>

<template>
  <ElCard
    class="claims-account-card"
    :class="{ 'has-exception': hasException }"
    shadow="hover"
  >
    <div class="card-content">
      <!-- 左侧：处理人信息 -->
      <div class="handler-section">
        <component :is="accountIcon" class="account-icon" />
        <div class="handler-info">
          <div class="handler-name">{{ handler }}</div>
          <div class="account-id">ID: {{ accountId }}</div>
        </div>
      </div>

      <!-- 右侧：案件统计 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-value">{{ processingCount }}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="stat-divider" />
        <div
          class="stat-item exception"
          :class="{ 'has-exception': hasException }"
        >
          <div class="stat-value">
            {{ exceptionCount }}
          </div>
          <div class="stat-label">异常</div>
        </div>
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.claims-account-card {
  cursor: pointer;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.claims-account-card:hover {
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-4px);
}

.claims-account-card.has-exception {
  border-left: 4px solid var(--el-color-danger);
}

.card-content {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.handler-section {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
}

.account-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 8px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.handler-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.handler-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats-section {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.stat-value {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.stat-item.exception .stat-value {
  color: var(--el-text-color-secondary);
}

.stat-item.exception.has-exception .stat-value {
  color: var(--el-color-danger);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--el-border-color);
}

.exception-icon {
  width: 18px;
  height: 18px;
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-section {
    justify-content: space-around;
    width: 100%;
  }
}
</style>
