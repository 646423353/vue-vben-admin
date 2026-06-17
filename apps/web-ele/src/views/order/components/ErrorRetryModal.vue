<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElDialog,
  ElLink,
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import { saveAs } from 'file-saver';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { PolicyBBRGetApi } from '#/api/core/policy';
import {
  BuTouExecApi,
  BuTouPdfStatusApi,
  BuTouSubmitApi,
} from '#/api/core/task';
import { formatIdCard } from '#/utils/formatIDCardUtils';
import { extractTextFromRichText } from '#/utils/formmatRichText';

// ─── 状态枚举 ───────────────────────────────────────────
/** 弹窗当前所处阶段 */
type DialogStage = 'fail' | 'form' | 'loading' | 'success';

// ─── 人员清单行类型 ─────────────────────────────────────
interface MemberRow {
  '姓名*'?: string;
  '身份证*'?: string;
  '保险编码*'?: string;
  所属站点名称?: string;
  骑手编号?: string;
  备注1?: string;
  备注2?: string;
  username?: string;
  creditcard?: string;
  bxbm?: string;
  stopName?: string;
  idNum?: string;
  comment?: string;
  comment2?: string;
  [key: string]: any;
}

// ─── Props / Emits ──────────────────────────────────────
const emit = defineEmits<{
  /** 补投完成后通知父组件刷新列表 */
  (e: 'retried'): void;
}>();

// ─── 响应式状态 ─────────────────────────────────────────
const visible = ref(false);
const stage = ref<DialogStage>('form');

/** 当前操作的 task_post.id（失败记录） */
const taskPostId = ref<number | string>('');

/** 弹窗头部展示的失败保单信息（仅展示 policyId） */
interface RetryInfo {
  policyId: number | string;
}
const retryInfo = ref<RetryInfo>({ policyId: '' });

/** 补投结果 */
interface RetryResult {
  status: number; // 1=成功 2=失败
  orderNo: string;
  orderId: string;
  pdf?: string;
  remark?: string;
}
const retryResult = ref<null | RetryResult>(null);

/** 本地维护的成员清单（不依赖 gridApi.grid） */
const memberData = ref<MemberRow[]>([]);

// ─── 计算属性 ────────────────────────────────────────────
const isFormStage = computed(() => stage.value === 'form');
const isLoadingStage = computed(() => stage.value === 'loading');
const isSuccessStage = computed(() => stage.value === 'success');
const isFailStage = computed(() => stage.value === 'fail');
const isResultStage = computed(
  () => stage.value === 'success' || stage.value === 'fail',
);

const dialogTitle = computed(() => '错单补投');

/** 人员清单行数显示 */
const memberCount = computed(() => memberData.value.length);
const validMemberCount = computed(
  () => memberData.value.filter((m: any) => !m._isDeleted).length,
);
const deletedMemberCount = computed(
  () => memberData.value.filter((m: any) => m._isDeleted).length,
);

const gridOptions: VxeGridProps<MemberRow> = {
  rowClassName: ({ row }: any) => {
    return row._isDeleted ? 'deleted-row' : '';
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
  },
  columns: [
    {
      field: '姓名*',
      title: '姓名',
      minWidth: 120,
      editRender: { name: 'VxeInput' },
    },
    {
      field: '身份证*',
      title: '身份证',
      minWidth: 170,
      editRender: { name: 'VxeInput' },
      formatter: ({ row }: any) => formatIdCard(row['身份证*']),
    },
    { field: '保险编码*', title: '保险编码', minWidth: 140 },
    { field: '所属站点名称', title: '所属站点名称', minWidth: 150 },
    { field: '骑手编号', title: '骑手编号', minWidth: 130 },
    { field: '备注1', title: '备注1', minWidth: 120 },
    { field: '备注2', title: '备注2', minWidth: 120 },
    {
      title: '操作',
      width: 80,
      slots: { default: 'action' },
      fixed: 'right',
    },
  ],
  pagerConfig: { enabled: false },
  data: [],
  showOverflow: true,
  height: 280,
  importConfig: {
    message: false,
    afterImportMethod: async ({ $table }: any) => {
      // 完全对齐 Members.vue：in-place 修改，不需要 reloadData
      const data = $table.getFullData();
      data.forEach((item: any) => {
        item['姓名*'] = extractTextFromRichText(item['姓名*'] ?? '');
        item['身份证*'] = extractTextFromRichText(item['身份证*'] ?? '');
        item['保险编码*'] = extractTextFromRichText(item['保险编码*'] ?? '');
        item['所属站点名称'] = extractTextFromRichText(
          item['所属站点名称'] ?? '',
        );
        item['骑手编号'] = extractTextFromRichText(item['骑手编号'] ?? '');
        item['备注1'] = extractTextFromRichText(item['备注1'] ?? '');
        item['备注2'] =
          typeof item['备注2'] === 'object'
            ? item['备注2']?.formula
              ? item['备注2']?.result
              : ''
            : extractTextFromRichText(item['备注2'] ?? '');
      });

      if (data.length > 1000) {
        ElMessage.error('上传人员数据不能超过 1000 人');
        return;
      }

      // 直接把表格中的 data 赋值给 memberData（in-place 修改已生效）
      memberData.value = data;
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

// ─── 方法 ─────────────────────────────────────────────────

/** 对外暴露：打开弹窗，传入保单 id 和 原始保单 policyId */
const currentPolicyId = ref<number | string>('');

const open = (
  id: number | string,
  sourcePolicyId?: number | string,
  uuid?: string,
) => {
  taskPostId.value = id;
  currentPolicyId.value = sourcePolicyId || '';
  stage.value = 'form';
  retryResult.value = null;
  retryInfo.value = { policyId: uuid || id };
  // 清空表格和本地数据
  memberData.value = [];
  gridApi.setGridOptions({ data: [] });
  visible.value = true;
};

/** 删除/恢复选定行人员 (软删除展示) */
const handleRemoveRow = async (row: any) => {
  row._isDeleted = !row._isDeleted;
  const $grid = gridApi.grid;
  if ($grid) {
    // 触发重新计算行类名与刷新
    $grid.updateData();
    // 强制更新 memberData 引用以触发 computed 计算属性
    memberData.value = [...$grid.getFullData()];
  }
};

/** 导入人员名单 xlsx */
const handleImport = () => {
  const $grid = gridApi.grid;
  if (!$grid) return;
  // afterImportMethod 已在 gridOptions.importConfig 中定义
  $grid.importData({ types: ['xlsx', 'xls'] }).catch(() => {
    // 用户取消文件选择时静默处理
  });
};

/** 导入原订单人员表 */
const handleImportOriginalMembers = async () => {
  if (!currentPolicyId.value) {
    ElMessage.warning('无法获取原订单关联的保单信息，请手动下载模板导入');
    return;
  }
  try {
    await ElMessageBox.confirm(
      '导入原订单人员信息可能会包含已有投保失败的错误信息，请仔细检查确认！错单补投功能每个自动投保单只能使用一次！',
      '提示',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    // 用户点击取消，直接返回
    return;
  }

  try {
    const res = await PolicyBBRGetApi({
      id: String(currentPolicyId.value),
      page: 1,
      size: 2000,
    });
    if (res && res.list) {
      const data = res.list.map((item: any) => ({
        '姓名*': item.username || '',
        '身份证*': item.creditcard || '',
        '保险编码*': item.bxbm || '',
        所属站点名称: item.stopName || '',
        骑手编号: item.idNum || '',
        备注1: item.comment || '',
        备注2: item.comment2 || '',
      }));
      memberData.value = data;
      gridApi.setGridOptions({ data });
      ElMessage.success('导入成功，可直接在表格中双击修改人员信息');
    } else {
      ElMessage.warning('未拉取到原单人员数据');
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取原订单人员失败');
  }
};

/** 下载模板 */
const handleDownloadTemplate = () => {
  const path = import.meta.env.VITE_GLOB_API_URL;
  const url = import.meta.env.VITE_PERSON_TEMPLATE_URL;
  if (path && url) {
    saveAs(`${path}${url}`, '错单补投人员模板.xlsx');
  } else {
    ElMessage.warning('模板地址未配置');
  }
};

/** 提交补投（BuTou 三步流程：submit → exec → 轮询 pdfStatus） */
const handleSubmit = async () => {
  // 从 grid 实例获取最新数据，以保证单元格的修改和行状态同步
  const currentData = gridApi.grid?.getFullData() || memberData.value;
  const members = currentData.filter((m: any) => !m._isDeleted);

  if (members.length === 0) {
    ElMessage.error('请先导入人员名单或至少保留一人');
    return;
  }

  // 进入 loading 状态
  stage.value = 'loading';

  try {
    // 1. 提交补投（数据准备），返回新订单 orderId
    const newOrderId = await BuTouSubmitApi({
      policyId: taskPostId.value,
      members: members.map((m: any) => ({
        username: m['姓名*'],
        creditcard: m['身份证*'],
      })),
    });

    // 2. 执行补投（实际投保）
    await BuTouExecApi(newOrderId);

    // 3. 轮询 PDF 状态（最多 5 分钟）
    const MAX_WAIT_MS = 5 * 60 * 1000;
    const INTERVAL_MS = 4000;
    const startTime = Date.now();

    const poll = async (): Promise<void> => {
      if (Date.now() - startTime > MAX_WAIT_MS) {
        // 超时按成功处理，PDF 稍后再查
        retryResult.value = { status: 1, orderNo: '', orderId: newOrderId };
        stage.value = 'success';
        emit('retried');
        return;
      }
      const pdfUrl = await BuTouPdfStatusApi(newOrderId);
      if (pdfUrl) {
        retryResult.value = {
          status: 1,
          orderNo: '',
          orderId: newOrderId,
          pdf: pdfUrl,
        };
        stage.value = 'success';
        emit('retried');
      } else {
        setTimeout(poll, INTERVAL_MS);
      }
    };
    await poll();
  } catch (error: any) {
    retryResult.value = {
      status: 2,
      orderNo: '',
      orderId: '',
      remark: error?.message || '服务器异常，请稍后重试',
    };
    stage.value = 'fail';
  }
};

/** 关闭弹窗 */
const handleClose = () => {
  visible.value = false;
};

// 跳转查看订单详情
const router = useRouter();
const goOrderDetail = (orderId: string) => {
  if (!orderId) return;
  router.push(`/order/detail?id=${orderId}`);
};

// 下载补投保单 PDF
const downloadPdf = (pdf: string) => {
  if (!pdf) {
    ElMessageBox.alert(
      '保单正在下载中，请稍后再试，超过30分钟仍未获得PDF保单请联系管理员',
      '提示',
      { confirmButtonText: '确认' },
    );
    return;
  }
  saveAs(pdf, '补投保单.pdf');
};

defineExpose({ open });
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="760px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="isFormStage"
    draggable
  >
    <!-- ── 弹窗头部：保单信息 ── -->
    <div class="retry-info mb-4">
      <div class="retry-info-row">
        <span class="retry-info-label">保单系统编号：</span>
        <span class="retry-info-value">{{ retryInfo.policyId }}</span>
      </div>
    </div>

    <!-- ── 人员清单区域 ── -->
    <div class="member-panel">
      <!-- 面板标题栏 -->
      <div class="member-panel-header">
        <span class="member-panel-title">
          人员清单
          <span class="member-panel-count">
            <template v-if="deletedMemberCount > 0">
              （共 {{ memberCount }} 人，有效 {{ validMemberCount }} 人，已删
              {{ deletedMemberCount }} 人）
            </template>
            <template v-else> （{{ memberCount }}） </template>
          </span>
        </span>
        <div class="member-panel-actions">
          <ElButton
            type="primary"
            plain
            size="small"
            :disabled="!isFormStage"
            @click="handleImportOriginalMembers"
          >
            导入原订单人员表
          </ElButton>
          <!-- 导入按钮：loading 阶段禁用 -->
          <ElButton
            type="primary"
            size="small"
            :disabled="!isFormStage"
            @click="handleImport"
          >
            导入
          </ElButton>
          <!-- 下载模板按钮：loading 阶段同样禁用 -->
          <ElButton
            size="small"
            :disabled="!isFormStage"
            @click="handleDownloadTemplate"
          >
            下载模板
          </ElButton>
        </div>
      </div>

      <!-- 人员清单表格 -->
      <div class="member-table-wrap">
        <Grid>
          <template #action="{ row }">
            <ElButton
              :type="row._isDeleted ? 'success' : 'danger'"
              link
              @click="handleRemoveRow(row)"
            >
              {{ row._isDeleted ? '恢复' : '删除' }}
            </ElButton>
          </template>
        </Grid>
      </div>
    </div>

    <!-- ── Loading 阶段提示 ── -->
    <div v-if="isLoadingStage" class="retry-loading-tip">
      <span class="retry-loading-icon">
        <svg class="loading-spin" viewBox="0 0 50 50" width="20" height="20">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="90 60"
          />
        </svg>
      </span>
      <div class="retry-loading-text">
        <div class="text-main">正在补投中请等待，请勿关闭弹窗...</div>
        <div class="text-sub">超过2分钟无结果可手动刷新页面</div>
      </div>
    </div>

    <!-- ── 补投结果：成功 ── -->
    <div v-if="isSuccessStage" class="retry-result success">
      补投成功！补投订单号：
      <span class="result-order-no">{{ retryResult?.orderNo }}</span>
      <!-- 此处如果需要跳详情，直接让它跳回原单，这里保留原逻辑，不传newOrderId的话就传currentSourceOrderId但既然原逻辑是这样，我们为了兼容不乱动，或者直接隐藏它。既然用户提的是图3(外部列表)，这里暂不处理 -->
      <ElLink
        class="ml-2"
        type="primary"
        @click="goOrderDetail(retryResult?.orderId ?? '')"
      >
        查看订单
      </ElLink>
      <ElLink
        class="ml-2"
        type="primary"
        @click="downloadPdf(retryResult?.pdf ?? '')"
      >
        保单下载
      </ElLink>
    </div>

    <!-- ── 补投结果：失败 ── -->
    <div v-if="isFailStage" class="retry-result fail">
      补投失败！补投订单号：
      <span class="result-order-no">{{ retryResult?.orderNo }}</span>
      <ElLink
        class="ml-2"
        type="primary"
        @click="goOrderDetail(retryResult?.orderId ?? '')"
      >
        查看订单
      </ElLink>
    </div>

    <!-- ── 弹窗底部按钮 ── -->
    <template #footer>
      <!-- form 阶段：取消 + 提交补投 -->
      <template v-if="isFormStage">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交补投</ElButton>
      </template>
      <!-- loading 阶段：不显示任何按钮 -->
      <!-- result 阶段：只有关闭 -->
      <template v-if="isResultStage">
        <ElButton type="primary" @click="handleClose">关闭</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.retry-info {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.8;
  color: #333;
  background: #f8f9fc;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.retry-info-label {
  color: #666;
}

.retry-info-value {
  font-weight: 500;
  color: #303133;
}

/* ── 人员清单面板 ───────────────────────────── */
.member-panel {
  overflow: hidden;
  border: 1.5px solid #409eff;
  border-radius: 6px;
}

.member-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.member-panel-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.member-panel-count {
  font-size: 13px;
  color: #909399;
}

.member-panel-actions {
  display: flex;
  gap: 8px;
}

.member-table-wrap {
  padding: 0;
  background: #fff;
}

/* ── Loading 提示 ───────────────────────────── */
.retry-loading-tip {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 16px 0 8px;
}

.retry-loading-icon {
  display: flex;
  align-items: center;
  color: #409eff;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

.retry-loading-text {
  font-size: 14px;
}

.text-main {
  color: #303133;
}

.text-sub {
  font-size: 12px;
  color: #909399;
}

/* ── 补投结果 ───────────────────────────────── */
.retry-result {
  padding: 12px 0 4px;
  font-size: 14px;
  text-align: center;
}

.retry-result.success {
  color: #303133;
}

.retry-result.fail {
  color: #303133;
}

.result-order-no {
  font-weight: 600;
  color: #303133;
}

/* ── 深度样式覆盖 ────────────────────────────── */
:deep(.deleted-row) {
  text-decoration: line-through;
  opacity: 0.6;
}

:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}

/* ── 头部信息区 ─────────────────────────────── */
</style>
