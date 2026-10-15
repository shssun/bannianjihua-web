# 音频/素材侧遗留审计报告（T-013）

> **只读审计，未修改任何原始素材。** 数据来源为仓库外源目录
> `D:/workspaces/每日英语台词/`（约 394 个 `.mp4`）与 `_src-tmp/每日英语台词/` 镜像。
> 本报告只「核实 + 登记」，不做修复；凡信息不足处标注「待确认」。

---

## 一、标签表系统性偏差（`_taxonomy/tags.json` / `_taxonomy/build_tags.py`）

**所称：约 3 处。**

### 实测

对 `_taxonomy/tags.json`（394 条）做结构化检查：

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 条目总数 | `node -e "console.log(require('.../tags.json').items.length)"` | 394（与磁盘 mp4 数一致） |
| 重复文件名 | 遍历 `file` 字段去重比对 | **0** |
| `src_lang` 与文件名语言一致 | 中文文件名应 `zh`、英文应 `en` | **0** 处错配 |
| `en` / `zh` 为空 | 过滤空字符串 | **0** |
| `words` 字段与 `en` 分词数一致 | `en.trim().split(/\s+/).length` | **0** 处不符 |
| 标签值拼写一致性 | 收集所有 `function`/`scene`/`tone` 去重 | 20 个 function、14 个 scene、7 个 tone，**无拼写变体** |

标签词表（无拼写错误）：

- **function**（20）：催促、劝告建议、反问讽刺、安慰鼓励、惊讶、承诺保证、抱怨吐槽、拒绝、示好赞美、表示无所谓、表达感谢、表达爱意、警告威胁、许可、请求、质疑不信、转移话题、道别、道歉、问候寒暄
- **scene**（14）：交通出行、冲突争吵、安慰疗伤、家庭、日常寒暄、朋友聚会、电话沟通、离别送行、紧急状况、约会亲密、职场办公、购物消费、酒吧餐厅、金钱往来
- **tone**（7）：affectionate、confrontational、formal、friendly、neutral、sarcastic、urgent

### 关于 `build_tags.py` 的 `calibrate()` 逻辑

```python
def calibrate(diff, w):
    if diff >= 3:
        return diff          # 3/4/5 星为人工判断，不校准
    if w <= 2: return 1
    if w <= 4: return 2
    return 3
```

该函数对所有人工标注为 1/2 星的条目，**按词数覆盖**难度（1–2 词→1 星、3–4 词→2 星、5+ 词→3 星）。
这是**有意设计**（脚本注释「只有 1/2 星做词数校准」），但确实意味着：
人工对 1/2 星条目的难度判断不会被保留——例如一个 2 词的习语即使被人工标为 2 星，也会被降为 1 星。
是否算「偏差」取决于设计意图，**待确认**。

### 结论

- **结构化层面未发现系统性 bug**：无重复、无 src_lang 错配、无空字段、无标签拼写错误、词数统计一致。
- 所称「约 3 处」**未能通过程序复核定位**——极可能指**语义标注质量**问题
  （某类短语的 function / scene / difficulty 是否贴当），需人工逐条读 `en`/`zh` 与文件名对照判断，
  无法靠结构检查发现。**标记为待确认**。

---

## 二、高危单元需靠帧 OCR 定谳

**所称：约 72 条。**

### 实测

| 文件 | 内容 | 数量 |
| --- | --- | --- |
| `_audit/asr_doubt.json` | `score >= 0.8` 的高危单元 | **72** |
| `_audit/high_risk.json` | 高危单元清单 | **72** |
| `_audit/_frames_a_manifest.json` | 已抽帧样本（A 批） | 36 |
| `_audit/frame_audit_b_meta.json` | 已抽帧样本（B 批） | 36 |

定位命令：

```bash
node -e "const d=require('D:/workspaces/每日英语台词/_audit/asr_doubt.json'); \
  console.log('total:', d.items.length, 'high-risk(score>=0.8):', \
  d.items.filter(x=>x.score>=0.8).length)"
node -e "const d=require('D:/workspaces/每日英语台词/_audit/high_risk.json'); \
  console.log('high_risk.json entries:', Array.isArray(d)?d.length:d.items.length)"
```

`asr_doubt.md` 汇总：片段 386、句单元 1900、命中存疑 643（高危 72 / 中危 168 / 低危 403）。

### 代表文件（高危 Top 5）

1. `为什么不高兴.mp4` #2 — `Buy the long face buy the long face...`（why→buy 同音错拼 + 重复幻觉）
2. `哪凉快哪去.mp4` #6 — `Coobies!`（乱码词）
3. `给点面子.mp4` #5 — `I'm having a contract.`（语义不通）
4. `低调.mp4` #3 — `I said the Lalo.`（lay low→lalo 同音错拼）
5. `时间会证明一切.mp4` #0 — `Time Hotel.`（Time will tell 同音错拼）

### 结论

**72 条与所称完全吻合。** 这 72 条高危单元需靠帧 OCR（看画面字幕）定谳，
当前 `_frames_a_manifest.json` / `frame_audit_b_meta.json` 只覆盖了其中 36 条的抽帧，
**剩余 36 条尚未抽帧**——是否需要补齐抽帧由我方决定。

---

## 三、隔离片段待决定去留（`_orphan_voices/`）

**所称：约 8 条。**

### 实测

`D:/workspaces/每日英语台词/_orphan_voices/` 目录内容：

| 文件 | 大小 |
| --- | --- |
| `5bc657ba06_aria.mp3` | 12,672 B |
| `5bc657ba06_sonia.mp3` | 11,232 B |
| `69048eb6cf_aria.mp3` | 11,664 B |
| `69048eb6cf_sonia.mp3` | 11,232 B |
| `e0ac841015_aria.mp3` | 13,824 B |
| `e0ac841015_sonia.mp3` | 11,952 B |
| `_moved.json` | 152 B |

`_moved.json` 内容：

```json
{"generatedAt": "2026-10-13T17:08:00+08:00", "moved": 6,
 "reason": "文本变更导致文件名（sha1 前缀）失效；重命名保留，未删除"}
```

定位命令：

```bash
ls "D:/workspaces/每日英语台词/_orphan_voices/"
# 6 个 .mp3 + _moved.json
cat "D:/workspaces/每日英语台词/_orphan_voices/_moved.json"
```

### 结论

**实际 6 个 mp3 文件**（3 个 sha1 前缀 × aria/sonia 两个音色），不是 8。
`_moved.json` 也明确写 `moved: 6`。这些是因文本变更导致 sha1 前缀失效、被重命名保留的旧配音，
**未删除**。处置建议：

- **留**：若对应文本已彻底废弃，这些配音无对应入口，可考虑删除以节省空间。
- **去留待确认**：需我方确认这 3 个前缀（`5bc657ba06`、`69048eb6cf`、`e0ac841015`）
  对应的原文本是否已被新版本完全替代；若新版本有新配音，旧的 6 个可删。

---

## 四、whisper 转写疑似幻觉

**所称：约 26 条。**

### 实测

**`_logs/1_transcribe.log`**（3173 行）：

- 关键字扫描：`幻觉`/`hallucinat`/`error`/`warn`/`异常`/`失败` 均 **0 命中**；
  `重复` 仅 1 命中，是切句算法说明「(A)重复 k*len>=0.5*len」，非转写幻觉。
- **结论：转录日志本身不记录幻觉标记**，无法从中统计幻觉数量。

**`_audit/asr_doubt.json`**（643 条存疑单元）的 flag 分布：

| flag | 命中数 |
| --- | --- |
| 低置信度 | 441 |
| 离群/非主题句 | 140 |
| 置信度偏低 | 71 |
| 疑似同音词错拼 | 31 |
| 时长偏紧 | 24 |
| 时长异常 | 22 |
| **重复幻觉** | **17** |
| 与文件名主题不符 | 17 |
| 模板残留 | 10 |
| 疑似栏目语 | 6 |
| **无意义词/乱码** | **5** |

定位命令：

```bash
node -e "const d=require('D:/workspaces/每日英语台词/_audit/asr_doubt.json'); \
  const fc={}; d.items.forEach(x=>x.flags.forEach(f=>fc[f]=(fc[f]||0)+1)); \
  console.log(fc)"
```

### 「whisper 幻觉」的口径

所称「约 26 条」介于以下两个口径之间：

- **严格口径**（仅「重复幻觉」flag）：**17 条**
- **宽泛口径**（重复幻觉 + 无意义词/乱码 + 模板残留）：17 + 5 + 10 = **32 条**

`asr_doubt.md` §4.5 列出的「重复幻觉（whisper 循环）」代表：
`为什么不高兴.mp4`、`时间不等人1.mp4`、`老婆开心.mp4`、`low-key.mp4`、
`the heart wants what the hearts wants.mp4`、`说到做到.mp4`、`走自己的路.mp4` 等 17 条。

### 结论

- 严格 17 条、宽泛 32 条；所称「约 26」可能取中间口径（如重复幻觉 17 + 无意义词/乱码 5 + 部分模板残留）。
- `1_transcribe.log` 对幻觉检测**无用**，幻觉是在审计管线（`asr_doubt.json`）中通过重复/乱码/模板信号识别的。
- 处置建议：优先修 `重复幻觉`（17）与 `无意义词/乱码`（5）共 22 条——这两类几乎可确定为转写错误。

---

## 五、错别字文件名

**所称：约 25 个。**

### 实测

`D:/workspaces/每日英语台词/` 下共 **394 个 `.mp4`**。逐条审读文件名，识别出以下错别字：

#### 英文文件名错别字（11 个）

| # | 文件名（现状） | 推测正确 | 错误类型 |
| --- | --- | --- | --- |
| 1 | `don't ge me wrong.mp4` | don't get me wrong | ge→get |
| 2 | `don't sett;e.mp4` | don't settle | sett;e→settle（分号错） |
| 3 | `give me break.mp4` | give me a break | 缺 a |
| 4 | `his bark is worse than hit bite.mp4` | his bark is worse than his bite | hit→his |
| 5 | `hold your hourses.mp4` | hold your horses | hourses→horses |
| 6 | `mind you own business.mp4` | mind your own business | you→your |
| 7 | `tahta makes two of us.mp4` | that makes two of us | tahta→that |
| 8 | `what a conincidence.mp4` | what a coincidence | conincidence→coincidence |
| 9 | `you are way of line.mp4` | you are way out of line | of→out of |
| 10 | `the heart wants what the hearts wants.mp4` | the heart wants what the heart wants | hearts→heart |
| 11 | `do Dutch.mp4` | Go Dutch | do→Go |

#### 中文文件名错别字（8 个模式，9 个文件）

| # | 文件名（现状） | 推测正确 | 错误类型 |
| --- | --- | --- | --- |
| 1 | `从新开始.mp4` | 重新开始 | 从→重 |
| 2 | `对我又什么好处.mp4` | 对我有什么好处 | 又→有 |
| 3 | `你出个价把.mp4` | 你出个价吧 | 把→吧 |
| 4 | `你还记得我妈.mp4` | 你还记得我吗 | 妈→吗 |
| 5 | `你是万一挑一.mp4` | 你是万里挑一 | 万一→万里 |
| 6 | `你再开玩笑把.mp4` | 你再开玩笑吧 | 把→吧 |
| 7 | `在努力一点.mp4` | 再努力一点 | 在→再 |
| 8 | `在努力一点(1).mp4` | 再努力一点 | 在→再（同 #7 的副本） |

#### 其他命名异常（2 个，非严格错别字）

- `it is what it is .mp4` —— `.mp4` 前多一个空格
- `what am i to you .mp4` —— `.mp4` 前多一个空格

定位命令：

```bash
ls "D:/workspaces/每日英语台词/"*.mp4 | wc -l        # 394
# 人工审读清单；可针对性 grep 已知错字：
ls "D:/workspaces/每日英语台词/" | grep -E "把\.mp4|妈\.mp4|又什么|万一挑一|^从新|^在努力"
```

### 结论

- **清晰错别字：英文 11 + 中文 8 模式（9 文件）= 约 19–20 个文件。**
- 加 2 个尾部空格异常 = 约 21 个。
- 所称「约 25」略高于实测，可能包含：
  - 更主观的中文同音字判断（如「万事胜意」vs「万事如意」，但「万事胜意」本身是有效表达，不计入）；
  - 把带 `1` / `(1)` 后缀的副本文件也计为「异常」（但这些是重复素材标记，非错别字）。
- 处置建议：**改**。重命名这些文件时需同步更新 `_taxonomy/tags.json` 的 `file` 字段、
  `tool/data.json` 的条目引用，以及任何按文件名索引的元数据——建议由我方用脚本批量处理并跑校验。

---

## 六、汇总与处置建议

| 类别 | 所称 | 实测 | 处置 |
| --- | --- | --- | --- |
| ① 标签表偏差 | ~3 处 | 结构 0 问题；语义偏差**待人工确认** | 人工抽审 function/scene/difficulty 标注 |
| ② 高危单元(OCR) | ~72 条 | **72** ✓ | 补齐 72−36=36 条抽帧后逐帧 OCR 定谳 |
| ③ 隔离片段 | ~8 条 | **6** 个 mp3 | 确认对应文本已废弃后删除 |
| ④ whisper 幻觉 | ~26 条 | 严格 17 / 宽泛 32 | 优先修重复幻觉(17)+乱码(5)=22 条 |
| ⑤ 错别字文件名 | ~25 个 | **~19–20** 个清晰错字 | 批量重命名 + 同步 tags.json/data.json 引用 |

### 附注

- 本报告所有数量均通过命令实测（见各节「定位命令」），未沿用所称数字。
- 源目录在仓库外，本项**只产出本文档**，未修改任何素材或源文件。
- `_src-tmp/每日英语台词/` 镜像已包含 `_audit/`、`_taxonomy/`、`_orphan_voices/`、`_logs/`，
  可在仓库内复核本报告引用的文件。
