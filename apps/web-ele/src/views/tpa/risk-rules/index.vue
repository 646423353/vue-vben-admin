<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';

import RiskRuleList from '../../case/components/RiskRuleList.vue';
import RiskRuleModal from '../../case/components/RiskRuleModal.vue';

const [RiskRuleModalComponent, riskRuleModalApi] = useVbenModal({
  connectedComponent: RiskRuleModal,
});

function openRiskRuleModal() {
  riskRuleModalApi.open();
}
</script>

<template>
  <Page title="风险预警规则设置">
    <RiskRuleList @create="openRiskRuleModal" />
    <RiskRuleModalComponent @reload="() => {}" />
  </Page>
</template>
