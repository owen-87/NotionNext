# FunShow 网站 SEO、GEO 与 Google AdSense 优化方案

> 网站：<https://www.funshow.top/>
> 源码：NotionNext / Next.js Pages Router
> 审阅日期：2026-07-27
> 最近更新：2026-08-10
> 当前状态：批次 A、B 已完成本地实施与最新上游融合，尚未部署

## 1. 项目目标

本方案围绕以下三个目标制定：

1. 提高 Google 对站内有效页面的发现、抓取、渲染和索引比例。
2. 提升网站在 Google AI Overview、AI Mode 等生成式搜索中的可引用性，即 GEO（Generative Engine Optimization）。
3. 完善网站内容、导航、隐私和广告实现，使其具备更好的 Google AdSense 审批条件。

需要说明的是：Google 不保证收录任何页面，也不保证 AdSense 审批结果。本方案的作用是消除已经发现的技术障碍、重复信号和合规风险，显著改善通过审核与获得索引的基础条件。

## 2. 执行摘要

目前只有少量页面被 Google 索引，核心原因不是缺少 sitemap，也不主要是文章数量不足，而是以下技术问题叠加：

- 首页、文章页、归档页和分类页的原始 HTML 均为空的 `<div id="__next"></div>`。
- 标题、描述、正文、内部链接和 JSON-LD 需要浏览器执行 JavaScript 后才出现。
- `www`、非 `www`、默认语言路径、`/zh-CN/` 路径和主题参数等产生了多组内容副本。
- 全站没有 `rel="canonical"`。
- sitemap 混入 404、搜索页、RSS 和 fragment URL。
- 结构化数据存在日期缺失、分类截断、无效 Logo URL 等错误。
- AdSense 脚本存在多次重复加载，并可能覆盖搜索、登录、404 等非内容页。

因此，推荐执行顺序为：

1. 恢复公共页面 SSR/SSG。
2. 统一主域、语言路径和 canonical。
3. 重建 sitemap 与页面索引策略。
4. 修复页面语义、元数据和结构化数据。
5. 整改 AdSense 加载方式与投放范围。
6. 补强薄内容、作者信息和政策页面。
7. 部署后通过 Search Console 重新验证并持续监控。

## 3. 线上站点与源码审阅结论

### 3.1 P0：原始 HTML 是空壳

对以下代表性页面检查原始 HTTP 响应：

- `/`
- `/article/1-1-14`
- `/article/1-1-4`
- `/archive`
- `/category/AI智能体`
- `/en`

结果均表现为：

- `<div id="__next"></div>` 内没有服务端输出的可见内容。
- 原始 HTML 中没有页面级 `<title>`。
- 原始 HTML 中没有 `meta description`。
- 原始 HTML 中没有 `meta robots`。
- 原始 HTML 中没有 canonical。
- 原始 HTML 中没有 JSON-LD。
- 页面只有在 JavaScript hydration 完成后才出现正文和 SEO 信息。

这会使 Google 先抓取空的 App Shell，再等待 Web Rendering Service 执行 JavaScript。Google 可以处理 JavaScript，但渲染与初次抓取是两个阶段，页面可能在渲染队列中等待；其他无法执行 JavaScript 的搜索与 AI 爬虫可能完全看不到正文。

源码中的高风险路径包括：

- `pages/_app.js` 使用动态 `ClerkProvider` 包裹整个公共站点。
- SEO 组件也位于该动态认证边界内部。
- 主题、全局上下文和公共 Header 中混入了 Clerk 客户端组件。

Google 官方参考：

- [Understand JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Dynamic rendering as a workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)

### 3.2 P0：重复 URL 与 canonical 缺失

已确认以下 URL 变体可以访问同一内容：

- `https://www.funshow.top/`
- `https://funshow.top/`
- `https://www.funshow.top/zh-CN`
- `https://www.funshow.top/zh-CN/article/1-1-14`
- `https://www.funshow.top/article/1-1-14?theme=simple`

其中：

- `https://funshow.top/` 与 `https://www.funshow.top/` 都返回 `200`。
- 默认语言无前缀路径与 `/zh-CN/` 路径都返回 `200`。
- 带 `theme` 参数的页面返回 `200`。
- `.html` 变体会被重定向到 `/zh-CN/` 变体，而不是计划中的无语言前缀规范 URL。
- 所有检查页面均没有 canonical。

这会拆分内部链接、外链和历史抓取信号，也容易在 Search Console 中形成：

- 重复网页，Google 选择的规范网页与用户不同；
- 重复网页，未选定规范网页；
- 已抓取但未编入索引；
- 网页是替代版本。

Google 官方参考：

- [How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [What is URL canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization)

### 3.3 P0：sitemap 包含无效和低价值 URL

线上 `sitemap.xml` 当前共有 34 个 URL：

- 23 个文章 URL；
- 11 个非文章 URL。

已发现的问题：

- `/en` 被写入 sitemap，但实际返回 `404`。
- `/search` 被写入 sitemap。
- `/rss/feed.xml` 被写入 sitemap。
- `/#` 被写入 sitemap，fragment 不会形成独立服务器页面。
- 具体分类详情页没有写入 sitemap。
- 文章使用发布日期作为 `lastmod`，而不是最后修改日期。
- 首页、归档等页面每次生成 sitemap 都使用当天日期，造成虚假的持续更新信号。
- 所有页面统一使用 `daily` 和相同 priority，不能体现真实变化。

站点的 `robots.txt` 可以正常访问，当前允许抓取并声明了 sitemap，这部分不是主要阻塞点。

Google 官方参考：

- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Troubleshoot crawling errors](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors)

### 3.4 P1：元数据和页面语义问题

已确认：

- 全站没有 canonical。
- 所有路由统一输出 `index,follow`。
- 搜索、认证、后台等低价值页面没有单独的 noindex 规则。
- 文章标题使用 H2。
- 页面唯一 H1 实际位于页脚，用来显示站点名称。
- 首页主要内容缺少明确的主 H1。
- `meta keywords` 存在，但 Google 不使用该标签。
- 全站 preload `/fonts/inter-var.woff2`，但该文件线上返回 `404`。

代表性文章 `/article/1-1-14` 的渲染后结构化数据存在：

- `datePublished` 缺失；
- `dateModified` 缺失；
- `articleSection` 对“AI智能体”只输出 `"A"`；
- publisher logo 使用不可抓取的 `notion://` URL；
- author 只有名字，没有指向作者介绍页的 URL；
- Open Graph type 使用 `"Post"`，而不是标准的 `"article"`；
- headline 混入站点名称后缀。

涉及源码：

- `components/SEO.js`
- `themes/magzine/components/ArticleInfo.js`
- `themes/magzine/components/Footer.js`

Google 官方参考：

- [Meta tags that Google supports](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)

### 3.5 P1：内容质量与站点信任度

站点目前有 23 篇 sitemap 文章：

- 文章字数中位数约为 1,202；
- 平均字数约为 1,308；
- 大部分文章并非严重薄内容；
- 6 篇文章不足 500 字，需要优先人工复核和扩写。

优先整改页面：

| URL | 当前统计字数 | 主要问题 |
|---|---:|---|
| `/article/1-6-1` | 0 | 系统统计为 0，需要检查是否以图片、嵌入或异常区块为主 |
| `/article/1-1-4` | 128 | 主题描述不完整 |
| `/article/1-1-2` | 267 | 教程深度不足 |
| `/article/1-6-2` | 343 | 缺少完整环境、步骤和验证 |
| `/article/1-1-6` | 426 | 缺少实测证据和常见问题 |
| `/article/1-1-9` | 436 | 缺少完整安装、配置和排错过程 |

About 页面当前的问题：

- 没有清楚介绍 Owen 的背景、经验和专业领域；
- 没有说明内容的创作、测试和审核方法；
- 没有明确的作者资料或外部身份链接；
- description 使用“可用链接/about访问，不会在菜单栏显示”一类内部说明；
- 页面内容主要讨论读书、AI 和投资之间的关系，而不是作者身份。

隐私政策当前已有基础内容，但仍存在：

- 可见内容较短；
- 没有最后更新日期；
- 没有详细列出 Google 和其他第三方 Cookie；
- 没有充分说明个性化广告退出方式；
- 没有 CMP/欧洲用户同意流程说明；
- 页脚缺少明显的 Privacy 入口。

Google官方建议内容提供原创信息、第一手经验、作者背景、清晰来源以及 Who、How、Why 信号。

- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

### 3.6 P1：AdSense 实现和合规风险

已有积极项：

- `/ads.txt` 返回 `200`。
- Publisher ID 与页面配置一致。
- Google 网站验证文件已经存在。
- 隐私政策已提供基础 Cookie 和 AdSense 说明。

已发现的问题：

- 代表性文章页面渲染后出现约 5 份相同的 AdSense 加载脚本。
- `ExternalPlugins.js` 会调用 `initGoogleAdsense`。
- Notion 的 `GLOBAL_JS` 也会动态插入 AdSense 脚本。
- `eval(GLOBAL_JS)` 没有限制在只执行一次的 effect 中，组件重新渲染时可能继续插入脚本。
- 广告脚本是全局注入，可能覆盖搜索、404、认证、登录和后台页面。
- 当前实现容易创建重复 MutationObserver。
- 自动广告可能在低内容或非内容页面出现。

需要特别审阅 Hysteria2/VPN 页面：

- 自建 VPN、隐私保护和合法远程访问本身不等于违规。
- 但如果内容被表述为绕过限制、未授权访问或破解服务，可能触发 hacking/cracking 分类。
- AdSense 审批初期建议对该页面关闭广告，完成政策人工复核后再决定是否开启。

Google官方参考：

- [AdSense Program policies](https://support.google.com/adsense/answer/48182)
- [Make sure your site's pages are ready for AdSense](https://support.google.com/adsense/answer/7299563)
- [Enabling dishonest behavior](https://support.google.com/publisherpolicies/answer/10436828)
- [Required privacy policy content](https://support.google.com/adsense/answer/1348695)
- [Google CMP requirements](https://support.google.com/adsense/answer/13554020)

## 4. 分阶段实施方案

### 4.1 第一阶段：恢复 SSR/SSG

目标：让搜索引擎在第一次 HTTP 响应中就获得完整页面。

计划：

1. 将公共博客页面移出动态 ClerkProvider 的阻塞边界。
2. Clerk 只用于登录、用户控件、认证页和 Dashboard。
3. 将公共 Header 中的 Clerk 控件拆成客户端交互小组件。
4. 确保 SEO Head 不依赖 Clerk 或客户端 hydration。
5. 确保默认主题可以在服务端确定并渲染。
6. 保留文章正文的 SSG/ISR 能力。

验收方法：

```bash
curl -L https://www.funshow.top/article/1-1-14
```

原始响应必须直接包含：

- 唯一 title；
- description；
- canonical；
- H1；
- 文章正文；
- 可抓取内部链接；
- BlogPosting JSON-LD。

### 4.2 第二阶段：规范 URL 与重定向

唯一主域确定为：

```text
https://www.funshow.top
```

计划：

1. `http` 永久跳转到 `https`。
2. 非 `www` 永久跳转到 `www`。
3. 在没有真实独立语言内容前，将 `/zh-CN/*` 308 到无语言前缀版本。
4. `.html` 308 到无后缀、无语言前缀规范 URL。
5. 每个可索引页面增加绝对、自引用 canonical。
6. `theme`、UTM 和其他跟踪参数不进入 canonical。
7. 内部链接全部指向规范 URL。
8. Open Graph URL 与 canonical 保持一致。

如果未来真正启用多语言，则另行实施：

- 每个语言使用独立 Notion 数据源或完整翻译内容；
- 自引用 canonical 指向本语言版本；
- 增加双向 hreflang；
- sitemap 输出语言 alternate；
- 不把仅翻译导航、正文仍相同的页面视为独立语言版本。

### 4.3 第三阶段：重建 sitemap、robots 与索引策略

sitemap 只保留：

- 首页；
- 归档页；
- 有独立介绍文字的分类中心；
- 有独立介绍文字的分类详情页；
- About；
- Contact；
- Privacy；
- Terms；
- Disclaimer；
- 状态为 Published、类型为 Post/Page、slug 合法、返回 200 的页面。

sitemap 删除：

- `/en`；
- `/#`；
- `/search`；
- RSS；
- 登录、注册和认证页面；
- Dashboard；
- 404；
- 重定向 URL；
- noindex URL；
- 带查询参数 URL；
- 密码保护页面；
- Draft、Invisible、Notice、Config、Menu 和 SubMenu 类型。

`lastmod` 规则：

- 文章和页面使用真实 `lastEditedDay`。
- 分类页使用该分类最新一篇文章的更新时间。
- 首页和归档页使用最新公开文章的更新时间。
- 只有发生实质内容变化时才更新。

索引策略：

| 页面类型 | robots 建议 |
|---|---|
| 首页、文章、成熟分类页、About、Contact | `index,follow` |
| 搜索结果、标签薄页、低价值分页 | `noindex,follow` |
| 登录、注册、认证、后台 | `noindex,nofollow` |
| 404 | 返回真实 HTTP 404 |
| 密码保护内容 | `noindex,nofollow` |

robots.txt：

- 允许 Googlebot 抓取所有公开正文。
- 声明唯一 sitemap。
- 可屏蔽 `/api/` 等不需要抓取的接口路径。
- 不使用 robots.txt 代替 canonical。
- 不通过 robots.txt 屏蔽需要读取 noindex 的 HTML 页面。

### 4.4 第四阶段：修复页面 SEO 与结构化数据

基础页面语义：

1. 每页只保留一个主要 H1。
2. 文章标题改为 H1。
3. 页脚站点名称改为普通文本或非 H1 元素。
4. 首页增加清晰描述网站主题的 H1。
5. 分类页增加分类 H1 和原创简介。

元数据：

1. 每篇文章生成独立 title。
2. 每篇文章使用 80–160 字左右、自然可读的 description。
3. 增加自引用 canonical。
4. Open Graph type 使用 `article`。
5. 所有 OG 图片使用绝对 HTTPS URL。
6. 创建稳定的 1200×630 默认分享图。
7. 删除无效字体 preload。
8. 删除或降级无意义的 `meta keywords` 和 geo meta。

结构化数据：

- 首页：`WebSite` + `Organization`。
- About：`ProfilePage` + `Person`。
- 文章：`BlogPosting`。
- 文章和分类：`BreadcrumbList`。

BlogPosting 至少包含：

- `headline`
- `description`
- `image`
- `datePublished`
- `dateModified`
- `author.name`
- `author.url`
- `publisher.name`
- `publisher.logo`
- `mainEntityOfPage`
- `articleSection`
- `keywords`
- `inLanguage`

所有结构化数据必须与页面可见内容一致，不创建页面上不存在的评价、FAQ 或作者资质。

### 4.5 第五阶段：内容、E-E-A-T 与 GEO

#### 内容整改原则

不按固定字数机械扩写，而是保证搜索用户可以完成目标。技术教程建议补充：

- 适用场景；
- 实测环境、系统和版本；
- 前置条件；
- 完整操作步骤；
- 原创截图；
- 成功结果；
- 常见错误；
- 排错过程；
- 安全与风险提示；
- 替代方案；
- 官方资料与引用来源；
- 最后更新日期和变更记录。

#### 作者与网站信任页面

重写 About 页面，包括：

- Owen 的真实背景；
- 主要实践领域；
- 为什么创建 FunShow；
- 使用过的工具和平台；
- 内容如何测试和审核；
- GitHub、邮箱及其他可信身份入口；
- AI 辅助创作的披露原则；
- 投资类内容的经验边界和免责声明。

新增或补强：

- Contact；
- Privacy Policy；
- Terms of Use；
- Disclaimer；
- Editorial Policy；
- Cookie/Consent 说明。

在页脚全站可见地链接这些页面。

#### 内链和主题权威

1. 为 AI智能体、读书笔记、投资理财建立分类导语。
2. 给每个分类设计主题说明和阅读顺序。
3. 每篇文章增加 3–5 个正文上下文内链。
4. 增加面包屑。
5. 修复为空的相关推荐模块。
6. 避免首页反复展示同一批文章造成标题噪声。

#### GEO 内容模板

适合技术和知识类文章的结构：

1. 40–80 字直接回答。
2. 关键结论或适用范围。
3. 环境和前置条件。
4. 步骤或对比表。
5. 实测证据。
6. 故障排查。
7. 限制与替代方案。
8. 来源。
9. 更新记录。

Google 当前说明，AI Overview 和 AI Mode 没有额外的技术门槛或特殊 Schema，页面必须先满足正常索引条件，并提供可见文本、良好内链、页面体验和与正文一致的结构化数据。

- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google's guide to optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

`llms.txt` 可作为 P2 实验项，但不能作为解决 Google 收录问题的手段，也不能代替 SSR、canonical、sitemap、内链和原创内容。

### 4.6 第六阶段：AdSense 整改

代码实现：

1. 删除 Notion `GLOBAL_JS` 中的 AdSense 注入代码。
2. 使用一个统一组件加载一次官方 AdSense 脚本。
3. 防止路由切换和组件重渲染重复插入脚本。
4. 清理重复 MutationObserver。
5. 广告加载失败不得阻塞正文渲染。
6. 审批期间关闭 Auto Ads，或至少建立严格 URL 排除。

建议展示广告的页面：

- 原创内容充分的文章页；
- 内容成熟且具有独立介绍的分类页；
- 审批通过后再根据用户体验评估首页广告。

不建议展示广告的页面：

- 搜索结果；
- 404；
- 登录和注册；
- 认证回调；
- Dashboard；
- 隐私政策、条款和免责声明；
- 密码页；
- 内容不足的文章；
- 尚未完成人工政策复核的 Hysteria2/VPN 页面。

隐私与同意：

1. 在 AdSense 后台“隐私与消息”配置 Google 认证 CMP。
2. 为 EEA、英国和瑞士访问者显示同意管理。
3. 隐私政策明确披露：
   - Google 和第三方供应商使用 Cookie；
   - Cookie 用于展示个性化或非个性化广告；
   - 用户可访问 Google Ads Settings 退出个性化广告；
   - 使用的统计、广告和日志服务；
   - 联系方式和政策更新时间。
4. 确保广告与导航、下载按钮、正文卡片有明确视觉区分。
5. 确保页面内容量明显大于广告和推广材料。

## 5. 性能优化建议

性能不是当前索引率低的第一原因，但会影响页面体验和广告审批，应在 P0 修复后继续实施：

- 删除重复 AdSense 脚本。
- 删除不存在的字体 preload。
- 减少非必要第三方字体和脚本。
- 将装饰性插件延迟加载。
- 为首屏 LCP 图片设置正确尺寸和优先级。
- 非首屏图片继续使用懒加载。
- 使用稳定、可缓存的站点 Logo 和封面。
- 减少 `__NEXT_DATA__` 中不必要的完整 Notion block map。
- 保留 ISR，并为文章设置合理缓存。
- 避免每次访问首页都重新生成文件系统 sitemap/robots。

## 6. 测试与验收标准

### 6.1 技术验收

- 无 JavaScript 抓取时可以获得正文和内部链接。
- 首页和文章页原始 HTML 包含 title、description、canonical 和 JSON-LD。
- 所有可索引 URL 只有一个主域和一个规范地址。
- 非 `www`、`/zh-CN/`、`.html` 等变体按设计 308。
- sitemap 中不存在 404、重定向、noindex、参数或 fragment URL。
- sitemap 中的 lastmod 与真实内容修改时间一致。
- 每页只存在一个主 H1。
- Rich Results Test 没有关键错误。
- 单页只加载一次 AdSense 主脚本。
- `/fonts/inter-var.woff2` 不再产生 404。

### 6.2 自动化测试

建议新增：

- SEO 元数据单元测试；
- canonical 生成测试；
- robots 路由策略测试；
- sitemap 类型与状态过滤测试；
- sitemap 无 404/重复 URL 测试；
- BlogPosting 字段测试；
- 主域和语言重定向测试；
- SSR HTML 快照或集成测试；
- AdSense 脚本幂等加载测试。

构建后执行：

```bash
npm run lint
npm run type-check
npm test
npm run build
```

并对生产构建执行无 JavaScript HTML 检查。

### 6.3 Search Console 验收

部署后：

1. 删除或替换旧 sitemap 提交记录。
2. 提交新的 `https://www.funshow.top/sitemap.xml`。
3. 对以下代表页面使用 URL Inspection：
   - 首页；
   - 最新文章；
   - 一篇旧文章；
   - 一个分类页；
   - About。
4. 检查“查看已抓取的网页”中的原始 HTML和渲染 HTML。
5. 只对最重要的代表性页面请求编入索引，不批量反复提交。
6. 每周记录以下覆盖原因：
   - 已发现但未编入索引；
   - 已抓取但未编入索引；
   - 重复网页；
   - 软 404；
   - 被 noindex 排除；
   - 重定向页面。

## 7. 建议 KPI

部署后 4–8 周评估：

- sitemap 有效 URL 的 HTTP 200 比例：100%。
- sitemap 中重定向、404、noindex URL：0。
- 所有可索引页面首个 HTML 响应含正文与 canonical：100%。
- Rich Results 关键错误：0。
- 单页 AdSense 主脚本数量：1。
- 已索引页面 / 有效 sitemap 页面比例：目标 80% 以上。
- Search Console 中重复网页和软 404 数量持续下降。
- Googlebot 抓取的 HTML 与用户可见正文一致。
- AdSense Policy Center 无政策问题。

索引率目标不是保证值。如果页面内容重复、需求极低或价值不足，Google仍可能选择不索引。

## 8. 推荐实施顺序

### 批次 A：P0 技术修复

- SSR/SSG；
- Clerk 隔离；
- canonical；
- 主域重定向；
- 语言与 `.html` 变体收敛；
- sitemap；
- noindex 策略。

### 批次 B：SEO 语义与结构化数据

- H1；
- title/description；
- BlogPosting；
- Organization/Person；
- Breadcrumb；
- 默认分享图；
- SEO 自动化测试。

### 批次 C：AdSense

- 单次脚本加载；
- 删除 GLOBAL_JS 广告注入；
- 页面投放白名单；
- CMP；
- 隐私政策和页脚入口；
- 政策风险页面排除。

### 批次 D：Notion 内容

- 6 篇薄内容；
- About；
- Contact；
- Terms；
- Disclaimer；
- Editorial Policy；
- 分类导语；
- 上下文内链和相关推荐。

### 批次 E：上线与监控

- 生产构建验证；
- 部署；
- 线上无 JavaScript 抓取验证；
- Rich Results Test；
- Search Console sitemap 重提；
- 4–8 周索引观察；
- 达到内容和技术门槛后申请或重新申请 AdSense。

## 9. 执行边界

本文件是审阅和实施计划，不代表已经完成优化。

正式执行时建议：

1. 先实施批次 A 和 B。
2. 提供代码差异、构建结果和无 JavaScript HTML 验证报告。
3. 经确认后再部署。
4. 内容与政策页面涉及 Notion 数据，单独确认文案后修改。
5. AdSense 自动广告和 CMP 涉及 AdSense 后台配置，应在代码部署后配合完成。

---

## 10. 执行记录与进度跟踪

最近更新：2026-08-10

维护规则：任务完成代码修改后标记为“待验证”；只有通过构建、页面检查或平台数据验证后，才标记为“已完成”。每次变更应同时记录日期、证据、提交或部署版本以及下一步。

本轮前端实施范围：生产配置 `THEME=magzine`，所有主题层前端改动仅落在 `themes/magzine`；共享 SEO、路由、数据和构建层按全站范围修复。

### 10.1 状态定义

| 状态 | 含义 |
| --- | --- |
| ⬜ 未开始 | 尚未执行 |
| 🟡 进行中 | 正在开发或配置 |
| 🔵 待验证 | 已完成修改，等待测试、部署或平台验证 |
| 🟠 受阻 | 存在依赖、权限或数据问题 |
| ✅ 已完成 | 已执行并通过验证 |
| ⏭️ 暂缓 | 经确认后延后处理 |

### 10.2 总体进度

| 阶段 | 任务数 | 已完成 | 待处理 | 当前状态 |
| --- | ---: | ---: | ---: | --- |
| 基线审计与准备 | 3 | 2 | 1 | 🟡 进行中 |
| 批次 A：恢复可索引技术基础 | 7 | 6 | 1 | 🔵 待上线验证 |
| 批次 B：页面语义、元数据与结构化数据 | 6 | 5 | 1 | 🔵 待资产/线上验证 |
| 批次 C：AdSense 与隐私合规 | 5 | 0 | 5 | ⬜ 未开始 |
| 批次 D：内容质量与内部链接 | 5 | 0 | 5 | ⬜ 未开始 |
| 批次 E：部署、提交与持续观察 | 8 | 0 | 8 | ⬜ 未开始 |

### 10.3 主任务跟踪表

| ID | 批次 | 执行项 | 责任范围 | 优先级 | 状态 | 完成日期 | 验证结果与证据 | 提交、部署或备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRE-01 | 准备 | 线上页面、robots.txt、sitemap 与索引现状审计 | 线上站点 | P0 | ✅ 已完成 | 2026-07-27 | 已形成本文基线分析 | 后续补充 Search Console 数据 |
| PRE-02 | 准备 | 源码中的渲染、SEO、路由与广告实现审计 | 源码 | P0 | ✅ 已完成 | 2026-07-27 | 已形成问题清单和实施批次 | 无代码变更 |
| PRE-03 | 准备 | 导出 Search Console 页面索引、站点地图和效果数据 | Search Console | P0 | ⬜ 未开始 | — | 待记录错误类型和 URL 样本 | 需要站点账号数据 |
| A-01 | A | 恢复文章、分类、标签等公开页面的 SSR/SSG 正文输出 | 渲染层 | P0 | ✅ 已完成 | 2026-07-29 | 本地生产构建成功；抽样文章 HTML 含标题、正文和内部链接 | ISR 使用 `fallback: blocking`，空列表返回 404 |
| A-02 | A | 隔离 Clerk 等客户端依赖，避免公开内容被迫全站 CSR | 应用架构 | P0 | ✅ 已完成 | 2026-07-29 | ClerkProvider 仅用于私有路由；公开页服务端 HTML 验证通过 | 公开头部登录控件改为独立客户端岛 |
| A-03 | A | 为所有可索引页面生成唯一、绝对且自引用的 canonical | SEO 元数据 | P0 | ✅ 已完成 | 2026-07-29 | 自动化测试及构建 HTML 验证：绝对 URL、去查询参数、去默认语言和 `.html` | canonical 主域固定取 `BLOG.LINK` |
| A-04 | A | 统一主域名、协议、语言前缀、尾斜杠和跟踪参数重定向 | 路由/CDN | P0 | 🔵 待验证 | — | middleware 与 Next redirects 已实现并通过编译 | 需部署后验证 HTTP、裸域、默认语言、`.html` 的单跳 301 |
| A-05 | A | 建立路由级 index/noindex 策略 | 路由/SEO | P0 | ✅ 已完成 | 2026-07-29 | 搜索、标签、分页、私有路由输出 noindex；搜索构建 HTML 已抽查 | 同时配置 `X-Robots-Tag` |
| A-06 | A | 重建 sitemap，过滤非规范 URL 并输出可信 lastmod | Sitemap | P0 | ✅ 已完成 | 2026-07-29 | 单元测试覆盖收录/排除、规范 URL、分类 URL、lastmod 和 XML | 运行时与静态导出共用同一策略 |
| A-07 | A | 校正 robots.txt，仅屏蔽不应抓取区域并声明 sitemap | Robots | P0 | ✅ 已完成 | 2026-07-29 | 生成器与单元测试通过，仅声明一个绝对 sitemap URL | 上线后再用 Google 工具复核 |
| B-01 | B | 修复 H1/H2 层级和正文语义结构 | 页面模板 | P1 | ✅ 已完成 | 2026-07-29 | `magzine` 文章标题为 H1；首页、列表、搜索、归档、404 增加主标题；组件测试通过 | 主题层仅修改 `themes/magzine` |
| B-02 | B | 按路由生成唯一 title、description、OG 和 Twitter 元数据 | SEO 元数据 | P1 | ✅ 已完成 | 2026-07-29 | 路由级标题、描述、OG/Twitter 及文章元数据已实现；构建 HTML 验证通过 | 移除无效 keywords/geo 元标签 |
| B-03 | B | 增加 WebSite、Organization/Person、BlogPosting、Breadcrumb JSON-LD | 结构化数据 | P1 | ✅ 已完成 | 2026-07-29 | 构建 HTML 中 JSON-LD 可解析，包含 Organization、Person、WebSite、WebPage、BlogPosting、BreadcrumbList | Google 富媒体工具线上验证归入 E-04 |
| B-04 | B | 使用 HTTPS Logo 和 1200×630 社交分享图 | 品牌资源 | P1 | 🔵 待验证 | — | OG/Twitter/Logo 已统一输出绝对 HTTPS URL；当前默认图为 1200×696 | 仍需确认或提供严格 1200×630 品牌图并做线上预览 |
| B-05 | B | 移除或修复失效字体 preload | 性能 | P1 | ✅ 已完成 | 2026-07-29 | 已移除不存在的 `/fonts/inter-var.woff2` preload | 自定义字体仅在配置有效时加载 |
| B-06 | B | 增加 canonical、robots、sitemap 和结构化数据自动化测试 | 测试 | P1 | ✅ 已完成 | 2026-08-10 | 3 个测试套件、9 个测试全部通过 | 覆盖 canonical、robots、索引过滤、sitemap、JSON-LD、H1 |
| C-01 | C | 从 GLOBAL_JS 等配置中移除重复 AdSense 脚本 | 广告代码 | P0 | ⬜ 未开始 | — | 待确认页面不再重复注入 | — |
| C-02 | C | 建立全站唯一、幂等的 AdSense 加载入口 | 广告代码 | P0 | ⬜ 未开始 | — | 待验证主脚本仅加载一次 | — |
| C-03 | C | 设置广告页面白名单并限制自动广告覆盖非内容页 | 广告策略 | P0 | ⬜ 未开始 | — | 待抽查首页、文章和工具页 | — |
| C-04 | C | 配置 CMP、欧洲消息和 Consent Mode | AdSense 后台/隐私 | P0 | ⬜ 未开始 | — | 待进行地区化同意测试 | 需要后台权限 |
| C-05 | C | 审核 VPN、破解、下载等高风险内容和广告适配性 | 内容政策 | P0 | ⬜ 未开始 | — | 待记录保留、改写或排除广告的页面 | — |
| D-01 | D | 优先完善 6 篇薄内容或低价值文章 | Notion 内容 | P1 | ⬜ 未开始 | — | 待比较改写前后结构和原创价值 | — |
| D-02 | D | 重写 About 页面，补充作者、资历、站点定位和联系方式 | Notion 内容 | P1 | ⬜ 未开始 | — | 待检查信任信息完整性 | — |
| D-03 | D | 完善 Contact、Privacy、Terms、Disclaimer、Editorial Policy | Notion 内容 | P0 | ⬜ 未开始 | — | 待逐页检查可访问性与一致性 | — |
| D-04 | D | 为分类和标签页补充唯一导语与主题说明 | Notion 内容 | P1 | ⬜ 未开始 | — | 待检查重复内容和内部链接 | — |
| D-05 | D | 增加上下文链接、面包屑和相关推荐 | 模板/内容 | P1 | ⬜ 未开始 | — | 待检查孤立页面数量和点击深度 | — |
| E-01 | E | 运行 lint、类型检查、自动化测试和生产构建 | 工程验证 | P0 | ⬜ 未开始 | — | 待附命令结果 | — |
| E-02 | E | 部署生产环境并记录版本与回滚点 | 部署 | P0 | ⬜ 未开始 | — | 待验证部署健康状态 | — |
| E-03 | E | 在线复核无 JavaScript 正文、canonical、重定向和 sitemap | 线上验证 | P0 | ⬜ 未开始 | — | 待附代表 URL 检查结果 | — |
| E-04 | E | 使用富媒体搜索结果测试验证结构化数据 | Google 工具 | P1 | ⬜ 未开始 | — | 待记录错误和警告 | — |
| E-05 | E | 在 Search Console 提交新 sitemap | Search Console | P0 | ⬜ 未开始 | — | 待记录读取状态和发现 URL 数 | — |
| E-06 | E | 检查并请求索引代表页面 | Search Console | P1 | ⬜ 未开始 | — | 待记录实时测试和请求日期 | — |
| E-07 | E | 连续 4–8 周观察抓取、索引、展示和点击变化 | Search Console | P1 | ⬜ 未开始 | — | 按周更新 10.6 表格 | — |
| E-08 | E | 完成 AdSense 首次申请或整改后复审 | AdSense | P0 | ⬜ 未开始 | — | 待记录审核结果和政策问题 | 前置项完成后执行 |

### 10.4 执行日志

每次实施或验证后追加一行，保留历史记录，不覆盖以前的结论。

| 日期 | 执行项 ID | 实际操作 | 执行结果 | 验证方式 | 问题或阻塞 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-07-27 | PRE-01、PRE-02 | 审阅线上网站和本地源码，建立 SEO、GEO 与 AdSense 问题基线 | 完成分析，尚未修改代码 | 线上抽样与源码检查 | 缺少 Search Console 详细导出 | 获取索引报告并进入批次 A |
| 2026-07-29 | 文档 | 建立本执行记录与进度跟踪机制 | 已完成 | 文档结构检查 | 无 | 后续实施时持续更新 |
| 2026-07-29 | A-01～A-07 | 完成公开页 SSR/SSG、Clerk 隔离、canonical、重定向、robots/noindex、sitemap 策略 | 6 项完成，A-04 待生产环境验证 | 生产构建、静态 HTML 抽查、单元测试 | 尚未部署，无法确认线上单跳重定向 | 部署后执行 E-03 |
| 2026-07-29 | B-01～B-06 | 完成 `magzine` 语义标题、元数据、JSON-LD、绝对图片 URL、字体清理和测试 | 5 项完成，B-04 待 1200×630 品牌图 | Jest、TypeScript、变更文件 ESLint、生产构建、HTML/JSON-LD 抽查 | 当前默认分享图为 1200×696 | 确认品牌图并执行 E-04 |
| 2026-07-29 | A/B 技术验收 | 运行测试、类型检查、变更文件 lint 和生产构建 | Jest 8/8、TypeScript 通过、变更文件 lint 0 错误、`next build` 通过 | 本地命令和 `.next/server/pages` 抽查 | 全仓库 lint 仍有历史遗留错误；文章页面数据约 174 kB | 后续单列性能优化并清理存量 lint |
| 2026-08-10 | 同步上游并保留 A/B 优化 | 将 `main` 从 `6a550e4f` 快进至 `d59f52f5`（580 个提交），恢复 stash 并按最新架构融合冲突 | 15 个内容冲突全部解决；主题层仍仅修改 `magzine` | Jest 9/9、TypeScript、变更文件 ESLint、Next.js 15.5.23 生产构建 | 构建仍提示上游 `swcMinify`、runtime config 和 Clerk/Next 导入兼容警告 | 部署后执行线上 canonical、重定向、sitemap 与富媒体验证 |

### 10.5 部署与技术验证记录

| 部署日期 | 环境/URL | Git 提交或版本 | 构建结果 | 无 JS 正文 | canonical | 重定向 | sitemap | 结构化数据 | AdSense 单次加载 | 回滚点 | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-07-29 | 本地生产构建（`.next`） | 工作区未提交 | ✅ 通过 | ✅ 抽样文章含标题、正文、内部链接 | ✅ 绝对、自引用且已规范化 | 🔵 配置通过编译，待线上单跳验证 | ✅ 生成策略与测试通过 | ✅ JSON-LD 可解析且类型齐全 | 未验证（批次 C） | 尚未提交 | A/B 本地验收通过，尚未部署 |
| 2026-08-10 | 本地生产构建（Next.js 15.5.23） | `d59f52f5` + 未提交 A/B 优化 | ✅ 50/50 静态页生成完成 | ✅ SSG 文章页生成 | ✅ SEO 测试通过 | 🔵 待生产环境验证 | ✅ sitemap 构建通过 | ✅ JSON-LD 测试通过 | 未验证（批次 C） | stash `0aef32ca` 保留 | 最新上游与本地优化融合验收通过，尚未部署 |

### 10.6 Search Console 周期观察

建议固定每周同一天记录一次，至少连续观察 8 周。索引数据存在延迟，应结合 URL 检查结果和抓取日期判断，不以单日波动下结论。

| 记录日期 | sitemap 有效 URL | 已索引 | 已发现未索引 | 已抓取未索引 | 重复网页 | 软 404 | 重定向页 | 展示次数 | 点击次数 | 平均排名 | 备注 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 基线 | 待导出 | 8 | 待导出 | 待导出 | 待导出 | 待导出 | 待导出 | 待导出 | 待导出 | 待导出 | “已索引 8 页”为当前用户提供数据 |

### 10.7 AdSense 审核跟踪

| 日期 | 站点状态 | 申请/复审结果 | Policy Center 问题 | ads.txt | CMP | 非内容页广告排除 | 风险页面处理 | 后续动作 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 基线 | 整改前 | 尚未记录 | 待检查 | 正常 | 待配置 | 待配置 | VPN 等内容待审核 | 完成 P0 项后再申请或复审 |

### 10.8 最终结果复盘

| 指标 | 优化前基线 | 目标 | 实际结果 | 结论 |
| --- | ---: | ---: | ---: | --- |
| sitemap 有效 URL 数 | 待导出 | 仅保留规范、可索引页面 | 待记录 | 待评估 |
| Google 已索引页面数 | 8 | 持续增长 | 待记录 | 待评估 |
| 已索引数 / sitemap 有效 URL 数 | 待计算 | 逐步达到 80% 以上 | 待记录 | 待评估 |
| “重复网页，Google 选择了不同规范网页”数量 | 待导出 | 显著下降 | 待记录 | 待评估 |
| 软 404 数量 | 待导出 | 0 | 待记录 | 待评估 |
| 抽样页面原始 HTML 含完整正文比例 | 0%（本次抽样） | 100% | 100%（本地构建抽样） | 达标，待线上复核 |
| 抽样页面 AdSense 主脚本加载次数 | 约 5 次（代表页抽样） | 1 次 | 待记录 | 待评估 |
| 富媒体搜索结果严重错误 | 待验证 | 0 | 待记录 | 待评估 |
| Google 自然搜索展示与点击 | 待导出 | 连续 4–8 周呈增长趋势 | 待记录 | 待评估 |
| AdSense 审核 | 待记录 | 通过 | 待记录 | 待评估 |