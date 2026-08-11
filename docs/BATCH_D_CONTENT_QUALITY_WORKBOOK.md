# FunShow 批次 D：内容质量与内部链接工作簿

> 网站：<https://www.funshow.top/>
> 建立日期：2026-08-11
> 适用主题：`magzine`
> 用途：记录批次 D 的线上基线、Notion 编辑清单、内容草稿和验收结果。

## 1. 当前执行状态

| 任务                 | 代码侧                                                                 | Notion 内容侧                                                                            | 当前状态            |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------- |
| D-01 完善 6 篇薄内容 | 广告薄内容保护已存在                                                   | 已完成逐页基线、结构模板和内链矩阵，待按真实环境补充正文与截图                           | 🟡 进行中           |
| D-02 重写 About      | 无需模板改造                                                           | 已提供可直接改写的草稿；需将 Status 改为 `Published`                                     | 🟡 进行中           |
| D-03 完善信任/政策页 | Published Page 会自动进入 canonical 与 sitemap                         | 已提供 Contact、Privacy、Terms、Disclaimer、Editorial Policy 草稿；待在 Notion 创建/更新 | 🟡 进行中           |
| D-04 分类和标签导语  | 三个分类已有专属导语；标签页可生成包含标签、篇数和代表文章的唯一导语   | 可在配置中心用 JSON 覆盖默认导语                                                         | ✅ 代码完成，待部署 |
| D-05 内部链接        | 相关推荐改为相关性排序并补足；面包屑补齐分类根层级；聚合页增加阅读路径 | 6 篇文章的正文上下文链接待写入 Notion                                                    | 🟡 进行中           |

## 2. 2026-08-11 生产基线

浏览器按生产页面实际 DOM 统计，字数为中文字符与英文/数字词组的近似合计，不等同于 Notion 后台统计。

| URL              | 标题                                          | 近似字数 | H2/H3 | 正文内部链接 | 结论                   |
| ---------------- | --------------------------------------------- | -------: | ----: | -----------: | ---------------------- |
| `/article/1-6-1` | Win7 升级 Win10，Media Creation Tool 报错修复 |      118 |     0 |            0 | 严重薄内容             |
| `/article/1-1-4` | Dify 通过 ngrok 发布公网访问服务              |      128 |     0 |            0 | 严重薄内容             |
| `/article/1-1-2` | 无需显卡，Windows 环境运行本地大模型          |      241 |     0 |            0 | 缺少环境和验证         |
| `/article/1-6-2` | VMware 与 Device/Credential Guard 不兼容      |      314 |     0 |            0 | 缺少风险说明和分支方案 |
| `/article/1-1-6` | 微信公众号接入 Coze 智能客服                  |      365 |     0 |            0 | 缺少完整链路和排错     |
| `/article/1-1-9` | Hermes Agent + Ollama Cloud + 微信            |      353 |     0 |            0 | 缺少版本、配置和验证   |

其他信任度问题：

- `/about` 约 477 字，但当前输出 `noindex, nofollow, noarchive`；Notion 状态不是 `Published`，且未进入 sitemap。
- `/privacy-policy` 约 136 字，缺少最后更新日期、Cookie/广告、CMP、数据保存和退出方式等说明。
- `/contact`、`/terms`、`/disclaimer`、`/editorial-policy` 当前均为 404。
- `AI智能体`、`投资理财`、`读书笔记` 分类页当前都只有一句模板化导语。

## 3. Notion 编辑统一规范

每篇技术文章至少完成以下结构，但不要为了字数重复堆砌：

1. 开头用 40–80 字直接回答“问题是什么、最终怎么解决”。
2. 列出真实测试环境：Windows/软件/模型版本、CPU、内存、网络和日期。
3. 使用 H2/H3 拆分前置条件、步骤、验证、排错、风险和替代方案。
4. 命令、端口和配置只保留实际执行过的值；密钥、Token、IP 和账号必须脱敏。
5. 至少提供一张原创截图：错误现象、关键配置或成功结果。
6. 正文插入 2–5 个真正相关的站内链接，锚文本说明目标内容，避免“点击这里”。
7. 结尾添加“最后验证日期”和变更记录。
8. 引用官方资料时链接到具体文档页，不复制大段原文。

## 4. 六篇文章整改卡

### 4.1 `/article/1-6-1`：Win7 升级 Win10 报错

建议标题：`Windows 7 升级 Windows 10 报错 0x80072f8f-0x20000：TLS 1.2 修复与验证`

开头摘要草稿：

> 该错误通常发生在旧版 Windows 的 WinHTTP 无法使用服务端要求的 TLS 1.2 时。先确认 Windows 7 SP1 和系统时间，再安装所需更新、启用 WinHTTP 的安全协议并重启；修改注册表前应先备份，完成后用 Media Creation Tool 重新验证。

建议结构：

1. `## 错误现象与适用范围`
2. `## 为什么会出现 0x80072f8f-0x20000`
3. `## 操作前准备：版本、时间、证书与备份`
4. `## 方案一：更新 Windows 与 WinHTTP`
5. `## 方案二：启用 TLS 1.2 默认协议`
6. `## 重启后如何验证`
7. `## 仍然失败时的排查顺序`
8. `## 安全风险与回滚方式`

必须补充的第一手证据：Windows 版本号、32/64 位、报错截图、安装的 KB、注册表修改前后截图、重启后的成功界面。

站内链接建议：

- 在“Windows 环境排错”段落链接 `/article/1-6-2`，锚文本使用“VMware 与 Windows VBS/Hyper-V 冲突排查”。
- 若提到升级后运行 AI 工具的目的，可链接 `/article/1-1-2`，但不要强行添加无上下文链接。

官方核验资料：

- [Microsoft：Windows 7/Server 2012 客户端启用 TLS 1.2](https://learn.microsoft.com/zh-cn/intune/configmgr/core/plan-design/security/enable-tls-1-2-client)
- [Microsoft：WinHTTP 安全协议选项与注册表风险说明](https://learn.microsoft.com/en-us/windows/win32/winhttp/option-flags)

### 4.2 `/article/1-1-4`：Dify 通过 ngrok 公网访问

建议标题：`Dify 本地服务通过 ngrok 安全发布公网：地址配置、验证与常见错误`

开头摘要草稿：

> ngrok 适合把本地 Dify 临时暴露给回调、演示或联调场景。关键不是只启动隧道，还要确认 Dify 实际监听端口、公开 URL、回调地址和反向代理头一致，并给隧道增加访问控制；长期生产服务应改用固定域名和正式反向代理。

建议结构：

1. `## 适用场景与不适用场景`
2. `## 实测环境和网络拓扑`
3. `## 确认 Dify 本地服务和端口`
4. `## 安装 ngrok 并安全保存 Authtoken`
5. `## 创建 HTTPS 隧道`
6. `## 配置 Dify 对外 URL 与回调地址`
7. `## 浏览器和 API 双重验证`
8. `## 502、重定向、Cookie 和 WebSocket 排错`
9. `## 安全限制和生产替代方案`

站内链接建议：

- `/article/1-1-3`：锚文本“先完成 Windows 环境的 Dify 部署”。
- `/article/1-1-5`：锚文本“让 Dify 连接本地 Ollama 模型”。
- `/article/1-1-2`：锚文本“在无独立显卡的 Windows 电脑运行本地模型”。

官方核验资料：

- [Dify 官方环境变量示例](https://github.com/langgenius/dify/blob/main/api/.env.example)
- [ngrok 官方文档](https://ngrok.com/docs/)
- [ngrok Authtoken 说明](https://ngrok.com/docs/api/resources/credentials/)

### 4.3 `/article/1-1-2`：无显卡 Windows 本地大模型

建议标题：`Windows 无独立显卡运行本地大模型：Ollama CPU 部署、模型选择与性能实测`

开头摘要草稿：

> 没有独立显卡仍可在 Windows 上使用 Ollama 运行小型量化模型，但速度主要取决于 CPU、内存、模型大小和上下文长度。文章应明确实测硬件与模型，而不是笼统承诺“所有电脑都能流畅运行”。

建议结构：

1. `## 结论：什么配置能运行到什么程度`
2. `## 实测电脑配置和软件版本`
3. `## 安装 Ollama for Windows`
4. `## 选择适合 CPU/内存的小模型`
5. `## 下载、启动并完成第一次对话`
6. `## 用 API 验证 11434 服务`
7. `## 记录首字延迟、生成速度和内存占用`
8. `## 模型下载失败、内存不足和响应慢的排错`
9. `## 本地部署的隐私边界`

站内链接建议：

- `/article/1-1-1`：锚文本“OpenClaws 连接 Ollama 的完整流程”。
- `/article/1-1-5`：锚文本“Dify 配置 Ollama 模型供应商”。
- `/article/1-1-9`：锚文本“Hermes Agent 使用 Ollama Cloud 的方案”。

官方核验资料：

- [Ollama Windows 官方安装说明](https://docs.ollama.com/windows)
- [Ollama Quickstart](https://docs.ollama.com/quickstart)
- [Ollama FAQ](https://docs.ollama.com/faq)

### 4.4 `/article/1-6-2`：VMware 与 Credential Guard 冲突

建议标题：`VMware Workstation 与 Device/Credential Guard 不兼容：先升级还是关闭 Hyper-V/VBS`

开头摘要草稿：

> 该错误通常与 Hyper-V、VBS、内存完整性或 Credential Guard 占用硬件虚拟化能力有关。较新的 VMware Workstation 已改善与 Hyper-V 的兼容性，因此应先核对 Windows 和 VMware 版本；只有确认无法升级且确有需要时，才考虑关闭安全功能。

建议结构：

1. `## 错误现象和受影响版本`
2. `## Hyper-V、VBS 与 Credential Guard 的关系`
3. `## 先检查 Windows 与 VMware 版本`
4. `## 方案一：升级 VMware Workstation`
5. `## 方案二：关闭冲突的 Windows 可选功能`
6. `## 方案三：按官方方法配置 Credential Guard`
7. `## 重启并验证虚拟化状态`
8. `## 关闭安全功能的影响与恢复方法`

站内链接建议：

- `/article/1-6-1`：锚文本“旧版 Windows 网络组件和升级问题排查”。
- 该主题与 AI 文章关联较弱，不要为了数量强塞 3–5 个不相关链接；优先引用 Microsoft 和 Broadcom 官方文档。

官方核验资料：

- [Broadcom：VMware 与 Device/Credential Guard 不兼容](https://knowledge.broadcom.com/external/article/315385/vmware-workstation-and-devicecredential.html)
- [Microsoft：第三方虚拟化软件与 Hyper-V/VBS 冲突](https://learn.microsoft.com/en-us/troubleshoot/windows-client/application-management/virtualization-apps-not-work-with-hyper-v)
- [Microsoft：Credential Guard 配置](https://learn.microsoft.com/en-us/windows/security/identity-protection/credential-guard/configure)

### 4.5 `/article/1-1-6`：微信公众号接入 Coze

建议标题：`微信公众号接入 Coze 智能客服：消息链路、鉴权、回调验证与排错`

开头摘要草稿：

> 微信公众号不能只靠一个 Coze Token 完成智能客服接入，中间还需要处理微信服务器验证、消息解析、用户会话映射、Coze API 调用和回复超时。文章应展示完整链路，并明确 Token、签名和用户数据的保护方式。

建议结构：

1. `## 最终架构与消息流`
2. `## 前置条件和账号权限`
3. `## 创建并发布 Coze Bot`
4. `## 准备公网 HTTPS 回调服务`
5. `## 完成微信服务器 URL 验证`
6. `## 接收消息并调用 Coze Chat API`
7. `## 将回答返回微信公众号`
8. `## 会话、超时、重试和日志处理`
9. `## Token、签名和用户隐私保护`
10. `## 常见错误与验证清单`

站内链接建议：

- `/article/1-1-4`：锚文本“用 ngrok 暂时提供公网 HTTPS 回调地址”。
- `/article/1-1-9`：锚文本“Hermes Agent 接入微信的替代实现”。
- `/article/1-1-3`：锚文本“Windows 环境部署 Dify 作为另一种智能客服后端”。

官方核验资料：

- [Coze Studio API Reference](https://github.com/coze-dev/coze-studio/wiki/6.-API-Reference)
- [Coze 官方 Go SDK 与鉴权示例](https://github.com/coze-dev/coze-go)

### 4.6 `/article/1-1-9`：Hermes Agent + Ollama Cloud + 微信

建议标题：`Hermes Agent 连接 Ollama Cloud 与微信：Windows 安装、模型配置和端到端验证`

开头摘要草稿：

> 这套方案包含 Hermes Agent、Ollama Cloud 模型供应商和微信消息入口三个独立环节。可靠教程应固定测试版本，分别验证模型连接、Agent 对话和微信收发，再做端到端测试；任何 API Key、二维码会话和日志都需要脱敏。

建议结构：

1. `## 10 分钟能完成什么、不能保证什么`
2. `## 实测系统、Hermes 版本和账号条件`
3. `## 安装 Hermes Agent 并检查 CLI`
4. `## 配置 Ollama Cloud Provider 和模型`
5. `## 先完成终端对话验证`
6. `## 配置微信消息入口`
7. `## 完成端到端收发测试`
8. `## Provider、上下文长度和网络错误排查`
9. `## 凭据、聊天记录和自动执行风险`
10. `## 升级与回滚记录`

站内链接建议：

- `/article/1-1-13`：锚文本“Hermes Agent v0.16.0 Windows 桌面实测”。
- `/article/1-1-2`：锚文本“Windows 无独立显卡运行本地模型”。
- `/article/1-1-1`：锚文本“Ollama 本地模型连接示例”。
- `/article/1-1-6`：锚文本“微信公众号接入 Coze 的替代方案”。

官方核验资料：

- [NousResearch Hermes Agent 官方仓库](https://github.com/NousResearch/hermes-agent)
- [Hermes Agent CLI Provider 列表](https://github.com/nousresearch/hermes-agent/blob/main/website/docs/reference/cli-commands.md)
- [Hermes Agent FAQ](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/faq.md)

## 5. About 页面改写稿

Notion 属性建议：

| 属性    | 值                                                              |
| ------- | --------------------------------------------------------------- |
| Title   | 关于 FunShow 与 Owen                                            |
| Slug    | `about`                                                         |
| Type    | `Page`                                                          |
| Status  | `Published`（当前必须修改）                                     |
| Summary | FunShow 的作者背景、内容范围、测试方法、AI 使用原则与联系方式。 |

正文草稿：

### 关于 FunShow 与 Owen

你好，我是 Owen，FunShow 的作者和维护者。这个网站用于整理我在 AI 工具、本地大模型、Windows 与服务器部署、读书和投资认知方面的实践笔记。我希望文章不只是记录“某个命令可以运行”，还说明它适用于什么环境、为什么这样配置、怎样验证结果，以及失败时从哪里开始排查。

### 我关注的主题

- AI 智能体、本地大模型、Dify、Ollama 和自动化工具；
- Windows、虚拟化、VPS 与常见部署问题；
- 科技、心理、商业与个人成长类阅读笔记；
- 价值投资、风险管理和个人决策框架。

`[请补充：你的真实职业背景、相关工作年限、公开资历或长期实践经历。不要填写无法公开验证的头衔。]`

### 内容如何产生

技术文章优先来自我实际安装、配置或排错的过程。发布前，我会尽量记录测试日期、操作系统和软件版本，保留关键步骤与成功结果，并链接官方资料。软件持续更新，旧文章可能不再完全适用；如果你发现步骤失效，欢迎通过联系页面反馈具体版本和错误信息。

读书和投资类内容主要是个人理解与复盘，不代表专业咨询，也不构成投资建议。读者应结合自身情况独立判断并承担决策风险。

### 我如何使用 AI

AI 可以辅助我整理提纲、检查表达和发现遗漏，但不会替代真实测试。涉及命令、版本、政策、价格和安全风险的内容，应由我根据实际环境或官方资料复核。若一篇文章大量使用 AI 辅助，我会尽量在文中说明。

### 联系与身份

- GitHub：<https://github.com/owen-87>（发布前确认该地址确为你的公开账号）
- 邮箱：`[请填写公开联系邮箱]`
- 联系页面：`/contact`（创建后启用）

为了保护隐私，请不要通过公开留言发送密码、Token、身份证件、账单或其他敏感资料。

## 6. 信任与政策页面草稿

### 6.1 Contact

Notion 属性：Title=`联系 FunShow`，Slug=`contact`，Type=`Page`，Status=`Published`。

正文：

> 如果你发现文章中的命令、链接或版本信息已经失效，欢迎提供文章 URL、操作系统/软件版本、实际错误信息和你已经尝试的步骤。涉及合作、版权、隐私或内容纠错，也可以通过以下方式联系。
>
> - 邮箱：`[公开邮箱]`
> - GitHub：<https://github.com/owen-87>
> - 一般回复时间：`[例如 3–7 个工作日，请按真实情况填写]`
>
> 请勿发送密码、API Key、Cookie、身份证件、支付信息或未脱敏的服务器日志。FunShow 不提供紧急技术支持、代操作账号或收益保证。

### 6.2 Privacy Policy

Notion 属性：Title=`隐私政策`，Slug=`privacy-policy`，Type=`Page`，Status=`Published`。

正文建议替换现有短版本：

#### 隐私政策

最后更新：2026 年 8 月 11 日

FunShow（`https://www.funshow.top`）重视访问者的隐私。本政策说明网站可能收集哪些信息、为什么使用这些信息，以及你可以如何管理相关选择。

#### 我们可能收集的信息

- 浏览器和服务器为提供网页而产生的基础日志，例如访问时间、请求页面、浏览器类型、设备类型、来源页面和近似网络信息；
- 你主动提交的评论、联系邮件或反馈内容；
- Cookie、广告同意状态以及用于防滥用、登录或保存偏好的必要信息；
- 网站启用统计服务时产生的汇总访问数据。

请不要通过评论或联系表单提交密码、Token、身份证件、支付信息或其他敏感资料。

#### Google AdSense 和 Cookie

本网站可能使用 Google AdSense 展示广告。Google 及其合作伙伴可能使用 Cookie 或类似技术，根据用户访问本网站或其他网站的情况投放个性化或非个性化广告、衡量广告效果并防止欺诈。

你可以在 [Google 广告设置](https://adssettings.google.com/) 中管理个性化广告，也可以阅读 [Google 如何使用合作网站或应用中的信息](https://policies.google.com/technologies/partner-sites)。

#### 欧洲经济区、英国和瑞士用户

在适用地区，广告与分析存储默认保持拒绝，直到用户通过同意管理界面作出选择。`[发布前确认已在 AdSense“隐私与消息”启用 Google 认证 CMP；未启用前不要声称界面已上线。]` 用户可以通过同意界面接受、拒绝或管理可选用途。

#### 第三方服务

网站内容由 Notion 管理并通过 Vercel 等基础设施提供；广告可能由 Google 提供。若网站启用评论、登录、统计或其他第三方功能，相应服务可能按照其隐私政策处理必要数据。我们会尽量只启用提供功能所需的服务。

#### 数据保存与安全

我们只在实现上述用途、履行法律义务或处理争议所需的期限内保存信息，并采取合理措施限制未经授权的访问。但互联网传输和存储不存在绝对安全保证。

#### 你的选择与权利

你可以禁用或清除浏览器 Cookie、在 Google 广告设置中调整偏好，并通过联系邮箱请求查询、更正或删除你主动提交且我们仍保存的信息。禁用必要 Cookie 可能影响部分功能。

#### 儿童隐私

本网站不以儿童为目标，也不会有意要求儿童提交个人敏感信息。如发现相关信息被误收集，请联系我们处理。

#### 政策更新与联系

本政策可能因网站功能或法规变化而更新，页面顶部会标明最后更新日期。隐私相关问题请联系：`[公开邮箱]`。

### 6.3 Terms of Use

Notion 属性：Title=`使用条款`，Slug=`terms`，Type=`Page`，Status=`Published`。

正文：

> 使用 FunShow 即表示你理解并接受以下条款。网站内容主要用于学习、信息分享和个人经验记录，不构成法律、医疗、财务、投资或其他专业建议。
>
> 除另有注明外，文章文字和原创图片的权利归作者所有。允许在合理引用范围内注明作者、文章标题和原始链接；未经许可，不得整篇复制、批量抓取后重新发布、冒充原创或用于误导性商业宣传。
>
> 你不得利用本站功能传播违法、有害、侵权、恶意代码或未经授权的数据，也不得试图破坏网站、绕过访问限制或干扰其他用户。
>
> 文章中的软件版本、链接和操作步骤可能随时间变化。你应在操作前备份数据、理解命令含义并自行评估风险。第三方网站、产品和服务由相应提供者负责，FunShow 不控制其可用性、条款或安全性。
>
> 在法律允许的范围内，FunShow 不对因使用或无法使用本站内容而产生的直接或间接损失作出保证。条款更新后会修改本页日期；继续使用网站视为接受更新后的条款。
>
> 联系邮箱：`[公开邮箱]`。

### 6.4 Disclaimer

Notion 属性：Title=`免责声明`，Slug=`disclaimer`，Type=`Page`，Status=`Published`。

正文：

> FunShow 的技术内容基于特定时间、版本和设备环境下的个人实践。即使步骤在作者环境中有效，也可能因软件更新、地区、权限、网络或硬件不同而失败。执行系统、注册表、虚拟化、服务器、网络和自动化相关操作前，请备份数据并准备回滚方案。
>
> 投资理财和读书内容仅代表个人学习与复盘，不构成投资建议、收益承诺或买卖依据。任何投资都有损失风险，读者应独立研究并在需要时咨询具备资质的专业人士。
>
> AI 生成或辅助整理的内容可能存在错误。涉及命令、版本、安全、政策和费用的信息，应以官方资料及实际验证为准。
>
> 网站可能展示第三方广告或外部链接。广告出现不代表 FunShow 对产品作出推荐或保证；与第三方发生的交易、账号和数据处理由用户与第三方自行负责。

### 6.5 Editorial Policy

Notion 属性：Title=`编辑政策`，Slug=`editorial-policy`，Type=`Page`，Status=`Published`。

正文：

#### 编辑目标

FunShow 希望发布能够帮助读者完成具体目标的内容，而不是只为搜索排名拼接关键词。技术文章优先回答适用环境、完整步骤、验证方法、失败原因和风险边界。

#### 资料与测试

- 优先使用作者的实际操作记录、原创截图和日志；
- 引用软件厂商、政府机构、标准组织或项目官方仓库；
- 区分“已实测”“根据官方资料推断”和“尚未验证”；
- 不伪造使用经历、测试数据、评价或作者资历。

#### AI 辅助原则

AI 可用于提纲、语言整理、代码检查和资料线索，但事实结论、命令、版本、安全提示和引用必须由作者复核。AI 不应被用来批量生成缺少实践价值的页面。

#### 更新与纠错

技术文章应标注最后验证日期。发现严重错误、安全风险或失效步骤时，优先修正正文并记录变更；无法继续维护的内容应增加醒目提示、合并、重定向或停止索引。

#### 独立性与商业关系

广告、赞助或联盟关系不应影响事实结论。若文章包含赞助、样品、联盟链接或其他利益关系，应在文章中清楚披露。广告位与编辑正文应保持可辨认的视觉边界。

#### 反馈

读者可通过 `/contact` 提交纠错，请附文章 URL、相关版本和可复现证据。我们会评估反馈，但不能保证每项请求都得到回复或采纳。

## 7. 分类与标签配置

代码已内置以下三个分类导语；如需在 Notion 配置中心覆盖，可新增：

```json
MAGZINE_CATEGORY_DESCRIPTIONS = {
  "AI智能体": "自定义导语",
  "投资理财": "自定义导语",
  "读书笔记": "自定义导语"
}
```

标签可用同样方式配置：

```json
MAGZINE_TAG_DESCRIPTIONS = {
  "Ollama": "围绕 Ollama 安装、模型运行和应用集成整理的实测文章。",
  "Dify": "Dify 部署、模型连接、公开访问和排错记录。"
}
```

未配置的标签会根据标签名、文章数和前三篇代表文章自动生成导语。

## 8. Notion 发布与验收顺序

1. 先更新 About，并将 Status 改为 `Published`。
2. 更新 Privacy；创建 Contact、Terms、Disclaimer、Editorial Policy，全部使用 `Page + Published`。
3. 页面能正常访问后，再把这些链接加入 Notion 的 `MAGZINE_FOOTER_LINKS`，避免提前产生 404 链接。
4. 按优先级扩写 `/article/1-6-1`、`/article/1-1-4`、`/article/1-1-2`，再处理其余三篇。
5. 每改完一篇，检查 H1 唯一、H2/H3 结构、正文站内链接、官方引用、截图、最后验证日期和移动端展示。
6. 触发 Vercel 重验证或等待 ISR 更新后，重新运行浏览器基线。
7. 最终确认 About/政策页进入 sitemap，六篇文章不再属于薄内容，正文上下文内链不再为 0。

## 9. 完成判定

| 指标                               |                 基线 |                                        目标 |
| ---------------------------------- | -------------------: | ------------------------------------------: |
| 6 篇文章 H2/H3                     |             全部为 0 |    每篇至少覆盖环境、步骤、验证、排错和风险 |
| 6 篇文章正文内部链接               |             全部为 0 |   每篇 2–5 个强相关链接；不为数量强塞弱链接 |
| About robots                       |  `noindex, nofollow` |              `index, follow` 且进入 sitemap |
| Privacy 近似字数                   |                  136 |          完整披露实际服务、选择权和更新日期 |
| Contact/Terms/Disclaimer/Editorial |             全部 404 |                        全部 200，页脚可访问 |
| 分类导语                           |           模板化一句 |            三个分类各自说明主题、价值和边界 |
| 相关推荐                           | 仅共享标签，可能为空 | 标签优先、分类补足、无重复且排除私有/草稿页 |
