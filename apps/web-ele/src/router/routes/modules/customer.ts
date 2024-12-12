import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'uil:user-md',
      order: 1008,
      title: '客户管理',
    },
    name: 'Customer',
    path: '/customer',
    children: [
      {
        meta: {
          icon: 'uil:user-arrows',
          title: '客户列表',
          keepAlive: true,
        },
        name: 'CustomerList',
        path: '/customer/list',
        component: () => import('#/views/customer/list.vue'),
      },
      {
        meta: {
          icon: 'uil:store',
          title: '站点管理',
          keepAlive: true,
        },
        name: 'CustomerSite',
        path: '/customer/site',
        component: () => import('#/views/customer/site.vue'),
      },
      {
        meta: {
          icon: 'uil:invoice',
          title: '客户保障方案',
          keepAlive: true,
        },
        name: 'CustomerPlan',
        path: '/customer/plan',
        component: () => import('#/views/customer/plan.vue'),
      },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑客户',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CustomerEdit',
        path: '/customer/edit',
        component: () => import('#/views/customer/operate/edit.vue'),
      },
      {
        meta: {
          icon: 'bxs:user-detail',
          title: '客户信息',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'CustomerDetail',
        path: '/customer/detail',
        component: () => import('#/views/customer/operate/detail.vue'),
      },
    ],
  },
];

export default routes;
