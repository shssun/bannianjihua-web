import type { Tool } from '@/types';

/**
 * 锁屏背句_demo.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/工具/锁屏背句_demo.html`
 * 重建：该 demo 为手工维护的原型文件，暂无生成脚本；修订请先改源料库文件再覆盖本目录 `index.html`
 *
 * ⚠️ 原型性质：这是**页内模拟锁屏的判定原型**——不修改系统锁屏、不记忆进度
 * （零 localStorage，仅页面打开时 setInterval 计时），老板明确「上线后在使用过程中再打磨」。
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'lockscreen-sentence-drill',
  name: '锁屏背句 · 可行性原型',
  channel: 'english',
  description:
    '背句判定原型（v0.1 demo）：在页面内模拟锁屏做默写判定 —— 不修改系统锁屏、不记忆进度，仅用于验证「锁屏背句」玩法可行性；支持语音复述（需麦克风授权），拒绝授权时可手动输入。',
  tags: ['英语', '背句', '原型'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/lockscreen-sentence-drill/index.html',
  cover: '🔒',
  version: '0.1.0',
  createdAt: '2026-10-14',
  order: 17,
  icap: ['active'],
};

export default tool;
