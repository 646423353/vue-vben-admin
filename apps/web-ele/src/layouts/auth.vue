<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);

const sloganImage = computed(() => preferences.sloganImage.source);
const pageTitle = 'E骑保 · 贴心守护';
const pageDesc = ' 为骑手铸就安全路';
const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="pageDesc"
    :page-title="pageTitle"
    :slogan-image="sloganImage"
    :toolbar-list="['theme']"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
