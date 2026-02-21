# card-entry-v3 增补方案：以 V3 为基础归并 V1/V2 数据

## 一、三个版本对比摘要

| 维度 | card-entry（V1） | card-entry-v2（V2） | card-entry-v3（V3） |
|------|------------------|---------------------|---------------------|
| **交互** | 6 步向导，每步独立页 | 6 步向导 + 顶部流程条 + 当前步预览 | 单页滚动，CamCard 式区块 |
| **数据源** | GET /api/card-entry/data | 同上 | 当前仅 GET /api/cards/my |
| **保存** | save-step/1～6 分步 | 同上 | 当前仅 save-step/1（部分字段） |
| **定位** | 校友圈完整录入、代填、多表 | 简化步骤、与后端 6 步一致 | 名片全能王风格、单页编辑 |

---

## 二、V3 当前结构（保持不变为“壳”）

1. 名片样式  
2. **基本信息**：头像、姓名、公司、职位、社会团体、行业、认证状态；+ 多公司多职位  
3. **联系方式**：手机、微信、邮箱、地址  
4. 个人介绍  
5. 名片附件（PDF）  
6. 业务介绍、企业介绍  
7. **工作经历**（列表）  
8. **教育经历**（列表）  
9. 上传纸质名片  
10. 底部：预览名片、保存  

数据字段（当前）：`avatar, name, company, title, association_title, industry, contacts[], address, personalIntro, workExperiences[], eduExperiences[], paperCards[]`  
加载：`/api/cards/my`；保存：`/api/card-entry/save-step/1`（name, company, title, phone, wechat_id, email, main_address, bio）

---

## 三、V1/V2 有而 V3 缺的“数据内容”

### 3.1 来自 V1 Step1 / V2 Step1（基本信息与名片）

- **V1 独有**：`nickname`、`gender`、`birth_place`、`locations[]`（多地址）、`personal_photos[]`、`field_visibility`（字段级可见性）、`selected_avatar`（预设头像）  
- **V2**：`company_title`（公司+职位合一）、`association_title`、`main_address`、`field_visibility`  
- **归并建议**：  
  - V3 保留「姓名、公司、职位、社会团体、行业」；**增补**：昵称、性别、籍贯、**字段可见性**（可做成每行旁的 ☰，与 V2 一致）。  
  - 地址：V3 当前单条 `address` 对应 `main_address` 或 `locations[0].address`；多地址可后续再考虑，先单条即可。  
  - 个人照片、预设头像：V3 可先不展示，数据层保留字段即可，便于以后扩展。

### 3.2 来自 V1 Step2 / V2 Step3（教育）

- **V1**：极细（小/初/高/本/硕/博：学校、专业、毕业年）、`highest_degree`  
- **V2**：`raw`（自由文本）、`schools`  
- **V3**：已有「教育经历」列表（school, degree, duration）  
- **归并建议**：  
  - **以 V3 的列表为主**，每条仍为「学校 + 学历/专业 + 时间」。  
  - 加载时：从 `/api/card-entry/data` 的 `step2` 取出教育数据，**映射为 V3 的 `eduExperiences[]`**（如 bachelor_university + bachelor_major + bachelor_graduation_year → 一条；master 同理）。  
  - 保存时：从 `eduExperiences[]` 再写回后端 step2 结构（或仅保存一条“最高学历”的学校/专业/年份，视后端 step2 接口而定）。  
  - 若后端 step2 是 V1 的细结构，可只映射「本/硕/博」三条到 V3 列表，其余字段在编辑单条时再写回。

### 3.3 来自 V1 Step3 / V2 Step3（需求与状态）

- **V1**：`marital_status`、`dating_need`、`job_seeking`、`entrepreneurship_need` 等  
- **V2**：合并为「校友」一步的 `raw`、`schools`  
- **归并建议**：  
  - V3 不单独做“需求与状态”整块，避免表单过长。  
  - 若有「个人介绍」旁的简短需求（如求职/创业），可放在**个人介绍**的说明文案或一段简短可选项里，数据仍写 step3；或**暂不增补**，先保证主流程。

### 3.4 来自 V1 Step4 / V2 Step4（资源与需求）

- **V1/V2**：`resources[]`（列表）、V2 另有 `raw` 自由文本  
- **V3**：无  
- **归并建议**：  
  - 在 V3 中**新增一块「资源与需求」**（放在「企业介绍」之后、「工作经历」之前，或放在「教育经历」之后）。  
  - 内容：列表 `resources[]`（每条可标题+描述）+ 可选一句 `raw`。  
  - 数据：加载自 `/api/card-entry/data` 的 `step4`；保存用 `save-step/4`。

### 3.5 来自 V1 Step5 / V2 Step5（社团/校友会）

- **V1**：`willing_to_serve`、`board_position`、`association_positions[]`、`support_offerings[]`、`association_needs_detail` 等  
- **V2**：`orgs`、`willing_to_serve`、`board_position`、`association_positions[]`、`contribution_types`  
- **V3**：无  
- **归并建议**：  
  - 在 V3 中**新增一块「社团 / 校友会参与」**（建议放在「资源与需求」之后、「工作经历」之前）。  
  - 内容：是否愿意为校友会出力（开关）、参与组织/职位（简短列表或文本）、可选“贡献类型”等。  
  - 数据：加载自 `step5`；保存用 `save-step/5`。

### 3.6 来自 V1 Step6 / V2 Step6（补充/隐藏信息）

- **V1/V2**：`hidden_info`（如 description）  
- **V3**：无  
- **归并建议**：  
  - 在 V3 底部（上传纸质名片之后、按钮之前）**新增可折叠「补充信息」**，对应 `step6.hidden_info`。  
  - 数据：加载/保存用 `save-step/6`。若希望简化，可首版不做，仅预留数据层。

---

## 四、数据加载与保存策略

### 4.1 谁在先、谁在后（优先级）

- **以 V3 的 UI 与区块顺序为“主顺序”**（见第二节）。  
- **数据内容**：以**后端 `/api/card-entry/data` 为唯一真相源**；`/api/cards/my` 仅作补充或首屏快速展示（可选）。  
- 建议：**V3 的 loadData 改为先调 GET /api/card-entry/data**，得到 step1～step6 后，**再映射到 V3 的 data 结构**（见下）；若需要头像等可从 `/api/cards/my` 补一层。

### 4.2 字段映射表（data → V3 页面数据）

| 后端 data（step1～6） | V3 页面字段 / 区块 |
|----------------------|--------------------|
| step1.name, nickname, company, title, wechat_id, phone, email, bio, locations[0].address, association_title, gender, birth_place, field_visibility, avatar/selected_avatar | name, nickname(增), company, title, association_title, contacts[].value, address, personalIntro, industry(若后端有), field_visibility(增), gender(增), birth_place(增), avatar |
| step2（教育细表） | eduExperiences[]（多条映射） |
| step3 | 暂不展示或合并到个人介绍说明 |
| step4.resources, step4.raw | 新区块「资源与需求」 |
| step5 | 新区块「社团/校友会参与」 |
| step6.hidden_info | 可折叠「补充信息」 |

### 4.3 保存顺序与接口

- **一步保存（当前）**：仅 step1 → `POST /api/card-entry/save-step/1`（保持现有 payload 扩展 nickname、gender、birth_place、locations、field_visibility 等）。  
- **分步/分块保存（推荐）**：  
  - 基本信息+联系方式 → save-step/1  
  - 个人介绍（bio）→ 合在 step1 或单独 step1 再写 bio  
  - 教育经历 → save-step/2  
  - 资源与需求 → save-step/4  
  - 社团/校友会 → save-step/5  
  - 补充信息 → save-step/6  
- **工作经历**：后端若暂无单独表，可先只做前端展示与本地/扩展字段，或与 step1 的 company/title 合并为“当前公司职位”，多段经历以后端扩展后再持久化。

---

## 五、区块顺序建议（最终 V3 顺序）

1. 名片样式  
2. 基本信息（含昵称、性别、籍贯、可见性 ☰）  
3. 联系方式（含地址）  
4. 个人介绍  
5. 名片附件  
6. 业务介绍、企业介绍  
7. **资源与需求**（新增，对应 step4）  
8. **社团/校友会参与**（新增，对应 step5）  
9. 工作经历  
10. 教育经历  
11. 上传纸质名片  
12. **补充信息**（新增、可折叠，对应 step6，可选）  
13. 底部：预览、保存  

“个人介绍”与“资源与需求”谁更靠前可再定；若希望和 V2 的“简介→校友→事业”顺序略一致，可把「个人介绍」放在「联系方式」后，再「资源与需求」「社团」。

---

## 六、实施建议（不写代码，仅步骤）

1. **数据层**：V3 的 `loadData()` 改为调用 `/api/card-entry/data`，并实现 step1～step6 到 V3 各字段/列表的映射（含 step2→eduExperiences、step4→resources、step5→社团块）。  
2. **保存**：按区块分别组 payload，调用 save-step/1、2、4、5、6；step1 的 payload 补全 nickname、gender、birth_place、locations、field_visibility 等。  
3. **UI 增补**：在 V3 中按第五节顺序新增「资源与需求」「社团/校友会参与」「补充信息」三个区块；基本信息中增加昵称、性别、籍贯及可见性入口（☰）。  
4. **教育/工作**：教育经历列表与 step2 双向映射；工作经历若后端无表则仅前端展示或与 step1 合并。  
5. **兼容**：保留 `/api/cards/my` 的兼容（如仅用其做头像/昵称兜底），主数据仍以 card-entry/data 为准。

---

## 七、需要你拍板的点

1. **区块顺序**：是否采用第五节顺序？「资源与需求」与「社团」是否必须紧挨着「企业介绍」？  
2. **需求与状态（step3）**：是否在 V3 中完全不做，还是用一句说明+可选项合并进「个人介绍」？  
3. **工作经历**：是否暂不落库，只做前端展示与编辑，等后端有表再对接？  
4. **补充信息（step6）**：首版是否要做可折叠块，还是只预留数据层？  
5. **字段可见性（☰）**：是否在 V3 的每一行（姓名、公司、手机等）都加可见性设置，与 V2 一致？

确认后可按此方案在 V3 上实现数据与 UI 的增补与归并。
