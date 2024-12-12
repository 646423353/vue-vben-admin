<script setup lang="ts">
import { h, onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElButton as Button, ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { updateUserinfo } from '#/api/core/user';

const userStore = useUserStore();
const loading = ref<boolean>(false);

const [BasicForm, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 w-[50%]', // 24栅格,
  commonConfig: {
    formItemClass: 'col-span-1',
    labelWidth: 60,
  },
  showDefaultActions: false,
  submitButtonOptions: {
    content: '更新信息',
  },
  resetButtonOptions: {
    show: false,
  },
  schema: [
    {
      fieldName: 'username',
      label: '登录名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
      },
      formItemClass: 'col-span-1',
      rules: 'required',
      disabled: true,
    },
    {
      fieldName: 'description',
      label: '昵称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入昵称',
      },
      formItemClass: 'col-span-1',
      rules: 'required',
    },
    {
      fieldName: 'phone',
      label: '手机号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
      },
      formItemClass: 'col-span-1',
      rules: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    },
    {
      fieldName: 'btn',
      label: '',
      component: () => {
        return h(
          'div',
          {},
          h(
            Button,
            {
              type: 'primary',
              // eslint-disable-next-line no-use-before-define
              onClick: handleSubmit.bind(null),
              loading: loading.value,
            },
            {
              default() {
                return '更新信息';
              },
            },
          ),
        );
      },
      componentProps: {},
      formItemClass: 'col-span-1',
    },
  ],
});
const handleSubmit = () => {
  formApi.validate().then(async (e: any) => {
    if (e.valid) {
      const values = await formApi.getValues();
      loading.value = true;
      updateUserinfo(values)
        .then(() => {
          ElMessage.success('更新成功');
          userStore.setUserInfo({
            ...userStore.userInfo,
            ...values,
          } as any);
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};
onMounted(() => {
  formApi.setValues(userStore.userInfo || {});
});
</script>
<template>
  <BasicForm />
</template>
<style lang="less" scoped></style>
