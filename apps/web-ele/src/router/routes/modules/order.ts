import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lsicon:work-order-info-outline',
      order: 1007,
      title: '订单管理',
    },
    name: 'Order',
    path: '/order',
    children: [
      {
        meta: {
          icon: 'mdi:order-bool-ascending',
          title: '订单列表',
          keepAlive: true,
        },
        name: 'OrderList',
        path: '/order/list',
        component: () => import('#/views/order/list.vue'),
      },
      {
        meta: {
          icon: 'mingcute:ebike-line',
          title: '人员查询',
          keepAlive: true,
        },
        name: 'OrderMembers',
        path: '/order/members',
        component: () => import('#/views/order/members.vue'),
      },
      // {
      //   meta: {
      //     icon: 'mdi:document-sign',
      //     title: '批单列表',
      //     keepAlive: true,
      //   },
      //   name: 'OrderSite',
      //   path: '/order/site',
      //   component: () => import('#/views/order/site.vue'),
      // },
      {
        meta: {
          icon: 'uil:edit',
          title: '编辑订单',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'OrderEdit',
        path: '/order/edit',
        component: () => import('#/views/order/operate/edit.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '订单信息',
          hideInMenu: true,
          keepAlive: true,
        },
        name: 'OrderDetail',
        path: '/order/detail',
        component: () => import('#/views/order/operate/detail.vue'),
      },
    ],
  },
];

export default routes;
