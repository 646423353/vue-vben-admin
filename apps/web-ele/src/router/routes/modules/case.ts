import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'hugeicons:legal-01',
      order: 1012,
      title: '理赔管理',
      authority: ['超级管理员', '管理员', '理赔员'],
      hideInMenu: true,
    },
    name: 'Case',
    path: '/case',
    children: [
      {
        meta: {
          icon: 'ant-design:database-outlined',
          title: '案件列表',
          keepAlive: true,
        },
        name: 'CaseList',
        path: '/case/list',
        component: () => import('#/views/case/list.vue'),
      },
      // {
      //   meta: {
      //     icon: 'ant-design:customer-service-filled',
      //     title: '客服待处理',
      //     keepAlive: true,
      //   },
      //   name: 'CaseService',
      //   path: '/case/service',
      //   component: () => import('#/views/case/service.vue'),
      // },
      {
        meta: {
          icon: 'ant-design:money-collect-outlined',
          title: '理赔员待处理',
          keepAlive: true,
          hideInMenu: true,
        },
        name: 'CaseClaims',
        path: '/case/claims',
        component: () => import('#/views/case/claims.vue'),
      },
      {
        meta: {
          icon: 'material-symbols:reopen-window-rounded',
          title: '重开记录',
          keepAlive: true,
        },
        name: 'CaseReopen',
        path: '/case/reopen',
        component: () => import('#/views/case/reopen.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑案件',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseEdit',
        path: '/case/edit',
        component: () => import('#/views/case/operate/edit.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '案件详情',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseDetail',
        path: '/case/detail',
        component: () => import('#/views/case/operate/detail.vue'),
      },
      {
        meta: {
          icon: 'ant-design:tool-outlined',
          title: '案件处理',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseHandle',
        path: '/case/handle',
        component: () => import('#/views/case/operate/handle.vue'),
      },
    ],
  },
];

export default routes;
