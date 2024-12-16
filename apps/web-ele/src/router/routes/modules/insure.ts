import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'uil:file-bookmark-alt',
      order: 1010,
      title: '保障方案',
      authority: ['超级管理员', '管理员'],
    },
    name: 'Insure',
    path: '/insure',
    children: [
      {
        meta: {
          icon: 'uil:file-shield-alt',
          title: '主险方案',
          keepAlive: true,
        },
        name: 'InsureMain',
        path: '/insure/main',
        component: () => import('#/views/insure/main.vue'),
      },
      {
        meta: {
          icon: 'uil:file-plus-alt',
          title: '附加险方案',
          keepAlive: true,
        },
        name: 'InsureAdditional',
        path: '/insure/additional',
        component: () => import('#/views/insure/additional.vue'),
      },
      {
        meta: {
          icon: 'uil:file-copy-alt',
          title: '保障方案组合',
          keepAlive: true,
        },
        name: 'InsureGroup',
        path: '/insure/group',
        component: () => import('#/views/insure/group.vue'),
      },
      {
        meta: {
          icon: 'uil:file-edit-alt',
          title: '编辑方案',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'InsureEdit',
        path: '/insure/edit',
        component: () => import('#/views/insure/operate/edit.vue'),
      },
    ],
  },
];

export default routes;
