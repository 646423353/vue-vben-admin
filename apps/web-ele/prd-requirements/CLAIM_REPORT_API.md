# 理赔报案工单查询接口

> 供主系统调用，查询工单系统中所有类型为「理赔报案」的工单。**无需认证。**

---

## 接口信息

| 项目             | 说明                                 |
| ---------------- | ------------------------------------ |
| **路径**         | `GET /api/work-orders/claim-reports` |
| **认证**         | 无需 Token                           |
| **Content-Type** | `application/json`                   |

---

## 请求参数（Query String）

| 参数       | 类型   | 必填 | 默认值 | 说明                         |
| ---------- | ------ | ---- | ------ | ---------------------------- |
| `page`     | number | 否   | 1      | 页码                         |
| `pageSize` | number | 否   | 20     | 每页条数                     |
| `status`   | string | 否   | —      | 工单状态筛选，不传则返回全部 |

### status 枚举值

| 值           | 说明   |
| ------------ | ------ |
| `pending`    | 待处理 |
| `processing` | 处理中 |
| `completed`  | 已完成 |
| `cancelled`  | 已取消 |

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
      "description": "公司名称：XX物流\n\n城市名称：上海市\n\n...",
      "claimData": {
        "companyName": "顺达物流",
        "stopOwnerName": "张经理",
        "contactPhone": "13800138000",
        "cityName": "上海市",
        "stopName": "浦东站点",
        "riderId": "R12345",
        "riderName": "李四",
        "riderIdCard": "310000199001011234",
        "riderPhone": "13900139000",
        "accidentTime": "2026-05-20 14:30:00",
        "accidentAddress": "上海市浦东新区XX路XX号",
        "accidentDesc": "骑手在配送途中摔倒受伤",
        "injuryPart": "左腿骨折",
        "thirdPartyInfo": "无",
        "hospitalName": "上海市XX医院",
        "isHospitalized": "是",
        "treatmentAmount": "预计5000元",
        "policeOrLiability": "已报警，交警认定对方全责"
      },
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
| --- | --- | --- |
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
| `claimData` | object | 理赔报案结构化字段（见下方） |

### claimData 字段

| 字段                | 类型   | 说明                                |
| ------------------- | ------ | ----------------------------------- |
| `companyName`       | string | 公司名称（← customerName）          |
| `stopOwnerName`     | string | 站长姓名（← contactName）           |
| `contactPhone`      | string | 联系方式（← contactPhone）          |
| `cityName`          | string | 城市名称                            |
| `stopName`          | string | 站点名称                            |
| `riderId`           | string | 骑手ID                              |
| `riderName`         | string | 骑手姓名                            |
| `riderIdCard`       | string | 骑手身份证号                        |
| `riderPhone`        | string | 骑手电话                            |
| `accidentTime`      | string | 事发时间                            |
| `accidentAddress`   | string | 事发地点                            |
| `accidentDesc`      | string | 事故经过                            |
| `injuryPart`        | string | 受伤部位                            |
| `thirdPartyInfo`    | string | 三者信息                            |
| `hospitalName`      | string | 就诊医院                            |
| `isHospitalized`    | string | 是否住院                            |
| `treatmentAmount`   | string | 预计治疗金额                        |
| `policeOrLiability` | string | 报警/责任认定                       |
| `medicalDesc`       | string | 医疗情况描述（合并字段）            |
| `liabilityDesc`     | string | 责任认定情况（合并字段）            |
| `caseFiles`         | string | 案件文件URL列表                     |
| `extraFields`       | array  | 用户自定义扩展字段 `[{key, value}]` |

### 处理记录对象

| 字段          | 类型   | 说明         |
| ------------- | ------ | ------------ |
| `id`          | number | 记录 ID      |
| `content`     | string | 处理内容     |
| `createdAt`   | string | 记录创建时间 |
| `creator`     | object | 记录创建人   |
| `attachments` | array  | 附件列表     |

### 附件对象

| 字段       | 类型   | 说明             |
| ---------- | ------ | ---------------- |
| `id`       | number | 附件 ID          |
| `fileName` | string | 文件名           |
| `fileSize` | number | 文件大小（字节） |
| `mimeType` | string | 文件类型         |

---

---

## 导入理赔报案工单

> 供主系统调用，将结构化理赔报案数据导入为工单。**无需认证。**

| 项目             | 说明                                         |
| ---------------- | -------------------------------------------- |
| **路径**         | `POST /api/work-orders/claim-reports/import` |
| **认证**         | 无需 Token                                   |
| **Content-Type** | `application/json`                           |

### 请求体（JSON）

| 字段                | 类型     | 必填 | 说明                                 |
| ------------------- | -------- | ---- | ------------------------------------ |
| `companyName`       | string   | 是   | 公司名称 → 客户名称                  |
| `cityName`          | string   | 是   | 城市名称                             |
| `stopName`          | string   | 是   | 站点名称                             |
| `stopOwnerName`     | string   | 是   | 站长姓名 → 联系人                    |
| `contactPhone`      | string   | 是   | 联系方式（手机号）                   |
| `riderId`           | string   | 是   | 骑手ID                               |
| `riderName`         | string   | 是   | 骑手姓名                             |
| `riderIdCard`       | string   | 是   | 骑手身份证号                         |
| `riderPhone`        | string   | 是   | 骑手电话                             |
| `accidentTime`      | string   | 是   | 事发时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `accidentAddress`   | string   | 是   | 事发地点                             |
| `accidentDesc`      | string   | 是   | 事故经过                             |
| `injuryPart`        | string   | 是   | 受伤部位（物损情况）                 |
| `thirdPartyInfo`    | string   | 是   | 是否涉及三者（三者信息）             |
| `hospitalName`      | string   | 否   | 就诊医院名称                         |
| `isHospitalized`    | string   | 是   | 是否住院                             |
| `treatmentAmount`   | string   | 否   | 目前/预计治疗金额                    |
| `policeOrLiability` | string   | 否   | 是否报警或责任认定结果               |
| `imageUrls`         | string[] | 否   | 影像资料URL列表                      |

### 请求示例

```bash
curl -X POST "http://<工单系统地址>/api/work-orders/claim-reports/import" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "XX物流公司",
    "cityName": "上海市",
    "stopName": "浦东站点",
    "stopOwnerName": "张站长",
    "contactPhone": "13800138000",
    "riderId": "R12345",
    "riderName": "李四",
    "riderIdCard": "310000199001011234",
    "riderPhone": "13900139000",
    "accidentTime": "2026-05-20 14:30:00",
    "accidentAddress": "上海市浦东新区XX路XX号",
    "accidentDesc": "骑手在配送途中摔倒受伤",
    "injuryPart": "左腿骨折",
    "thirdPartyInfo": "无",
    "hospitalName": "上海市XX医院",
    "isHospitalized": "是",
    "treatmentAmount": "预计5000元",
    "policeOrLiability": "已报警，交警认定对方全责",
    "imageUrls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
  }'
```

### 响应

```json
{
  "id": 43,
  "orderNo": "WO202605200042",
  "type": "claim_report",
  "status": "pending",
  "priority": "P2",
  "customerName": "XX物流公司",
  "contactName": "张站长",
  "contactPhone": "13800138000",
  "description": "公司名称：XX物流公司\n\n城市名称：上海市\n\n...",
  "source": "external",
  "createdAt": "2026-05-20T14:35:00.000Z",
  "updatedAt": "2026-05-20T14:35:00.000Z"
}
```

### 字段映射规则

- `companyName` → `customerName`
- `stopOwnerName` → `contactName`
- `contactPhone` → `contactPhone`
- `injuryPart` / `hospitalName` / `isHospitalized` / `treatmentAmount` → 合并为「医疗情况描述」
- `thirdPartyInfo` / `policeOrLiability` → 合并为「责任认定情况」
- `imageUrls` → 「案件文件」列表
- 其余字段逐行存入 `description`

---

## 注意事项

1. **无需认证**：以上接口均为外部开放接口，不需要 Bearer Token
2. **只处理理赔报案**：导入接口 `type` 固定为 `claim_report`
3. **分页从 1 开始**：`page=1` 是第一页
