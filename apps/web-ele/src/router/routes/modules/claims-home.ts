import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:home-outlined',
      order: 1011,
      title: '我的理赔工作台',
      authority: [
        '超级管理员',
        '管理员',
        '理赔客服',
        '定损员',
        '初审及保司对接员',
        '理赔管理员',
      ],
    },
    name: 'ClaimsHome',
    path: '/claims-home',
    children: [
      {
        name: 'ClaimsHomeIndex',
        path: '/claims-home/index',
        component: () => import('#/views/claims-home/index.vue'),
        meta: {
          title: '工作台',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
