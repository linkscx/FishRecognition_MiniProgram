# FishRecognition_MiniProgram

基于微信小程序 + 微信云开发的鱼类体型识别应用，支持图片识别、结果保存、历史查询、导出与删除。

## 功能概览

- 识别页：
  - 支持相册/拍照上传（可多图）
  - 调用后端 `/pattern` 接口获取识别结果（目标鱼、体型、置信度）
  - 支持手动修正结果并保存到云数据库
  - 支持自动保存开关
  - 支持导出当前记录为 Excel
- 历史数据页：
  - 按数量、日期范围、体型查询历史记录
  - 预览历史图片
  - 导出查询结果为 Excel
  - 批量删除历史记录
- 我的页面：
  - 微信用户登录（头像/昵称）
  - 用户信息持久化

## 项目结构

```text
.
├── miniprogram/                 # 小程序前端
│   ├── pages/index/             # 识别页
│   ├── pages/search/            # 历史数据页
│   ├── pages/user-center/       # 用户中心页
│   └── pages/setting/           # 设置页
├── cloudfunctions/              # 云函数
│   ├── get_openId/              # 获取用户 openid
│   ├── search_pattern/          # 查询历史记录
│   ├── get_patternCount/        # 统计记录数
│   ├── remove_pattern/          # 删除记录
│   ├── create_patternExcel/     # 导出查询结果 Excel
│   └── create_excel/            # 导出单次结果 Excel（兼容）
└── cls/                         # 训练/实验相关目录（独立于小程序运行）
```

## 运行与部署

### 1. 环境准备

- 安装微信开发者工具
- 开通微信云开发环境
- 准备后端识别服务（提供 `POST /pattern` 接口）

### 2. 小程序配置

1. 用微信开发者工具打开本仓库
2. 在 `miniprogram/app.js` 中配置云环境 ID（`wx.cloud.init({ env: ... })`）
3. 在云数据库中创建集合：
   - `userInfo`
   - `patternInfo`
   - `urlInfo`（用于存放后端服务 URL）

### 3. 云函数部署

在微信开发者工具中分别上传并部署 `cloudfunctions/` 下各函数目录。

仅 `create_patternExcel` 与 `create_excel` 需要额外依赖（`node-xlsx`）。这两个云函数目录各自维护独立 `package.json`，请分别进入目录执行：

```bash
npm install
```

### 4. 后端接口约定

小程序会从 `urlInfo` 集合读取服务地址，并请求：

- `POST {serverUrl}/pattern`
- 请求体包含：`img_path`（图片临时 URL 数组）、`openid`

后端建议返回 JSON（HTTP 200）：

- 成功：`{ success: true, form: { type, shape, probability } }`
- 失败：`{ success: false, message: "错误信息" }`

说明：

- `type`：目标鱼标记（前端据此决定是否允许保存）
- `shape`：体型分类（如正常/瘦身）
- `probability`：置信度（0~100）

## 数据说明

- 请求参数 `img_path` 对应数据库字段 `_image_path`（命名不同但语义一致）
- `fileId`：云存储文件 ID（用于删除/追踪原图）
- `_image_path`：云存储临时访问地址（用于识别请求）
- `_image_name`：图片批次名称（时间戳格式，用于记录检索）

## 备注

- 仓库中的 `cls/README.md` 提供了独立模型环境示例（Conda + PyTorch CPU）。
- 当前仓库未提供完整自动化测试脚本，建议在微信开发者工具中进行联调验证。
