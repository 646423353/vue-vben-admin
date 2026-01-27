import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:setting-outlined',
      order: 2000,
      title: '理赔TPA设置',
      authority: ['超级管理员', '管理员', '理赔管理员'],
    },
    name: 'TPA',
    path: '/tpa',
    children: [
      {
        name: 'LossAssessmentSettings',
        path: '/tpa/loss-assessment',
        component: () => import('#/views/tpa/loss-assessment/index.vue'),
        meta: {
          icon: 'ant-design:unordered-list-outlined',
          title: '定损项目设置',
        },
      },
      {
        name: 'RiskRules',
        path: '/tpa/risk-rules',
        component: () => import('#/views/tpa/risk-rules/index.vue'),
        meta: {
          icon: 'ant-design:warning-outlined',
          title: '风险预警规则设置',
        },
      },
      {
        name: 'FileCategorySettings',
        path: '/tpa/file-category',
        component: () => import('#/views/tpa/file-category/index.vue'),
        meta: {
          icon: 'ant-design:tag-outlined',
          title: '图片标签管理',
        },
      },
      {
        name: 'ExceptionReasonSettings',
        path: '/tpa/exception-reason',
        component: () => import('#/views/tpa/exception-reason/index.vue'),
        meta: {
          icon: 'ant-design:exclamation-circle-outlined',
          title: '异常原因管理',
        },
      },
      {
        name: 'SuspendReasonSettings',
        path: '/tpa/suspend-reason',
        component: () => import('#/views/tpa/suspend-reason/index.vue'),
        meta: {
          icon: 'ant-design:pause-circle-outlined',
          title: '挂起原因管理',
        },
      },
      {
        name: 'SpecialJudgmentTagSettings',
        path: '/tpa/special-judgment-tag',
        component: () => import('#/views/tpa/special-judgment-tag/index.vue'),
        meta: {
          icon: 'ant-design:tags-outlined',
          title: '特殊判定标签管理',
        },
      },
      {
        name: 'ReminderRules',
        path: '/tpa/reminder-rules',
        component: () => import('#/views/tpa/reminder-rules/index.vue'),
        meta: {
          icon: 'ant-design:bell-outlined',
          title: '自动催办规则管理',
        },
      },
      {
        name: 'StatisticDisplay',
        path: '/tpa/statistic-display',
        component: () => import('#/views/tpa/statistic-display/index.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '统计展示管理',
        },
      },
      {
        name: 'TimeoutConfig',
        path: '/tpa/timeout-config',
        component: () => import('#/views/tpa/timeout-config/index.vue'),
        meta: {
          icon: 'ant-design:clock-circle-outlined',
          title: '超时参数配置',
        },
      },
    ],
  },
];

export default routes;
