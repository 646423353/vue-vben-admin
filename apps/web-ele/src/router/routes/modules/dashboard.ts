import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:area-chart',
      order: -1,
      title: $t('page.dashboard.title'),
      hideChildrenInMenu: true,
      authority: [
        '超级管理员',
        '管理员',
        '业务主管',
        '业务操作员',
        '业务管理员',
        '业务客户',
      ],
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.title'),
        },
      },
    ],
  },
];

export default routes;
