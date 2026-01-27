<script lang="ts" setup>
import { Settings } from '@vben/icons';
import { $t } from '@vben/locales';

import { useVbenDrawer } from '@vben-core/popup-ui';
import { VbenButton } from '@vben-core/shadcn-ui';

import PreferencesDrawer from './preferences-drawer.vue';
import { usePreferencesDrawerBinding } from './use-preferences-drawer';

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: PreferencesDrawer,
});

const { attrs, listen } = usePreferencesDrawerBinding();
</script>
<template>
  <div>
    <Drawer v-bind="{ ...$attrs, ...attrs }" v-on="listen" />

    <div @click="() => drawerApi.open()">
      <slot>
        <VbenButton
          :title="$t('preferences.title')"
          class="bg-primary flex-col-center size-10 cursor-pointer rounded-l-lg rounded-r-none border-none"
        >
          <Settings class="size-5" />
        </VbenButton>
      </slot>
    </div>
  </div>
</template>
