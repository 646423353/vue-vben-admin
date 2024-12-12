import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'fa6-solid:users',
      order: 1009,
      title: '账户管理',
    },
    name: 'User',
    path: '/user',
    children: [
      {
        meta: {
          icon: 'flowbite:user-solid',
          title: '账户列表',
          keepAlive: true,
        },
        name: 'UserList',
        path: '/user/index',
        component: () => import('#/views/user/index.vue'),
      },
      {
        meta: {
          icon: 'mdi:shield-key-outline',
          title: '权限管理',
          keepAlive: true,
        },
        name: 'UserPower',
        path: '/user/power',
        component: () => import('#/views/user/power.vue'),
      },
    ],
  },
];

export default routes;
