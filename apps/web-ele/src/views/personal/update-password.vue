<script setup lang="ts">
import { h, ref } from 'vue';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { updateUserinfo } from '#/api/core/user';

const loading = ref<boolean>(false);

const [BasicForm, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 w-[60%]', // 24栅格,
  commonConfig: {
    formItemClass: 'col-span-1',
    labelWidth: 100,
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
      fieldName: 'oldpassword',
      label: '旧密码',
      component: 'Input',
      componentProps: {
        type: 'password',
        showPassword: true,
        placeholder: '请输入旧密码',
      },
      formItemClass: 'col-span-1',
      rules: 'required',
    },
    {
      fieldName: 'password',
      label: '新密码',
      help: '6-18位数字、字母、特殊字符组成。',
      component: 'Input',
      componentProps: {
        type: 'password',
        showPassword: true,
        placeholder: '请输入新密码',
      },
      formItemClass: 'col-span-1',
      rules: z
        .string()
        .regex(/[\w!@#$%^&*]{6,18}/, '密码由6-18位数字、字母、特殊字符组成。'),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      help: '6-18位数字、字母、特殊字符组成。',
      component: 'Input',
      componentProps: {
        type: 'password',
        showPassword: true,
        placeholder: '请输入确认密码',
      },
      formItemClass: 'col-span-1',
      rules: z
        .string()
        .regex(/[\w!@#$%^&*]{6,18}/, '密码由6-18位数字、字母、特殊字符组成。'),
      dependencies: {
        triggerFields: ['confirmPassword'],
        rules: (values) => {
          return z
            .string()
            .regex(
              /[\w!@#$%^&*]{6,18}/,
              '密码由6-18位数字、字母、特殊字符组成。',
            )
            .refine(
              (confirmPassword) => {
                return confirmPassword === values.password;
              },
              {
                message: '确认密码必须与密码一致',
              },
            );
        },
      },
    },
    {
      fieldName: 'btn',
      label: '',
      component: () => {
        return h(
          'div',
          {},
          h(
            ElButton,
            {
              type: 'primary',
              // eslint-disable-next-line no-use-before-define
              onClick: handleSubmit.bind(null),
              loading: loading.value,
            },
            {
              default() {
                return '修改密码';
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
          ElMessage.success('修改成功');
          formApi.resetForm();
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};
defineExpose({
  getFormApi() {
    return formApi;
  },
});
</script>
<template>
  <BasicForm />
</template>
<style lang="less" scoped></style>
