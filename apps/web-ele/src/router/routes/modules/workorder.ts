import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      // 使用客服/工单相关的精美图标
      icon: 'ant-design:customer-service-outlined',
      // 设置排序，使其大于“理赔TPA设置”的 2000，从而完美排列在菜单的最后一位
      order: 2010,
      // 菜单展示的标题名称
      title: '工单系统',
      // 隐藏子路由菜单，使其仅呈现为一级菜单项
      hideChildrenInMenu: true,
    },
    name: 'WorkOrderSSO',
    path: '/workorder-sso',
    children: [
      {
        name: 'WorkOrderSSOPage',
        path: '',
        component: () => import('#/views/workorder/sso.vue'),
        meta: {
          title: '工单系统',
        },
      },
    ],
  },
];

export default routes;
