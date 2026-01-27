import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'hugeicons:legal-01',
      order: 1012,
      title: '理赔TPA服务支持',
      authority: [
        '超级管理员',
        '管理员',
        '理赔客服',
        '定损员',
        '初审及保司对接员',
        '理赔管理员',
      ],
    },
    name: 'CaseBeta',
    path: '/case_beta',
    children: [
      {
        meta: {
          icon: 'lucide:archive',
          title: '案件列表',
        },
        name: 'CaseBetaList',
        path: '/case_beta/list_beta',
        component: () => import('#/views/case_beta/list_beta.vue'),
      },
      {
        meta: {
          icon: 'lucide:alert-triangle',
          title: '异常案件列表',
        },
        name: 'CaseBetaExceptionList',
        path: '/case_beta/exception_list',
        component: () => import('#/views/case_beta/exception_list.vue'),
      },
      {
        meta: {
          icon: 'lucide:pause-circle',
          title: '挂起案件列表',
        },
        name: 'CaseBetaSuspendList',
        path: '/case_beta/suspend_list',
        component: () => import('#/views/case_beta/suspend_list.vue'),
      },
      {
        meta: {
          icon: 'ant-design:bell-outlined',
          title: '催办列表',
          keepAlive: true,
        },
        name: 'CaseReminderList',
        path: '/case_beta/reminder',
        component: () => import('#/views/case_beta/remind/reminder_list.vue'),
      },
      {
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: '统计展示',
        },
        name: 'StatisticView',
        path: '/case_beta/statistic-view',
        component: () => import('#/views/tpa/statistic-view/index.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑案件',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CaseBetaEditBeta',
        path: '/case_beta/edit_beta',
        component: () => import('#/views/case_beta/operate/edit_beta.vue'),
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
        component: () => import('#/views/case_beta/operate/detail_beta.vue'),
      },
    ],
  },
];

export default routes;
