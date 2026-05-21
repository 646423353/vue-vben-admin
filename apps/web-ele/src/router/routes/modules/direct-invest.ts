import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'mdi:motorbike',
      order: 1008,
      title: '骑手直投业务',
      authority: [
        '超级管理员',
        '管理员',
        '业务主管',
        '直投客户查询员',
        '理赔管理员',
        '初审及保司对接员',
      ],
    },
    name: 'DirectInvest',
    path: '/direct-invest',
    children: [
      {
        meta: {
          icon: 'mdi:order-bool-ascending',
          title: '主险直投订单查询',
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '直投客户查询员',
            '理赔管理员',
            '初审及保司对接员',
          ],
        },
        name: 'DirectInvestOrders',
        path: '/direct-invest/orders',
        component: () => import('#/views/direct-invest/orders.vue'),
      },
      {
        meta: {
          icon: 'mdi:order-bool-ascending',
          title: '附加险直投订单查询',
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '直投客户查询员',
            '理赔管理员',
            '初审及保司对接员',
          ],
        },
        name: 'DirectInvestOrdersAddi',
        path: '/direct-invest/orders-addi',
        component: () => import('#/views/direct-invest/orders-addi.vue'),
      },
      {
        meta: {
          icon: 'mdi:account-group',
          title: '直投客户列表',
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '理赔管理员',
            '初审及保司对接员',
          ],
        },
        name: 'DirectInvestCustomers',
        path: '/direct-invest/customers',
        component: () => import('#/views/direct-invest/customers.vue'),
      },
      {
        meta: {
          icon: 'lsicon:order-outline',
          title: '订单详情',
          hideInMenu: true,
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '理赔管理员',
            '初审及保司对接员',
          ],
        },
        name: 'DirectInvestOrderDetail',
        path: '/direct-invest/order-detail',
        component: () => import('#/views/order/operate/detail.vue'),
      },
      {
        meta: {
          icon: 'ant-design:container-outlined',
          title: '保单详情',
          hideInMenu: true,
          keepAlive: true,
          authority: [
            '超级管理员',
            '管理员',
            '业务主管',
            '理赔管理员',
            '初审及保司对接员',
          ],
        },
        name: 'DirectInvestPolicyDetail',
        path: '/direct-invest/policy-detail',
        component: () => import('#/views/policy/operate/detail.vue'),
      },
    ],
  },
];

export default routes;
