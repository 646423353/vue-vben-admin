export namespace LossAssessmentApi {
  export interface LossAssessmentItem {
    id: number;
    name: string;
    type: number; // 1: Big Class, 2: Item
    parentId?: number; // For Item, parent Big Class ID
    status: number; // 1: Enabled, 2: Disabled
    created?: string;
    updated?: string;
    hasChild?: boolean; // For Tree Table
    children?: LossAssessmentItem[];
  }

  export interface PageParams {
    page: number;
    size: number;
    name?: string;
    type?: number;
  }

  export interface ListResult {
    list: LossAssessmentItem[];
    total: number;
  }

  export interface Result {
    result: string;
  }
}

// Mock Data
let mockData: LossAssessmentApi.LossAssessmentItem[] = [
  {
    id: 1,
    name: '车辆损失',
    type: 1,
    status: 1,
    created: '2025-01-01 10:00:00',
    updated: '2025-01-01 10:00:00',
    hasChild: true,
  },
  {
    id: 2,
    name: '人身伤害',
    type: 1,
    status: 1,
    created: '2025-01-01 11:00:00',
    updated: '2025-01-01 11:00:00',
    hasChild: true,
  },
  {
    id: 101,
    name: '保险杠更换',
    type: 2,
    parentId: 1,
    status: 1,
    created: '2025-01-01 10:00:00',
  },
  {
    id: 102,
    name: '车门修复',
    type: 2,
    parentId: 1,
    status: 1,
    created: '2025-01-01 10:00:00',
  },
  {
    id: 201,
    name: '医疗费',
    type: 2,
    parentId: 2,
    status: 1,
    created: '2025-01-01 11:00:00',
  },
  {
    id: 3,
    name: '施救费用',
    type: 1,
    status: 1,
    created: '2025-01-02 09:30:00',
    updated: '2025-01-02 09:30:00',
    hasChild: true,
  },
  {
    id: 4,
    name: '物损费用',
    type: 1,
    status: 1,
    created: '2025-01-02 10:45:00',
    updated: '2025-01-02 10:45:00',
    hasChild: true,
  },
  {
    id: 103,
    name: '大灯更换',
    type: 2,
    parentId: 1,
    status: 1,
    created: '2025-01-01 10:20:00',
  },
  {
    id: 104,
    name: '全车喷漆',
    type: 2,
    parentId: 1,
    status: 2, // Disabled
    created: '2025-01-01 10:30:00',
  },
  {
    id: 202,
    name: '误工费',
    type: 2,
    parentId: 2,
    status: 1,
    created: '2025-01-01 11:15:00',
  },
  {
    id: 203,
    name: '住院伙食补助费',
    type: 2,
    parentId: 2,
    status: 1,
    created: '2025-01-01 11:30:00',
  },
  {
    id: 301,
    name: '拖车费',
    type: 2,
    parentId: 3,
    status: 1,
    created: '2025-01-02 09:35:00',
  },
  {
    id: 302,
    name: '吊装费',
    type: 2,
    parentId: 3,
    status: 1,
    created: '2025-01-02 09:40:00',
  },
  {
    id: 401,
    name: '衣物损坏',
    type: 2,
    parentId: 4,
    status: 1,
    created: '2025-01-02 10:50:00',
  },
  {
    id: 402,
    name: '手机损坏',
    type: 2,
    parentId: 4,
    status: 1,
    created: '2025-01-02 11:00:00',
  },
];

export async function LossListApi(
  params: LossAssessmentApi.PageParams,
  parentId?: number,
) {
  // Mock Logic for Tree Table
  return new Promise<LossAssessmentApi.ListResult>((resolve) => {
    setTimeout(() => {
      let list = [];
      if (parentId) {
        list = mockData.filter((item) => item.parentId === parentId);
      } else {
        list = mockData.filter((item) => item.type === 1);
        if (params.name) {
          const name = params.name;
          list = list.filter((item) => item.name.includes(name));
        }
      }
      resolve({
        list,
        total: list.length,
      });
    }, 500);
  });
}

export async function LossAddApi(data: LossAssessmentApi.LossAssessmentItem) {
  return new Promise<LossAssessmentApi.Result>((resolve) => {
    setTimeout(() => {
      const newId = Math.max(...mockData.map((i) => i.id)) + 1;
      mockData.push({
        ...data,
        id: newId,
        created: new Date().toLocaleString().replaceAll('/', '-'),
        status: data.status || 1,
        hasChild: data.type === 1,
      });
      resolve({ result: 'success' });
    }, 500);
  });
}

export async function LossUpdateApi(
  data: LossAssessmentApi.LossAssessmentItem,
) {
  return new Promise<LossAssessmentApi.Result>((resolve) => {
    setTimeout(() => {
      const index = mockData.findIndex((i) => i.id === data.id);
      if (index !== -1) {
        mockData[index] = {
          ...mockData[index],
          ...data,
          updated: new Date().toLocaleString().replaceAll('/', '-'),
        };
      }
      resolve({ result: 'success' });
    }, 500);
  });
}

export async function LossDelApi(id: number) {
  return new Promise<LossAssessmentApi.Result>((resolve) => {
    setTimeout(() => {
      // Remove item and its children if any
      mockData = mockData.filter(
        (item) => item.id !== id && item.parentId !== id,
      );
      resolve({ result: 'success' });
    }, 500);
  });
}

export async function LossGetApi(id: number) {
  return new Promise<LossAssessmentApi.LossAssessmentItem>((resolve) => {
    setTimeout(() => {
      const item = mockData.find((i) => i.id === id);
      resolve(item as LossAssessmentApi.LossAssessmentItem);
    }, 200);
  });
}
