# 英文工具源料库登记与重建说明（BOOKS-SOURCE）

> 站内英文频道的阅读器类工具，其 `index.html` 是**仓库外源料库的生成产物**。
> 本文档只做「登记与重建说明」：不搬文件、不改文件。
> 权威细节以源料库内 `归档说明.md`（§三「重建命令」）为准，本文是其站内侧索引。

## 1. 对应关系总表

源料库根目录：`C:/Users/ZhuanZ1/Documents/WS/英文学习/`

| 站内工具 id | 源 HTML（源料库根目录下） | 生成脚本（在源料库 `工具/` 下执行） | 内容源目录 |
|---|---|---|---|
| `basic100-sentence-reader` | `基本英文100_纯句词典版.html` | `python 工具/build_pure_dict.py`（直接输出根目录成品；依赖 `数据/build/ecdict.csv`） | `内容/基本英文100/` |
| `chinese-to-english-drill` | `基本英文100_高考版.html` | `python 工具/build_html.py 内容/基本英文100_高考版 …`（生成 `_tmp_gaokao.html` 后移到根目录并命名） | `内容/基本英文100_高考版/` |
| `grammar100-points-reader` | `必修英文法100_高考版.html` | `python 工具/build_html.py 内容/必修英文法100_高考版 …`（生成后移到根目录并命名） | `内容/必修英文法100_高考版/` |
| `movie-line-quotecards` | `台词语音卡_v0.2.html` | `python 工具/build_html.py 内容/台词语音卡 …`（生成 `_tmp_v02.html` 后移到根目录并命名） | `内容/台词语音卡/` |
| `dragon-english-reader` | `英文学习精编.html` | `python 工具/build_html.py . --out 英文学习精编.html --title … --exclude "数据/,模板_精编.md,00_方案与执行步骤.md"` | `内容/`（全库聚合：`必修英文法100/` + `基本英文100/` 等，30 篇文档 / 464 章节） |
| `lockscreen-sentence-drill` | `工具/锁屏背句_demo.html` | **无生成脚本**（手工维护的可行性原型，v0.1，直接原样拷贝） | 无（页面内容自含） |

站内更新流程（各工具注册表注释已写明）：重建源 HTML → 覆盖站内
`public/tools/english/<id>/index.html` → 无需改任何其他文件（注册表靠
`import.meta.glob` 自动收集）。

## 2. 源料库风险提示（重要）

- **源料库不是 git 仓库**（实测 `git status` 返回 `fatal: not a git repository`），
  **没有任何版本保护**——误删/误改即不可逆丢失。
- 它承载的是**内容母版**：`内容/**/*.md`（约 1.1MB，含《基本英文100》
  《必修英文法100》《台词语音卡》的原始 Markdown + 附录 + 仿真题）+
  `工具/*.py`（15 个生成脚本，其中 `build_html.py` 20KB、
  `build_pure_dict.py` 29KB、`md2json.py` 10KB）。
- **重建 HTML 的唯一途径**：修改 `内容/**/*.md` 后重跑
  `python 工具/build_html.py`（纯句词典版为 `build_pure_dict.py`）——
  该链路一旦断（目录丢失或脚本损坏），站内工具将无法再生成更新。
- 现有快照仅 `归档_英文学习精编_v1.0.zip`（v1.0 时刻，74 个文件），
  **不能替代**日常版本保护。
- 建议（超出本文档范围的后续行动项）：把该目录初始化为 git 仓库或纳入
  现有备份体系；至少对 `内容/` 与 `工具/` 做定期快照。

## 3. 版权提示

源料库为竹冈广信原著的中文精编学习笔记，**仅供个人学习使用**，
请勿公开发布或商业使用（源料库 `归档说明.md` 已注明，站内保持一致口径）。
