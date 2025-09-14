import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:insurance-filled',
      order: 1007,
      title: '保单管理',
      authority: [
        '超级管理员',
        '管理员',
        '业务主管',
        '业务操作员',
        '业务客户',
        '业务管理员',
        '理赔员',
      ],
    },
    name: 'Policy',
    path: '/policy',
    children: [
      {
        meta: {
          icon: 'ant-design:container-outlined',
          title: '保单列表',
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '业务操作员',
            '业务客户',
            '业务管理员',
          ],
        },
        name: 'PolicyList',
        path: '/policy/list',
        component: () => import('#/views/policy/list.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑保单',
          hideInMenu: true,
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '业务操作员',
            '业务客户',
            '业务管理员',
          ],
        },
        name: 'PolicyEdit',
        path: '/policy/edit',
        component: () => import('#/views/policy/operate/edit.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '保单信息',
          hideInMenu: true,
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '业务操作员',
            '业务客户',
            '业务管理员',
          ],
        },
        name: 'PolicyDetail',
        path: '/policy/detail',
        component: () => import('#/views/policy/operate/detail.vue'),
      },
    ],
  },
];

export default routes;
