# 理赔报案工单查询接口

> 供主系统调用，查询工单系统中所有类型为「理赔报案」的工单。**无需认证。**

---

## 接口信息

| 项目 | 说明 |
|------|------|
| **路径** | `GET /api/work-orders/claim-reports` |
| **认证** | 无需 Token |
| **Content-Type** | `application/json` |

---

## 请求参数（Query String）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 20 | 每页条数 |
| `status` | string | 否 | — | 工单状态筛选，不传则返回全部 |

### status 枚举值

| 值 | 说明 |
|----|------|
| `pending` | 待处理 |
| `processing` | 处理中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

---

## 请求示例

```bash
# 查询所有理赔报案工单（第 1 页）
curl "http://<工单系统地址>/api/work-orders/claim-reports?page=1&pageSize=20"

# 只查待处理的
curl "http://<工单系统地址>/api/work-orders/claim-reports?status=pending"

# 分页查已完成的
curl "http://<工单系统地址>/api/work-orders/claim-reports?page=2&pageSize=10&status=completed"
```

---

## 响应格式

```json
{
  "items": [
    {
      "id": 42,
      "orderNo": "WO202605120038",
      "type": "claim_report",
      "status": "processing",
      "priority": "P1",
      "customerName": "顺达物流",
      "contactName": "张经理",
      "contactPhone": "13800138000",
      "description": "保单 P202605001 出险，货物丢失 3 箱，申请理赔",
      "source": "external",
      "creatorId": 5,
      "handlerId": 6,
      "completedAt": null,
      "createdAt": "2026-05-12T08:30:00.000Z",
      "updatedAt": "2026-05-12T10:15:00.000Z",
      "creator": {
        "id": 5,
        "username": "liming",
        "name": "李明",
        "avatar": null
      },
      "handler": {
        "id": 6,
        "username": "wangfang",
        "name": "王芳",
        "avatar": null
      },
      "records": [
        {
          "id": 101,
          "content": "已联系客户核实出险情况，等待提交理赔材料",
          "createdAt": "2026-05-12T09:00:00.000Z",
          "creator": {
            "id": 6,
            "username": "wangfang",
            "name": "王芳"
          },
          "attachments": [
            {
              "id": 15,
              "fileName": "出险证明.pdf",
              "fileSize": 204800,
              "mimeType": "application/pdf"
            }
          ]
        }
      ]
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

---

## 字段说明

### 工单对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 工单 ID |
| `orderNo` | string | 工单号，格式 `WO + yyyyMMdd + 4位随机数` |
| `type` | string | 固定为 `claim_report`（理赔报案） |
| `status` | string | 当前状态：`pending` / `processing` / `completed` / `cancelled` |
| `priority` | string | 优先级：`P0`（紧急）/ `P1`（高）/ `P2`（中）/ `P3`（低） |
| `customerName` | string | 客户名称 |
| `contactName` | string | 联系人 |
| `contactPhone` | string | 联系电话 |
| `description` | string | 问题描述 |
| `source` | string | 来源：`internal`（内部）/ `external`（外部） |
| `creatorId` | number | 创建人 ID |
| `handlerId` | number | 处理人 ID |
| `completedAt` | string | 完成时间（ISO 8601），未完成时为 `null` |
| `createdAt` | string | 创建时间（ISO 8601） |
| `updatedAt` | string | 最后更新时间（ISO 8601） |
| `creator` | object | 创建人信息 |
| `handler` | object | 处理人信息 |
| `records` | array | 处理记录列表 |

### 处理记录对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 记录 ID |
| `content` | string | 处理内容 |
| `createdAt` | string | 记录创建时间 |
| `creator` | object | 记录创建人 |
| `attachments` | array | 附件列表 |

### 附件对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 附件 ID |
| `fileName` | string | 文件名 |
| `fileSize` | number | 文件大小（字节） |
| `mimeType` | string | 文件类型 |

---

## 注意事项

1. **无需认证**：此接口为外部开放接口，不需要 Bearer Token
2. **只返回理赔报案**：`type` 固定为 `claim_report`，不包含其他业务类型
3. **分页从 1 开始**：`page=1` 是第一页
