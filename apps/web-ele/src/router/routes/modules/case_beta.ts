import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'hugeicons:legal-01',
      order: 1012,
      title: '理赔TPA服务支持',
      authority: ['超级管理员', '管理员', '理赔员'],
    },
    name: 'CaseBeta',
    path: '/case_beta',
    children: [
      {
        meta: {
          icon: 'ant-design:database-outlined',
          title: '案件列表',
          keepAlive: true,
        },
        name: 'CaseBetaList',
        path: '/case_beta/list',
        component: () => import('#/views/case/list_beta.vue'),
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
        name: 'CaseBetaClaims',
        path: '/case_beta/claims',
        component: () => import('#/views/case/claims.vue'),
      },
      {
        meta: {
          icon: 'material-symbols:reopen-window-rounded',
          title: '重开记录',
          keepAlive: true,
        },
        name: 'CaseBetaReopen',
        path: '/case_beta/reopen',
        component: () => import('#/views/case/reopen.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑案件',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaEdit',
        path: '/case_beta/edit',
        component: () => import('#/views/case/operate/edit.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑案件_beta',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaEditBeta',
        path: '/case_beta/edit_beta',
        component: () => import('#/views/case/operate/edit_beta.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '案件详情',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaDetail',
        path: '/case_beta/detail',
        component: () => import('#/views/case/operate/detail.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '案件详情',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaDetailBeta',
        path: '/case_beta/detail_beta',
        component: () => import('#/views/case/operate/detail_beta.vue'),
      },
      {
        meta: {
          icon: 'ant-design:tool-outlined',
          title: '案件处理',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaHandle',
        path: '/case_beta/handle',
        component: () => import('#/views/case/operate/handle.vue'),
      },
    ],
  },
];

export default routes;
