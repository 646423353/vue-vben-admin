import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'fa6-solid:users',
      order: 1009,
      title: '账户管理',
      authority: ['超级管理员', '管理员', '业务主管'],
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
      {
        meta: {
          icon: 'codicon:group-by-ref-type',
          title: '分组管理',
          keepAlive: true,
          hideInMenu: true,
        },
        name: 'UserTags',
        path: '/user/tags',
        component: () => import('#/views/user/tags.vue'),
      },
    ],
  },
];

export default routes;
