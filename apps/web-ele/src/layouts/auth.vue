<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
<<<<<<< HEAD
const sloganImage = computed(() => preferences.sloganImage.source);
const pageTitle = 'E骑保 · 贴心守护';
const pageDesc = ' 为骑手铸就安全路';
=======
const logoDark = computed(() => preferences.logo.sourceDark);
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
<<<<<<< HEAD
    :page-description="pageDesc"
    :page-title="pageTitle"
    :slogan-image="sloganImage"
    :toolbar-list="['theme']"
=======
    :logo-dark="logoDark"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
