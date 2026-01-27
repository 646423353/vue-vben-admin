<script lang="ts" setup>
import type { CaseAlarmApi } from '#/api/core/case-alarm';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import RiskRuleList from './components/RiskRuleList.vue';
import RiskRuleModal from './components/RiskRuleModal.vue';

const riskRuleListRef = ref();

const [RiskRuleModalComponent, riskRuleModalApi] = useVbenModal({
  connectedComponent: RiskRuleModal,
});

function handleCreate() {
  riskRuleModalApi.setData({});
  riskRuleModalApi.open();
}

function handleEdit(item: CaseAlarmApi.TbCaseSettingRules) {
  riskRuleModalApi.setData(item);
  riskRuleModalApi.open();
}

function handleReload() {
  riskRuleListRef.value?.reload();
}
</script>

<template>
  <Page title="风险预警规则设置">
    <RiskRuleList
      ref="riskRuleListRef"
      @create="handleCreate"
      @edit="handleEdit"
    />
    <RiskRuleModalComponent @reload="handleReload" />
  </Page>
</template>
