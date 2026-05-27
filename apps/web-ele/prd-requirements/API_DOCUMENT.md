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


---

## Feature 6: 用户权限调整（理赔模块角色扩展）

> 记录时间：2026-05-25
> 涉及模块：理赔模块（Case 系列接口）

### 6.1 修改概述

此前理赔模块仅对以下角色开放：
- `管理员`、`超级管理员`、`定损员`、`理赔客服`、`理赔员`、`初审及保司对接员`、`理赔管理员`

**本次新增开放角色：**
- `业务操作员` — 基础理赔操作权限
- `业务客户` — 基础理赔操作权限
- `业务管理员` — 完整理赔权限（同初审及保司对接员级别）

> **权限控制方式**：Shiro 数据库动态权限（`tb_permission` + `tb_role_perm` + `tb_shiro_filter`），无需前端额外传参，由后端根据登录用户角色自动判定。

---

### 6.2 权限不足时的返回

若用户角色未被授权某个接口，Ajax 请求将返回：

```json
{
  "success": false,
  "message": "抱歉，您没有该权限！看就看，你点它干什么..."
}
```

**前端处理建议：**
- 在调用理赔模块接口前，可根据用户角色预判是否展示对应按钮/菜单
- 收到上述返回时，提示用户"暂无权限"即可

---

### 6.3 角色权限映射表

#### `业务操作员` / `业务客户`（10 项权限）

| 权限 URL | 权限名称 | 对应接口 |
|:--|:--|:--|
| `/record/case/list` | 案件列表 | `POST /record/case/list` |
| `/record/case/add` | 创建案件 | `POST /record/case/add` |
| `/record/case/update` | 修改案件 | `POST /record/case/update` |
| `/record/case/unlock` | 提交便签 | `POST /record/case/unlock` |
| `/record/case/exception` | 转异常案件 | `POST /record/case/exception` |
| `/peifu/case/comment/add` | 赔付管理添加 | `POST /peifu/case/comment/add` |
| `/peifu/case/comment/update` | 赔付管理修改 | `POST /peifu/case/comment/update` |
| `/peifu/case/comment/post/add` | 赔付管理添加动作 | `POST /peifu/case/comment/post/add` |
| `/final/case/comment/add` | 最终赔付管理添加 | `POST /final/case/comment/add` |
| `/final/case/comment/update` | 最终赔付管理修改 | `POST /final/case/comment/update` |

#### `业务管理员`（20 项权限）

拥有 `业务操作员` 的全部 10 项权限，另外增加：

| 权限 URL | 权限名称 | 对应接口 |
|:--|:--|:--|
| `/dingsun/money/add` | 添加定损 | `POST /dingsun/money/add` |
| `/dingsun/money/update` | 修改定损 | `POST /dingsun/money/update` |
| `/duijie/case/comment/add` | 保司对接管理添加 | `POST /duijie/case/comment/add` |
| `/case/comment/update` | 保司对接管理修改 | `POST /case/comment/update` |
| `/duijie/case/comment/post/add` | 保司对接管理添加动作 | `POST /duijie/case/comment/post/add` |
| `/record/case/back` | 驳回案件 | `POST /record/case/back` |
| `/record/case/blcok` | 挂起案件 | `POST /record/case/blcok` |
| `/record/case/close` | 关闭案件 | `POST /record/case/close` |
| `/record/case/lipei/update` | 修改理赔员 | `POST /record/case/lipei/update` |
| `/record/case/lock` | 接单 | `POST /record/case/lock` |

> **注意**：`业务管理员` 的理赔权限与 `初审及保司对接员` 同级，覆盖案件全流程（创建 → 定损 → 保司对接 → 赔付 → 最终赔付 → 结案/挂起/驳回）。

---

### 6.4 理赔模块全量接口清单（按角色标注）

以下列出理赔模块所有接口，并标注各角色是否有权限访问。未在 `tb_shiro_filter` 中配置 `perms[...]` 的接口（即无需特殊权限，登录即可访问）不列入权限表。

#### 案件管理（Case2Controller / CaseController）

| 接口 | 方法 | 业务操作员/业务客户 | 业务管理员 |
|:--|:--:|:--:|:--:|
| `POST /record/case/list` | 查询案件列表 | ✅ | ✅ |
| `POST /record/case/add` | 创建案件 | ✅ | ✅ |
| `POST /record/case/update` | 修改案件 | ✅ | ✅ |
| `POST /record/case/lock` | 锁定/接单 | ❌ | ✅ |
| `POST /record/case/unlock` | 释放/提交便签 | ✅ | ✅ |
| `POST /record/case/lipei/update` | 修改理赔员 | ❌ | ✅ |
| `POST /record/case/close` | 结案 | ❌ | ✅ |
| `POST /record/case/exception` | 转异常 | ✅ | ✅ |
| `POST /record/case/blcok` | 挂起 | ❌ | ✅ |
| `POST /record/case/back` | 退回上一处理人 | ❌ | ✅ |
| `POST /record/case/export` | 导出案件 | — | — |
| `POST /record/case/importFromWorkOrder` | 外部工单导入 | — | — |
| `GET /record/case/summary` | 案件快捷汇总 | — | — |
| `GET /record/case/get` | 查询单个案件 | — | — |
| `POST /record/case/file/rotate` | 图片旋转 | — | — |

> `—` 表示该接口未配置 `perms` 权限控制，登录用户均可访问。

#### 定损管理（CaseMoneyController / CaseMoney2Controller）

| 接口 | 方法 | 业务操作员/业务客户 | 业务管理员 |
|:--|:--:|:--:|:--:|
| `POST /dingsun/money/add` | 添加定损 | ❌ | ✅ |
| `POST /dingsun/money/update` | 修改定损 | ❌ | ✅ |

#### 保司对接（CaseCommentController / CaseComment2Controller）

| 接口 | 方法 | 业务操作员/业务客户 | 业务管理员 |
|:--|:--:|:--:|:--:|
| `POST /duijie/case/comment/add` | 添加保司对接 | ❌ | ✅ |
| `POST /case/comment/update` | 修改保司对接 | ❌ | ✅ |
| `POST /duijie/case/comment/post/add` | 添加保司动作 | ❌ | ✅ |

#### 赔付管理（CasePeifuController）

| 接口 | 方法 | 业务操作员/业务客户 | 业务管理员 |
|:--|:--:|:--:|:--:|
| `POST /peifu/case/comment/add` | 添加赔付记录 | ✅ | ✅ |
| `POST /peifu/case/comment/update` | 修改赔付记录 | ✅ | ✅ |
| `POST /peifu/case/comment/post/add` | 添加赔付动作 | ✅ | ✅ |

#### 最终赔付（CaseFinalController）

| 接口 | 方法 | 业务操作员/业务客户 | 业务管理员 |
|:--|:--:|:--:|:--:|
| `POST /final/case/comment/add` | 添加最终赔付 | ✅ | ✅ |
| `POST /final/case/comment/update` | 修改最终赔付 | ✅ | ✅ |

---

### 6.5 前端适配建议

**1. 菜单/按钮显隐控制**

建议前端根据当前登录用户的 `roleNames` 字段（从 `/user/info` 或登录接口返回）控制理赔模块入口的显示：

```javascript
// 示例：判断是否展示理赔菜单
const canAccessLipei = [
  '管理员', '超级管理员', '业务管理员',
  '业务操作员', '业务客户',
  '理赔员', '理赔客服', '理赔管理员', '初审及保司对接员', '定损员'
].includes(user.roleNames);
```

**2. 案件列表页特殊逻辑**

`Case2Controller.list()` 中对 `理赔客服` 角色有硬编码处理：若用户为 `理赔客服`，查询时会强制 `status = 3`（仅显示"我参与的"案件）。

`业务操作员` / `业务客户` / `业务管理员` **不受此限制**，可正常查询全部案件（受数据权限过滤）。

**3. 数据权限说明**

即使拥有接口权限，部分查询接口仍会根据用户角色返回不同的数据范围：
- `管理员` / `超级管理员` / `理赔管理员` / `初审及保司对接员` / `业务主管` / `业务管理员`：返回全平台数据
- `业务操作员` / `业务客户`：仅返回本人创建/关联的数据
- `理赔客服`：仅返回 status=3 的数据

---

### 6.6 相关数据库角色 ID 速查

| 角色名 | role_id | 理赔权限级别 |
|:--|:--:|:--|
| 超级管理员 | 1 | 完整 |
| 管理员 | 13 | 完整 |
| 业务主管 | 14 | 完整（代码硬编码） |
| 业务操作员 | 15 | 基础（10项） |
| 业务客户 | 16 | 基础（10项） |
| 业务管理员 | 17 | 完整（20项） |
| 理赔员 | 18 | 完整（代码硬编码） |
| 理赔客服 | 19 | 基础（10项）+ 强制 status=3 |
| 初审及保司对接员 | 21 | 完整（20项） |
| 理赔管理员 | 22 | 完整（20项） |
| 定损员 | 未确认 | 定损相关 |

---

*文档结束*


## Feature 7: 外部理赔工单快速建立理赔案件

> 记录时间：2026-05-18
> 涉及模块：理赔模块（Case2Controller）

### 7.1 功能说明

来自工单系统的外部工单（类型为理赔报案），其问题描述中的结构化数据可以快速引入理赔案件创建流程，自动填充案件字段。

**接口：**

```http
POST /case/importFromWorkOrder
```

**请求体（WorkOrderImportDto）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| companyName | string | 是 | 公司名称 → 映射为 `客户名称` |
| cityName | string | 是 | 城市名称（无对应字段，忽略） |
| stopName | string | 是 | 站点名称 → 映射为 `站点名称/归属站点` |
| stopOwnerName | string | 是 | 站长姓名 → 映射为 `站长姓名` |
| contactPhone | string | 是 | 联系方式 → 映射为 `联系方式` |
| riderId | string | 是 | 骑手ID → 映射为 `骑手ID` |
| riderName | string | 是 | 骑手姓名 → 映射为 `骑手姓名` |
| riderIdCard | string | 是 | 骑手身份证号 → 映射为 `骑手身份证号` |
| riderPhone | string | 是 | 骑手电话 → 映射为 `骑手电话` |
| accidentTime | string | 是 | 事发时间，格式 `yyyy-MM-dd HH:mm:ss` → 映射为 `事故时间` |
| accidentAddress | string | 是 | 事发地点 → 映射为 `事故地址` |
| accidentDesc | string | 是 | 事故经过 → 映射为 `出险事故详细描述` |
| injuryPart | string | 是 | 受伤部位（物损情况）→ 合并到 `医疗情况描述` |
| thirdPartyInfo | string | 是 | 是否涉及三者（三者信息）→ 合并到 `责任认定情况` |
| hospitalName | string | 否 | 就诊医院名称 → 合并到 `医疗情况描述` |
| isHospitalized | string | 是 | 是否住院 → 合并到 `医疗情况描述` |
| treatmentAmount | string | 否 | 目前/预计治疗金额 → 合并到 `医疗情况描述` |
| policeOrLiability | string | 否 | 是否报警或责任认定结果 → 合并到 `责任认定情况` |
| imageUrls | string[] | 否 | 影像资料URL列表 → 映射为案件文件 |

**字段合并规则：**

- **医疗情况描述**（合并字段，带字段名前缀）：
  ```
  受伤部位（物损情况）：xxx；就诊医院名称：xxx；是否住院：xxx；目前/预计治疗金额：xxx；
  ```
- **责任认定情况**（合并字段，带字段名前缀）：
  ```
  是否涉及三者（三者信息）：xxx；是否报警或责任认定结果：xxx；
  ```
- **事故经过**：直接填入

**响应：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "companyName": "...",
    "stopName": "...",
    "name": "骑手姓名",
    "creditcard": "身份证号",
    "phone": "骑手电话",
    "address": "事故地址",
    "accidentTime": "2026-05-01 14:30:00",
    "insureTime": "2026-05-01 14:30:00",
    "details": "事故经过：...\n医疗情况描述：...\n责任认定情况：...",
    "files": [
      { "url": "...", "title": "工单影像资料", "status": 1 }
    ]
  }
}
```

> ⚠️ **注意**：本接口**不直接创建案件**，仅返回映射后的 `TbCaseInfo` 数据，供前端在案件创建页面自动填充字段。前端仍需调用 `POST /record/case/add` 完成案件创建。

---

## Feature 8: 案件关联保单逻辑优化（新职伤）

> 记录时间：2026-05-18
> 涉及模块：理赔模块（案件创建/修改）

### 8.1 核心流程变化

**原流程**：基本信息 → 自动匹配保单 → 手动填写（可选）
**新流程**：基本信息 → 手动填写保单（下方展示系统匹配到的保单，点击【选择填充】自动填入对应险种）

### 8.2 新增"新职伤"类型保单

案件表 `tb_case` 新增新职伤保单字段组（结构与主险、附加险完全一致）：

| 字段 | 说明 |
|------|:--|
| `insured_xinzhishang` | 新职伤保单号 |
| `caseno_insured_xinzhishang` | 新职伤报案号 |
| `insured_xinzhishang_name` | 新职伤名称 |
| `company_xinzhishang` | 新职伤保险公司 |
| `tbr_xinzhishang` | 新职伤投保人名称 |
| `tbr_cardtype_xinzhishang` | 新职伤投保人证件类型 |
| `tb_card_xinzhishang` | 新职伤投保人证件号 |
| `bbr_xinzhishang` | 新职伤被保人名称 |
| `bbr_cardtype_xinzhishang` | 新职伤被保人证件类型 |
| `bb_card_xinzhishang` | 新职伤被保人证件号 |
| `shougong_xinzhishang` | 新职伤是否手动填写（0=自动匹配，1=手动） |

**前端适配：**
- 手动录入保单页面新增【新职伤保险信息】模块
- 每个险种增加"是否手动填写"开关
- 系统匹配的保单列表增加显示：起保日期、终保日期、险种方案名称

### 8.3 保单信息调整为非必填

- 主险及所有保单信息均调整为**非必填**
- 是否手动填写报案跟随独立险种变化

---

## Feature 9: 定损表-责任判定功能优化

> 记录时间：2026-05-18
> 涉及模块：理赔模块（定损/案件创建）

### 9.1 文字调整

- 【出险判定表】全部改为【**责任认定表**】

### 9.2 案件创建中增加快速责任判定入口

**前端位置**：创建案件最后一步（补充详细资料区域）→ 图像区域下方 → 提交按钮上方

**规则：**
- 字段与定损表中的责任判定表完全一致
- 所有字段**非必填**
- 标题旁增加小字提示：`非必填，仅理赔人员使用`
- 拥有创建案件权限的账号均可填写，不受后续权限限制（等同于创建人操作时创建了定损表）
- 一旦关闭创建流程，该表的编辑权限受当前账号权限体系限制

### 9.3 定损/保司对接部分字段转为非必填

部分原必填字段调整为非必填，具体字段以产品PRD为准。

---

## Feature 10: 案件详情页交互优化

> 记录时间：2026-05-18
> 涉及模块：理赔模块（案件详情页）

### 10.1 操作便签样式调整

| 调整项 | 说明 |
|--------|:--|
| 操作按键区位置 | 更新基础信息、新建定损表、添加保司对接表、添加骑手对接表 → 提高到卡片标题栏下方、操作数据区域上方 |
| 活跃便签提示 | 左上方外侧增加小字：`请使用以下高亮操作区域进行本次操作；提交后，结果将被记录。` |
| 历史便签时间 | 正确显示提交时间和用时记录 |
| 操作者昵称颜色 | 改为与权限颜色（便签描边颜色）一致 |
| 提示文字字号 | 加大历史/处理中提示文字的字号和颜色，加强间隔线 |
| 历史便签边框 | 统一使用灰色，不再使用权限颜色 |
| 文字调整 | `应赔付总金额` 改为 `评估应赔付总金额` |

### 10.2 【添加赔付表】模块拆分

**原设计**：单个【添加赔付表】按钮，同时触发骑手对接表和最终赔付结果
**新设计**：拆分为两个独立按钮

| 按钮 | 位置 | 功能 |
|------|:--|:--|
| **添加骑手对接表** | 保司对接表按钮前方 | 弹出骑手对接表创建弹窗（原赔付协商表），不触发最终赔付区 |
| **添加赔付结果** | 按键行最后一个 | 出现最终赔付区 + 打开"添加"弹窗；保留最终赔付区栏目标志可见 |

**文字调整：**
- 原"赔付协商记录表" → 【骑手对接表】
- 原"最终赔付区" → 【最终赔付结果】
- 骑手对接表在便签中位置改到保司对接表上方

### 10.3 基本信息区域展示调整

- 栏目区域**独立展开**：进入页面默认展开基本信息，其他栏目缩进
- 用户可点击右侧 ▼ 型按钮手动展开/收起
- 新增【**赔付摘要**】栏（独立展开）

**赔付摘要展示字段：**
- 事故类型、责任类型、特殊判定
- 骑手-[主险最终赔付金额 / 附加险最终赔付金额 / 新职伤最终赔付金额]
- 三者1-[主险最终赔付金额 / 附加险最终赔付金额 / 新职伤最终赔付金额]

> 说明：事故类型/责任类型/特殊判定与最新定损表责任认定表字段一致；主险/附加险/新职伤最终赔付金额取自最终赔付表中有数值的数据。

---

## Feature 11: 结案功能和结案原因标签

> 记录时间：2026-05-18
> 涉及模块：理赔模块（Case2Controller）

### 11.1 接口变更

```http
POST /record/case/close
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| caseId | int | ✅ | 案件号 |
| reason | string | ✅ | 结案备注 |
| command | string | ✅ | 留言 |
| closeReasonTag | string | ❌ | 结案原因标签：`案件注销` / `拒赔结案` / `已赔付结案` |

**前端适配：**
- 【已确认赔付结案】按钮文字改为【**提交结案**】
- 弹窗标题同步改为【提交结案】
- 增加结案原因标签选择（下拉固定值）

### 11.2 线下状态对照表

| 线下常用状态 | 线上案件状态 - 状态原因标签 |
|:--|:--|
| 注销零结 | 结案 - 案件注销 |
| 拒赔 | 结案 - 拒赔结案 |
| 已结案-仅附加险赔付 | 结案 - 已赔付结案 |
| 已结案-仅主险赔付 | 结案 - 已赔付结案 |
| 已结案-主险&附加险赔付 | 结案 - 已赔付结案 |
| 已结案-仅新职伤赔付 | 结案 - 已赔付结案 |
| 已结案-新职伤&附加险赔付 | 结案 - 已赔付结案 |

---

## Feature 12: 案件列表页显示功能优化

> 记录时间：2026-05-18
> 涉及模块：理赔模块（案件列表查询）

### 12.1 新增列表展示字段

案件列表查询返回每个案件的最新状态（按险种/主体分组）：

| 新增字段 | 说明 | 示例 |
|----------|------|------|
| `commentStatusText` | 保司对接最新状态（按险种分组） | "主险-保司审核 附加险-保司反馈" |
| `peifuStatusText` | 骑手对接最新状态（按主体分组） | "骑手-初步协商一致 三者-无法联系" |
| `finalPayText` | 最终赔付结果（按主体分组，有数据才显示） | "骑手-[主险-1000 附加险-200] 三者-[主险-500]" |
| `insureTypeDisplay` | 出险类型展示 | "自身受伤" / "三者受伤" / "三者物损" |
| `specialTags` | 案件特殊标签（定损特殊标签） | "特殊判定标签,三者死亡" |

> **注意**：这些字段为 `TbCaseWithBLOBs` 的 transient 字段，由后端在查询时动态组装，前端直接展示即可。

### 12.2 新增筛选条件

`TbCaseDto` 新增筛选字段：

| 字段 | 说明 | 实现方式 |
|------|------|---------|
| `closeReasonTag` | 结案原因标签 | SQL criteria |

### 12.3 新增节点/状态筛选

- 增加关键状态（节点）显示
- 增加理赔进度筛选和节点显示
- 增加关键状态分类筛选功能
- 增加理赔员筛选显示

### 12.4 案件列表导出

案件列表支持 Excel 导出，导出字段包含上述新增展示字段。

---

## Feature 13: 图像查看方向调整

> 记录时间：2026-05-18
> 涉及模块：理赔模块（Case2Controller）

### 13.1 接口

```http
POST /record/case/file/rotate
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|:--|
| fileId | int | ✅ | 文件记录 ID |
| rotateAngle | int | ✅ | 旋转角度，取值：`0` / `90` / `180` / `270` |

**响应：**

```json
{
  "code": 200,
  "message": "success",
  "data": "更新成功"
}
```

**前端适配：**
- 任意入口查看案件图片时，增加旋转按钮（顺时针 90°）
- 每次点击顺时针旋转 90°，循环取值 0→90→180→270→0
- 旋转角度保存到数据库 `tb_case_files.rotate_angle`
- 下次打开图片时，按保存的角度自动旋转显示

---

## Feature 14: 遗留 Bug 修复说明

> 记录时间：2026-05-18
> 涉及模块：理赔模块

| Bug | 状态 | 说明 |
|:--|:--:|:--|
| 创建保司对接表时保单加载过慢 | ✅ 已修复 | 创建保司对接时不再加载系统保单 |
| 系统保单缺少保险公司名称字段 | ✅ 已说明 | 系统无此字段，需手动根据险种方案名称补充 |
| 报案时身份证号作为判定，骑手姓名没有验证 | ✅ 已说明 | 骑手姓名后置匹配无法验证，不作为匹配保单要素 |

---

*文档结束 - V2.6 理赔模块全量接口文档*
