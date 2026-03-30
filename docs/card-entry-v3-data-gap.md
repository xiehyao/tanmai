# card-entry-v3 与 card-entry / card-entry-v2 数据差异排查报告

## 一、结论概览

| 类别 | 缺失项 | 建议合并位置 |
|------|--------|--------------|
| **Step1 基础** | 多地址 locations（落库逻辑仍待补），其余字段（field_visibility / selected_avatar / personal_photos）已在 v3 中实现 | 第 1 步「基本信息」+ 保存 payload |
| **Step2 教育** | 完整教育经历（小学/初中/高中/本/硕/博+毕业年、最高学历） | 第 1 步「教育经历」卡片或独立区块 |
| **Step3 需求** | 未调用 save-step/3，数据未落库 | 第 1 步「我的需求」保存时一并提交 step3 |
| **Step4 资源** | 未调用 save-step/4，数据未落库 | 第 1 步「我的资源」保存时一并提交 step4 |
| **Step5 社团** | desired_position、position_preferences 两字段 | 第 2 步「社团/校友会参与」卡片内 |
| **Step6 补充** | 未调用 save-step/6，补充信息未落库 | 第 1 步或第 2 步底部「补充信息」+ 保存 step6 |

---

## 二、逐项说明

### 1. Step1（基础与名片）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| name, nickname, gender, birth_place | ✅ | ✅ | ✅ | 已合并 |
| company, title, phone, email, wechat_id, bio | ✅ | ✅ | ✅ | 已合并（v3 为 contactItems + 单 bio） |
| **locations** | ✅ 数组，每项含 location_type / address / location_visibility | ✅ 简化为 main_address | ❌ 仅 main_address，无多地址、无类型与可见性 | v1 可多条地址并区分居住/工作地及可见性 |
| **field_visibility** | ✅ 各字段独立可见性，随 step1 提交 | ✅ step1 内 | ✅ v3 已将 field_visibility 一并随 step1 payload 提交 | 与 v1/v2 行为保持一致 |
| **avatar / selected_avatar** | ✅ 两者都存 | ✅ | ✅ v3 使用 avatar 展示，并在保存时同步 selected_avatar | 兼容后端区分微信头像与预设头像的需求 |
| **personal_photos** | ✅ 数组，随 step1 提交 | - | ✅ 支持多张相片 personal_photos，并随 step1 提交 | 与 v1 的多图相册行为对齐 |

**合并建议：**

- **locations**：在「联系方式」或「基本信息」下，用 contactItems 中 type=address 的项，构建 `locations[]`（含 location_type、address、location_visibility），在 `save-step/1` 的 payload 中一并提交；同时 loadData 时把接口返回的 `step1.locations` 转成 contactItems 的地址行 + 若后端支持 location_visibility 则同步到 fieldVisibility。
- **field_visibility**：在 `onSave` 与 `saveStepToServer(1)` 的 payload 中增加 `field_visibility: this.data.fieldVisibility`（或与后端约定 key 结构）。
- **selected_avatar**：payload 中增加 `selected_avatar: this.data.avatar`（若后端用 selected_avatar 存预设头像）。
- **personal_photos**：若需与 v1 一致，可在「个人介绍」或「基本信息」增加「个人相册」列表，并随 step1 提交 `personal_photos` 数组；否则仅保留当前单张相片亦可。

---

### 2. Step2（教育经历）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| 小学/初中/高中（校名+毕业年） | ✅ | 未单独展示 | ⚠️ v3 已通过 eduExperiences 列表展示（按 step2.primary_/middle_/high_* 映射），但尚未回写 step2 | 读取侧已对齐，保存逻辑仍待补 |
| 本科/硕士/博士（校名+专业+毕业年） | ✅ | 未单独展示 | ⚠️ v3 已按本科/硕士/博士生成多条 eduExperiences，用于展示；尚未回写 step2 结构 | 后端依然按 bachelor/master/doctor 字段存储 |
| highest_degree | ✅ | - | ⚠️ load 时带入，未单独编辑 | 可放在「教育经历」卡片或每条学历的 degree 中 |
| 保存 step2 | ✅ save-step/2 | - | ❌ 未调用 | 教育数据未落库 |

**合并建议：**

- **方案 A（推荐）**：保留 v3 的「教育经历」列表形式，在 **loadData** 时把 backend 的 step2（primary_school, middle_school, high_school, bachelor_university, bachelor_major, bachelor_graduation_year, master_*, doctor_*, highest_degree）映射成多条 eduExperiences；在 **保存** 时根据 eduExperiences 反推回 step2 结构（或约定后端支持「列表」写入），并调用 `save-step/2`。
- **方案 B**：在「教育经历」区块增加与 v1 一致的「小学/初中/高中/本科/硕士/博士」分组表单，直接对应 step2 各字段，保存时组 payload 调 `save-step/2`。

---

### 3. Step3（需求与状态）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| marital_status, dating_need, dating_preferences | ✅ | ✅（step3.raw） | ✅ 有 UI 与 state | v3 未调 save-step/3 |
| job_seeking, job_target_*, job_preferences | ✅ | ✅ | ✅ 有 UI 与 state | 同上 |
| entrepreneurship_need/type/description | ✅ | ✅ | ✅ 有 UI 与 state | 同上 |

**合并建议：**

- 在「我的需求」或整页「保存」时（或切换步骤时），组装 step3 的 payload（marital_status, dating_need, dating_preferences, job_seeking, job_target_position, job_target_industry, job_preferences, entrepreneurship_need, entrepreneurship_type, entrepreneurship_description），调用 `POST /api/card-entry/save-step/3`。若 v3 使用「当前用户」无 target_user_id，需确认后端是否支持「无 target_user_id 时用当前登录用户」；若仅支持 target_user_id，则 step3 需在带 user 上下文的保存流程中一并提交。

---

### 4. Step4（资源）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| resources[]（type/title/description/sharing_mode） | ✅ | ✅ | ✅ 有 UI 与 state | v3 未调 save-step/4 |

**合并建议：**

- 在「我的资源」或整页「保存」时，用 `this.data.resources` 组装 step4 payload（resources 数组），调用 `POST /api/card-entry/save-step/4`。同样需处理 target_user_id（当前用户）与后端约定。

---

### 5. Step5（社团/校友会参与）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| orgs / association_orgs | - | ✅ | ✅ associationOrgs | 已用 |
| willing_to_serve, board_position, association_positions, support_offerings | ✅ | ✅ | ✅ | 已合并 |
| contribution_types, contribution_description, association_needs_detail | ✅ | ✅ | ✅ | 已合并 |
| **desired_position** | ✅ 希望担任的职务（文本） | - | ✅ v3 第 2 步已新增输入并随 save-step/5 提交 | 对应 user_association_info.desired_position |
| **position_preferences** | ✅ 职务偏好说明 | - | ✅ v3 第 2 步已新增输入并随 save-step/5 提交 | 对应 user_association_info.position_preferences |

**合并建议：**

- （已实现）在第 2 步「社团/校友会参与」卡片中，在「校董会职务」「校友会职务」附近增加两项：
  - **愿意/希望担任的职务**（对应 desired_position，可单行输入或简短多行）
  - **职务偏好说明**（对应 position_preferences，可多行）
- （已实现）在 `saveStepToServer(2)` 的 step5 payload 中增加：`desired_position: this.data.xxx`, `position_preferences: this.data.xxx`（已在 v3 中加入 data / loadData / 保存逻辑）。

---

### 6. Step6（补充/隐藏信息）

| 数据项 | card-entry (v1) | card-entry-v2 | card-entry-v3 | 说明 |
|--------|-----------------|---------------|---------------|------|
| hidden_info（如 description） | ✅ | step6.raw | ✅ extraInfo 有 UI | v3 未调 save-step/6 |

**合并建议：**

- 在「补充信息」或页面底部保留/增加一个输入框，绑定 `extraInfo`，在保存时组装 `{ hidden_info: { description: this.data.extraInfo }, field_visibility: {} }`，调用 `POST /api/card-entry/save-step/6`。若 v3 无单独「补充信息」入口，可放在第 1 步底部或第 2 步底部一个可折叠区块。

---

## 三、保存流程与接口调用汇总

| 步骤 | v1 | v3 当前 | 建议 |
|------|----|--------|------|
| Step1 | 保存时提交 name, nickname, avatar, selected_avatar, locations, field_visibility, personal_photos, ... | v3 已提交 field_visibility / selected_avatar / personal_photos，locations 仍仅 main_address | 后续可补 locations 多地址写入逻辑 |
| Step2 | 保存时提交 step2 全量字段 | 未调用 save-step/2 | 在保存或切换步骤时根据 eduExperiences 组 payload 调 save-step/2 |
| Step3 | 保存时提交 step3 全量字段 | 未调用 save-step/3 | 在保存时提交 step3 |
| Step4 | 保存时提交 step4.resources | 未调用 save-step/4 | 在保存时提交 step4 |
| Step5 | 保存时提交 step5 含 desired_position, position_preferences | 已调 save-step/5，但缺少上述两字段 | payload 中增加 desired_position、position_preferences |
| Step6 | 保存时提交 step6.hidden_info | 未调用 save-step/6 | 在保存时提交 step6 |

---

## 四、后端与 v3 的约定注意点

1. **target_user_id**：v3 当前保存 step1 未带 `target_user_id`，后端若要求「修改他人」必须带 target_user_id，则 step1 在普通用户填自己时可能用 token 中的用户 id；step2–6 的 save-step 接口文档写的是「需要 target_user_id」，因此若 v3 是「当前用户填自己」，需确认后端是否支持「无 target_user_id 即当前登录用户」或需在 URL 中显式传当前用户 id。
2. **step1 的 locations 更新**：当前后端仅在 create_new 时调用 `_save_locations`，普通更新未写 locations。若要在 v3 中支持多地址并落库，需后端在 save_step_1 的「更新」分支中也根据 body.locations 调用 `_save_locations`。
3. **association_title / industry**：已落实。user_cards 表已增加字段 association_title、industry；save-step/1 与 GET /data 的 step1 均已读写；v3 保存与回显已包含。迁移脚本：`backend/scripts/add_user_cards_association_industry.py`。

---

## 五、建议实施顺序（不改代码，仅方案）

1. **先补全保存链路**：step3、step4、step6 的保存调用与 payload；step5 补 desired_position、position_preferences；step1 补 field_visibility、selected_avatar（及可选 locations、personal_photos）。
2. **再补数据回显与结构**：step2 与 eduExperiences 的双向映射；step1 的 locations 与 contactItems 的互转；step6 的 extraInfo 与 hidden_info 的同步。
3. **最后补 UI 与交互**：step5 两个新输入项；可选的多地址与个人相册 UI；补充信息入口与保存时机。

以上为「只出方案、不改代码」的排查与合并建议，实施时按需分阶段改 v3 的 wxml/js 与后端 save-step 逻辑即可。

---

## 五.1、保存策略（2026-02 已实现）

- **切换卡片（步骤）时**：离开当前步骤前自动调用 `saveStepToServer(prev)`，将当前步骤数据写入数据库（如从第 1 步切到第 2 步时保存 step1）。
- **卡片内切换子项（失焦）时**：先写本地草稿 `saveDraft()`，再防抖 800ms 后调用 `saveStepToServer(currentStep)` 写入数据库，避免频繁请求的同时保证数据落库，无需「凑够再保存」。
- **点击【保存】按钮**：一次性提交 step1 + step2/3/4/6 到后端。

---

## 六、2026-01-29 交互细化方案（补充）

### 6.1 教育经历九宫格入口

- **触发方式**：点击第 1 步中【教育经历】卡片右上角的【+ 添加】按钮。  
- **第一层半屏**：先弹出一个九宫格选择学历层级，每个为「icon + 文本」：  
  - 🏫 小学  
  - 🎒 初中  
  - 🏫 高中  
  - 🎓 大学本科  
  - 🎓 硕士  
  - 🎓 博士  
- **第二层半屏**：选中上述任一项后，再弹出当前已有的「添加教育经历」半屏（学校名、专业、起止时间等）。  
- **与 step2 映射关系（仅方案）**：  
  - 小学 → `primary_school` / `primary_graduation_year`  
  - 初中 → `middle_school` / `middle_graduation_year`  
  - 高中 → `high_school` / `high_graduation_year`  
  - 大学本科 → `bachelor_university` / `bachelor_major` / `bachelor_graduation_year`  
  - 硕士 → `master_university` / `master_major` / `master_graduation_year`  
  - 博士 → `doctor_university` / `doctor_major` / `doctor_graduation_year`  

### 6.2 desired_position / position_preferences 含义与在 v3 中的位置

- **后端定义（来自 `backend/xiehuaiyao.md`）**：  
  - `desired_position`：希望担任的职务（如「会长或秘书长 – 技术顾问 / 副会长 / 秘书长」）。  
  - `position_preferences`：职务偏好和说明（如「希望能在科技委员会任职」）。  
- **与 v3 第 2 步的关系**：  
  - 现有枚举：  
    - 「愿意/希望担任校董会职务」→ `board_position`（单选、含捐赠档位）。  
    - 「愿意/希望担任校友会职务」→ `association_positions`（多选具体职务）。  
  - **方案约定**：  
    - 在「校董会职务」「校友会职务」下方新增两个文本输入：  
      - 「期望担任的职务（整体）」→ 映射到 `desired_position`。  
      - 「职务偏好和说明」→ 映射到 `position_preferences`。  
    - 不把这两个字段直接绑定到现有枚举字段，避免语义混淆。

### 6.3 field_visibility 的范围确认

- 当前 v3 已在各卡片子项右侧提供「隐私状态图标」与半屏设置（公开 / 私密 / 打码 / 校友 / 好友）。  
- **方案确认**：这些就是需要落库的 `field_visibility` 数据结构，后续在保存 step1（以及需要时的其他步骤）时，将当前前端维护的可见性 map 一并提交给后端即可。

### 6.4 selected_avatar 对应关系

- 第 1 步中的【头像】：  
  - 若用户选择预设头像：  
    - `avatar`：用于前端显示。  
    - `selected_avatar`：与后端字段对应，用于标识「选择了哪一张预设头像」。  
  - 若用户使用微信头像：  
    - `avatar` 为微信头像 URL，`selected_avatar` 为空。  
- 保存 step1 时，方案上需同时带上 `selected_avatar` 字段（若有）。

### 6.5 locations 与地址类型

- **文案调整**：  
  - 「联系方式」卡片下原有的【地址】行，改名为【公司地址】（默认 `location_type = work`）。  
- **地址类型九宫格（半屏）**：  
  - 点击「联系方式」卡片右上角【+ 添加】按钮时，半屏九宫格中关于地址的部分扩展为：  
    - 🏠 居住地址 → `location_type = residence`  
    - 🏢 公司地址 → `location_type = work`  
    - 📍 临时活动地址 → `location_type = temp_event`  
    - 📌 其它地址 → `location_type = other`  
  - 选择任一项后，生成一条对应类型的地址 contactItem，并在后续保存时统一映射为 user_locations 记录。  
- **公司地址右侧【+】交互**：  
  - 点击第 1 条【公司地址】右侧的【+】时，直接弹出同一个「地址类型九宫格」半屏，方便快速再添加「居住地址 / 临时活动地址 / 其它地址」。  
- **临时活动地址 & 过期逻辑（仅方案）**：  
  - 当用户打开小程序或显式点击「更新当前位置」时，记录当前位置为一条 `location_type = 'temp_event'` 的地址，并附带 `expires_at = now + 3 天`（过期时间可配置）。  
  - 展示或查询时，仅使用当前时间 < `expires_at` 的临时地址；过期的由后端定期清理或在查询 SQL 中排除。

### 6.6 personal_photos 与【相片】字段

- 目标：将第 1 步中的【相片】由「单张图片」升级为「多张图片」列表，并与后端的 `personal_photos` 数组直接对应。  
- **UI 方案**：  
  - 在「个人介绍/基础信息」区域，使用横向滚动列表：  
    - 第一个格子为「+ 添加相片」占位；  
    - 其后为已选择的多张相片缩略图，可点击大图预览或删除。  
- **数据约定**：  
  - `personal_photos[0]`：作为名片预览和个人介绍卡的主展示图片。  
  - 后续元素可用于生日卡片、个人相册等扩展场景。  
- **数据流**：  
  - load 时：从 `step1.personal_photos` 初始化相片列表（为空则给一个添加占位）。  
  - 保存 step1 时：将当前列表完整写回 `personal_photos` 字段（保持与 v1 兼容）。

