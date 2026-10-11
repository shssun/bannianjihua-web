/**
 * 统一错误文案常量，避免字符串散落在各文件。
 */

/** Supabase 未配置（缺少 env）时的提示。 */
export const BACKEND_NOT_CONFIGURED = '后端未配置：当前展示本地演示数据。';

/** 留言板专用降级提示（更强调不可提交）。 */
export const MESSAGE_BACKEND_NOT_CONFIGURED =
  '后端未配置，留言功能暂不可用。请配置 Supabase 环境变量后重试。';

/** 通用网络/请求失败提示。 */
export const REQUEST_FAILED = '请求失败，请稍后重试。';

/** 文章不存在。 */
export const POST_NOT_FOUND = '未找到该文章。';

/** 工具不存在。 */
export const TOOL_NOT_FOUND = '未找到该工具。';

/** 工具暂无入口（未接入产物）。 */
export const TOOL_NO_ENTRY = '该工具尚未接入可运行产物。';

/** 留言限流提示。 */
export const MESSAGE_RATE_LIMITED = '提交过于频繁，请 60 秒后再试。';

/** 留言内容为空或超长。 */
export const MESSAGE_INVALID_CONTENT = '留言内容需为 1–500 字。';

/** 留言昵称超长。 */
export const MESSAGE_INVALID_NICKNAME = '昵称长度不能超过 30 字。';
