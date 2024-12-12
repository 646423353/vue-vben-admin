import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:user-outlined',
      keepAlive: true,
      order: 1000,
      title: '个人中心',
      hideInMenu: true,
      ignoreSync: true,
      component: 'BasicLayout',
    },
    name: 'PersonalManager',
    path: '/manager',
    children: [
      {
        meta: {
          icon: 'ant-design:user-outlined',
          title: '个人中心',
          hideInMenu: true,
          ignoreSync: true,
          component: '/personal/index',
        },
        name: 'Personal',
        path: '/personal/index',
        component: () => import('#/views/personal/index.vue'),
      },
    ],
  },
];

export default routes;
