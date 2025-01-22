<script setup lang="ts">
import { UiwCloudUpload } from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';

import { ElAvatar, ElMessage, ElUpload } from 'element-plus';

import { updateUserinfo } from '#/api/core/user';

defineProps({
  avatar: {
    type: String,
    default: '',
  },
});
const accessStore = useAccessStore();
const userStore = useUserStore();

const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

const headers = {
  Authorization: `Bearer ${accessStore.accessToken}`,
};
const handleChange = (info: any) => {
  // 上传成功
  updateUserinfo({
    file: info.result,
  }).then(() => {
    ElMessage.success('修改头像成功');
    userStore.setUserInfo({
      ...userStore.userInfo,
      file: info.result,
    } as any);
  });
};
</script>
<template>
  <ElUpload
    :action="uploadUrl"
    :headers="headers"
    :show-file-list="false"
    accept="image/*"
    class="relative"
    @success="handleChange"
  >
    <ElAvatar :size="120" :src="avatar" />
    <div
      class="absolute left-[50%-120px] top-[0px] flex h-[120px] w-[120px] cursor-pointer justify-center rounded-full bg-black opacity-0 hover:opacity-60"
    >
      <UiwCloudUpload class="mt-[36px] size-10" />
    </div>
  </ElUpload>
</template>
<style lang="less" scoped></style>
