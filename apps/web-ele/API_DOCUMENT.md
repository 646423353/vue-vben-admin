# eQiBao 后端接口说明书

> 适用版本：Feature 1 ~ Feature 4 全量接口
> 最后更新：2026-05-14

---

## 目录

- [Feature 1: 错单补投](#feature-1-错单补投)
- [Feature 2: 连续长期订单支持](#feature-2-连续长期订单支持)
  - [2.1 订单日期修订](#21-订单日期修订)
  - [2.2 保险编码修订](#22-保险编码修订)
  - [2.3 人员查询/导出范围筛选](#23-人员查询导出范围筛选)
- [Feature 3: 客户完全关闭](#feature-3-客户完全关闭)
- [Feature 4: 分组补充应用](#feature-4-分组补充应用)
- [Feature 5: 历史投保人快速填充](#feature-5-历史投保人快速填充)

---

## 通用说明

| 项目 | 说明 |
|------|------|
| **Base URL** | `https://shop.bjhfbx.cn/qishou/api` |
| **Content-Type** | `application/json` |
| **认证方式** | Cookie / Session（Shiro） |
| **返回格式** | `Result<T>`，`data` 字段为实际数据 |

**通用返回结构：**

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code=200`：成功
- `code=500`：失败，`message` 为错误提示

---

## Feature 1: 错单补投

### 1.1 检查保单是否可补投

```http
GET /policy/auto/buTou/check?policyId={policyId}
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| policyId | int | ✅ | 保单 ID |

**响应：**

```json
{
  "code": 200,
  "data": true      // true: 可以补投  false: 不可补投
}
```

**不可补投的情况：**
- 保单不存在
- 当前状态不是失败（`status != 5`）
- 来源不是自动投保（`source != 0`）
- 超过当日 23:20
- 已有补投记录

---

### 1.2 提交补投（准备阶段）

```http
POST /policy/auto/buTou/submit
```

**请求体：**

```json
{
  "policyId": 12345,
  "members": [
    {
      "username": "张三",
      "creditcard": "110101199001011234",
      "phone": "13800138000"
    }
  ]
}
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| policyId | int | ✅ | 原始失败保单 ID |
| members | List<TbMember> | ✅ | 补投人员名单 |

**响应：**

```json
{
  "code": 200,
  "data": "L20260508123456"   // 新创建的补投订单号 orderId
}
```

**说明：**

`submit` 是**数据准备阶段**，完成以下操作：
1. 校验原保单状态（必须是失败 + 自动投保来源）
2. 创建新订单（复制原订单信息，`source_type=1` 标识为补投订单）
3. 创建保单记录和订单成员
4. 创建 `TbBuTouRecord`，状态为 `0`（待执行）

submit **不调用外部投保 API**，仅做数据准备。返回的 `orderId` 用于下一步 `exec` 调用。

---

### 1.3 执行补投 API 投保（执行阶段）

```http
POST /policy/auto/buTou/exec
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| orderId | String | ✅ | submit 返回的补投订单号 |

**响应：**

```json
{
  "code": 200,
  "data": "补投任务已启动"
}
```

**说明：**

`exec` 是**实际执行阶段**，完成以下操作：
1. 查询补投订单和补投记录
2. 更新记录状态为 `1`（执行中）
3. 调用外部投保 API 进行实际投保
4. 异步获取 PDF，回填原投保记录

**为何分两步？**
- `submit` 只做数据准备（快速、同步、可控）
- `exec` 调用外部 API（耗时、异步、可能失败）
- 分离后前端可以先显示"补投订单已创建"，再触发执行

**前端调用流程：**
```
1. 用户点击【错单补投】→ 前端展示人员名单确认弹窗
2. 用户确认 → 调 /policy/auto/buTou/submit（创建补投订单）
3. submit 成功后 → 调 /policy/auto/buTou/exec（执行投保）
4. exec 成功后 → 轮询 /policy/auto/buTou/pdfStatus 获取 PDF
```

---

### 1.4 查询保单的补投记录

```http
GET /policy/auto/buTou/records?policyId={policyId}
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| policyId | int | ✅ | 原始失败保单 ID |

**响应：**

```json
{
  "code": 200,
  "data": [
    {
      "id": 10086,
      "sourcePolicyId": 12345,
      "newOrderId": "L20260501xxxx",
      "status": 2,           // 0待执行 1执行中 2成功 3失败
      "memberCount": 10,
      "created": "2026-05-01 10:00:00"
    }
  ]
}
```

---

### 1.5 轮询补投保单 PDF 获取状态

```http
GET /policy/auto/buTou/pdfStatus?orderId={orderId}
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| orderId | String | ✅ | submit 返回的补投订单号 |

**响应：**

```json
{
  "code": 200,
  "data": "https://xxx.pdf"   // PDF 下载链接，null 表示尚未生成
}
```

**前端轮询策略：**
- exec 成功后，每隔 3~5 秒轮询一次
- `data` 返回非 null 链接时，停止轮询，展示"补投完成"并提供 PDF 下载
- 轮询超过 5 分钟仍无 PDF，提示"PDF 生成中，请稍后到投保记录查看"

---

### 1.6 投保记录列表（含补投状态）

```http
GET /task/post/list?page=1&size=10&orderId={orderId}&jobId={jobId}
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| page | int | ✅ | 页码 |
| size | int | ✅ | 每页条数 |
| orderId | String | ❌ | 订单号（精确查询） |
| jobId | int | ❌ | 任务 ID（精确查询） |

**响应：** `PageInfo<TbOrderPost>`

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "orderNo": "L20260501xxxx",
        "status": 5,              // 投保状态：5=投保失败
        "hasBuTou": 0,            // 是否已被补投：0=否 1=是
        "buTouStatus": null,      // 补投状态：null=未补投 2=补投成功 3=补投失败
        "buTouOrderNo": null,     // 补投产生的新订单号
        "buTouPdf": null,         // 补投保单 PDF 链接
        "created": "2026-05-01 10:00:00"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

**前端展示逻辑（投保记录列表）：**

| 投保状态 | hasBuTou | 前端展示 |
|:--:|:--:|:--|
| 失败（`status=5`） | `0` | 显示 **【错单补投】按钮**，点击可补投 |
| 失败（`status=5`） | `1` | 显示"已补投"，可点击跳转查看补投结果 |
| 成功（`status=2`） | - | 正常展示，无需补投 |

**点击【错单补投】按钮后的流程：**
1. 前端先调 `GET /policy/auto/buTou/check?policyId={保单ID}` 确认是否可补投
2. 可补投 → 展示人员名单确认弹窗（展示原订单成员列表）
3. 用户确认 → 调 `POST /policy/auto/buTou/submit` 创建补投订单
4. submit 成功返回 `orderId` → 调 `POST /policy/auto/buTou/exec?orderId=xxx` 执行投保
5. exec 成功 → 轮询 `GET /policy/auto/buTou/pdfStatus?orderId=xxx`
6. PDF 生成后 → 弹窗展示"补投成功"并提供 PDF 下载链接

**TbOrderPost 新增字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `hasBuTou` | Integer | 是否已被补投：`0`否 `1`是 |
| `buTouStatus` | Integer | 补投状态：`2`成功 `3`失败 |
| `buTouOrderNo` | String | 补投产生的新订单号 |
| `buTouPdf` | String | 关联补投保单的 PDF 链接 |

---

## Feature 2: 连续长期订单支持

### 2.1 订单日期修订

**接口：** `POST /order/gz/update`

**日期修订规则（后端校验）：**

| 规则 | 说明 |
|------|------|
| 晚间锁定 | 20:00-24:00 不允许修改订单日期和人员信息 |
| 起保时刻固定 | 起保日期时刻必须为 `00:00:00` |
| 终保时刻固定 | 终保日期时刻必须为 `23:59:59` |
| 起保日期锁定 | 已发生起保（当前时间 > 起保日前一日 20:00）不可修改 |
| 起保日期下限 | 不能早于当前日期的后天 |
| 终保日期锁定 | 订单已失效（当前日期 > 原终保日期）不能修改 |
| 终保日期下限 | 最早可修改为当前日期后天的 23:59:59 |

**请求体示例：**

```json
{
  "id": 1234,
  "consignTime": "2026-06-01 00:00:00",    // 起保日期（修改时传）
  "endTime": "2026-12-31 23:59:59",         // 终保日期（修改时传）
  "locationtype": "40-2-404"                // 保险编码（修改时传）
}
```

**错误响应示例：**

```json
{
  "code": 500,
  "message": "20点-24点不允许修订订单人员信息和日期"
}
```

---

### 2.2 保险编码修订

**接口：** `POST /order/gz/update`

编辑订单时传入新的 `locationtype`，与数据库中现有值不同时，自动记录日志。

**日志记录：** `TbOrderLog(type=5)`

---

### 2.3 人员查询/导出范围筛选

**查询接口：**

```http
POST /order/gz/members?page=1&size=10
```

**导出接口：**

```http
POST /order/gz/members/export
```

**直投查询接口：**

```http
POST /order/gz/members/person?page=1&size=10
```

**请求体：**

```json
{
  "rangeBeginTime": "2026-01-01",
  "rangeEndTime": "2026-12-31",
  "orderId": "1234,5678",
  "username": "张三",
  "creditcard": "110101"
}
```

**新增查询字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `rangeBeginTime` | Date | 查询区间起始日期（成员 beginTime >= 此值）|
| `rangeEndTime` | Date | 查询区间结束日期（成员 endTime <= 此值）|

**查询语义：**

```
成员 beginTime >= rangeBeginTime
且
成员 endTime <= rangeEndTime
```

**原有字段保留，可同时使用：**

| 原有字段 | 说明 |
|----------|------|
| `beginTime` | 起保日期精确等于 |
| `endTime` | 终保日期精确等于 |
| `insureTime` | 在保日期（查询此日期在保的成员）|
| `username` | 骑手姓名模糊搜索 |
| `creditcard` | 身份证号模糊搜索 |
| `customerId` | 客户 ID |
| `orderId` | 订单 ID（支持多个，逗号分隔）|
| `statusPerson` | 成员状态 |

---

## Feature 3: 客户完全关闭

### 3.1 修改客户状态（关闭）

```http
POST /customer/update
```

**请求体：**

```json
{
  "id": 123,
  "status": 6
}
```

**客户状态说明：**

| status | 状态名 |
|:--:|:--|
| 1 | 服务中（新建默认）|
| 2 | 跟进中 |
| 3 | 已停止服务 |
| 4 | 已撤单 |
| 5 | 已删除 |
| 6 | **已关闭** |

**关闭前置校验：**

- 客户必须**没有任何生效订单**（`endTime > now() 且 status != 1`）
- 否则返回：`"有生效订单无法关闭"`

**关闭后影响：**

| 场景 | 行为 |
|------|------|
| 新建订单 | 提示 `"客户状态为已关闭"` |
| 晚间邮件 | 不再发送 |
| 客户列表 | 不再展示（所有列表接口自动过滤 `status=6`）|

**成功响应：**

```json
{
  "code": 200,
  "data": "修改成功"
}
```

**失败响应：**

```json
{
  "code": 500,
  "message": "有生效订单无法关闭"
}
```

---

### 3.2 查询客户修改日志

```http
GET /customer/log/list?customerId=123&page=1&size=10
```

**日志类型：**

| type | 说明 |
|:--:|:--|
| 1 | 修改批处理时间 |
| 2 | 删除客户 |
| 3 | **关闭客户**（新增）|

---

## Feature 4: 分组补充应用

### 4.1 查询所有分组

```http
GET /tag/list?page=1&size=100
```

**响应：** `PageInfo<TbTags>`

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "tagName": "分组1"
      }
    ],
    "total": 10,
    "pageNum": 1,
    "pageSize": 100
  }
}
```

---

### 4.2 查询分组下的客户列表

```http
GET /tag/customers?tagId=1&page=1&size=20
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| tagId | int | ✅ | 分组 ID |
| page | int | ✅ | 页码 |
| size | int | ✅ | 每页条数 |

**响应：** `PageInfo<TbCustomer>`

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 101,
        "username": "某某科技有限公司",
        "status": 1,
        "mailAddress": "xxx@qq.com",
        "phone": "13800138000"
      }
    ],
    "total": 50,
    "pageNum": 1,
    "pageSize": 20
  }
}
```

**注意：**
- 自动排除 `status=5`（已删除）和 `status=6`（已关闭）的客户
- 可用于：创建自动投保名单时快速选择、创建账号时批量选择客户权限

---

## 附录：数据库状态码速查

### 客户状态 (TbCustomer.status)

| 值 | 含义 |
|:--:|:--|
| 1 | 服务中 |
| 2 | 跟进中 |
| 3 | 已停止服务 |
| 4 | 已撤单 |
| 5 | 已删除 |
| 6 | 已关闭 |

### 成员状态 (TbMember.statusPerson)

| 值 | 含义 |
|:--:|:--|
| 1 | 等待增员生效 |
| 2 | 在保 |
| 3 | 等待减员生效 |
| 4 | 不在保 |
| 5 | 起保前删除 |

### 订单日志类型 (TbOrderLog.type)

| 值 | 含义 |
|:--:|:--|
| 3 | 修改起保日期 |
| 4 | 修改终保日期 |
| 5 | 修改保险编码 |

### 客户日志类型 (TbCustomerLog.type)

| 值 | 含义 |
|:--:|:--|
| 1 | 修改批处理时间 |
| 2 | 删除客户 |
| 3 | 关闭客户 |

---

## Feature 5: 历史投保人快速填充

### 5.1 查询客户历史投保人列表

```http
GET /order/member/history?customerId={customerId}&page=1&size=20
```

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|:--:|:--|
| `customerId` | Integer | ✅ | - | 客户ID |
| `page` | int | ❌ | 1 | 页码 |
| `size` | int | ❌ | 20 | 每页条数 |

**响应：** `Result<PageInfo<TbCustomerToubaorenHistory>>`

```json
{
  "code": 200,
  "message": "执行成功",
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "size": 3,
    "total": 3,
    "pages": 1,
    "list": [
      {
        "id": 1,
        "customerId": 123,
        "tbrName": "张三",
        "tbCardtype": "身份证",
        "tbCard": "110101199001011234",
        "tbrPhone": "13800138000",
        "tbrAddress": "北京市朝阳区",
        "tbrEmail": "zhangsan@example.com",
        "created": "2025-01-15T10:30:00",
        "updated": "2025-05-10T14:20:00"
      }
    ]
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 记录ID |
| `customerId` | Integer | 所属客户ID |
| `tbrName` | String | 投保人姓名 |
| `tbCardtype` | String | 证件类型（身份证/护照/营业执照等） |
| `tbCard` | String | 证件号码 |
| `tbrPhone` | String | 手机号 |
| `tbrAddress` | String | 地址 |
| `tbrEmail` | String | 邮箱 |
| `created` | DateTime | 首次记录时间 |
| `updated` | DateTime | 最后更新时间 |

**前端使用流程：**

```
1. 用户进入订单创建/编辑页面
2. 前端调用 GET /order/member/history?customerId={当前客户ID}
3. 投保人姓名输入框旁展示下拉列表（显示 tbrName）
4. 用户选择某条历史记录
5. 前端自动填充：
   - 投保人姓名 → tbrName
   - 证件类型   → tbCardtype
   - 证件号码   → tbCard
   - 手机号     → tbrPhone
   - 地址       → tbrAddress
   - 邮箱       → tbrEmail
```

**去重逻辑：**

数据库使用 **6字段联合唯一索引** 去重：
```
(customer_id + tbr_name + tb_cardtype + tb_card + tbr_phone + tbr_address + tbr_email)
```
同一客户下，完全相同的投保人信息只会保留一条，重复提交自动更新 `updated` 时间。

**数据同步机制（后端自动维护，前端无需调用写入）：**

以下 7 个订单操作会自动同步投保人信息到历史表：
- `addOrderInfo` — 创建订单
- `addOrderInfoForApi` — API创建订单
- `submitBuTou` — 补投提交
- `updategenerateorderbypolicyid` — 按保单更新订单
- `updatepolicymember` — 更新保单成员
- `addpolicyforguest` — 游客投保
- `addpolicy` — 新增保单
