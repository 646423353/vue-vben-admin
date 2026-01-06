import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'ant-design:setting-outlined',
      order: 2000,
      title: '理赔TPA设置',
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
    ],
  },
];

export default routes;
