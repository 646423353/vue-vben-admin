<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { ElCard } from 'element-plus';

import { getReminderListApi } from '#/api/core/case-reminder';

import ClaimsAccountCard from './ClaimsAccountCard.vue';
import ReminderListCard from './ReminderListCard.vue';

const router = useRouter();
const userStore = useUserStore();
const currentUserId = String(userStore.userInfo?.id || '');

// 理赔账户数据接口
interface ClaimsAccount {
  handler: string;
  accountId: string;
  processingCount: number;
  exceptionCount: number;
}

// 催办数据接口 - Keep aligned with ReminderListCard definition
interface ReminderItem {
  id: number | string;
  caseId: string;
  caseName: string;
  reminderType: string;
  priority: '最高' | '普通' | '高';
  deadline: string;
  content: string;
  createdTime: string;
  handler?: string;
  uid?: string;
  receiver?: number | string;
  statusFeedback?: number;
  statusClose?: string;
  imp?: number;
}

// 理赔账户列表
const accountList = ref<ClaimsAccount[]>([]);

// 待处理催办列表
const reminderList = ref<ReminderItem[]>([]);

// 加载中状态
const loading = ref(true);

// 生成Mock理赔账户数据
const generateMockAccounts = (): ClaimsAccount[] => {
  return [
    {
      handler: '张三',
      accountId: 'ACC20240001',
      processingCount: 12,
      exceptionCount: 3,
    },
    {
      handler: '李四',
      accountId: 'ACC20240002',
      processingCount: 8,
      exceptionCount: 0,
    },
    {
      handler: '王五',
      accountId: 'ACC20240003',
      processingCount: 15,
      exceptionCount: 2,
    },
    {
      handler: '赵六',
      accountId: 'ACC20240004',
      processingCount: 6,
      exceptionCount: 1,
    },
  ];
};

const getPriorityText = (imp?: number): '最高' | '普通' | '高' => {
  if (imp === 3) return '最高';
  if (imp === 2) return '高';
  return '普通';
};

const getReminderTypeText = (type?: number | string) => {
  const typeMap: Record<string, string> = {
    '1': '加速定损',
    '2': '尽快联系骑手',
    '3': '尽快联系保司',
    '4': '加快案件处理',
  };

  if (!type) return '';

  const typeStr = String(type);
  const types = typeStr.split(',').map((t) => t.trim());
  return types.map((t) => typeMap[t] || t).join('、');
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    accountList.value = generateMockAccounts();

    // Fetch Reminders
    const res = await getReminderListApi({
      page: 1,
      size: 20,
      type: '3', // 我创建的或我接收的
    });

    reminderList.value = (res.list || []).map((item) => ({
      id: item.id!,
      caseId: item.caseId || '',
      caseName: item.usernameQs || '', // Map usernameQs to caseName
      reminderType: getReminderTypeText(item.type),
      priority: getPriorityText(item.imp),
      deadline: item.endTime || '',
      content: item.zt || '',
      createdTime: item.created || '',
      handler: item.receiverName,
      uid: item.uid,
      receiver: item.receiver,
      statusFeedback: item.statusFeedback,
      statusClose: item.statusClose,
      imp: item.imp,
    }));
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleViewCase = (caseId: string) => {
  router.push(`/case_beta/detail_beta?id=${caseId}&check=1`);
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="claims-home">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">我的理赔工作台</h2>
      <p class="page-subtitle">快速查看理赔账户和待处理事项</p>
    </div>

    <!-- 理赔账户列表 -->
    <ElCard class="section-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">理赔账户列表</span>
          <span class="section-count">共 {{ accountList.length }} 个账户</span>
        </div>
      </template>

      <div v-loading="loading" class="accounts-grid">
        <ClaimsAccountCard
          v-for="account in accountList"
          :key="account.accountId"
          :handler="account.handler"
          :account-id="account.accountId"
          :processing-count="account.processingCount"
          :exception-count="account.exceptionCount"
        />
      </div>
    </ElCard>

    <!-- 待处理催办列表 -->
    <div class="reminder-section">
      <ReminderListCard
        :reminders="reminderList"
        :current-user-id="currentUserId"
        @reload="loadData"
        @view-case="handleViewCase"
      />
    </div>
  </div>
</template>

<style scoped>
/* 响应式布局 */
@media (max-width: 1200px) {
  .accounts-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .claims-home {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .accounts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .section-card {
    margin-bottom: 16px;
  }
}

.claims-home {
  max-width: 1400px;
  padding: 20px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.section-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-count {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.reminder-section {
  margin-bottom: 24px;
}
</style>
