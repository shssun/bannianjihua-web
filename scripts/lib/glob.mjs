/**
 * 极简 glob 匹配器（够用即可，刻意不引入外部依赖）。
 *
 * 支持的通配符：
 *   - `*`   段内任意字符（不跨 `/`）
 *   - `**`  跨段任意字符（含 `/`）
 *   - `?`   段内单个字符
 *
 * 匹配规则（gitignore 风格，便于书写清单）：
 *   - 含 `/` 的 pattern：对**完整相对路径**（POSIX 风格）匹配；
 *   - 不含 `/` 的 pattern：对路径的 **basename** 匹配
 *     （即 `*.py` 能命中任意层级的 `.py` 文件）。
 *
 * 例：
 *   matchesPattern('*.mp4', 'a.mp4')                      // true
 *   matchesPattern('*.mp4', 'tool/a.mp4')                 // true（basename 命中）
 *   matchesPattern('tool/voices/**', 'tool/voices/x/s.mp3') // true
 *   matchesPattern('**\/_qa/**', 'tool/_qa/x.json')        // true
 */

/** 把 glob pattern 编译为正则表达式。 */
function globToRegExp(pattern) {
  let re = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        i += 1;
        if (pattern[i + 1] === '/') {
          i += 1;
          // `**/` 匹配零个或多个前缀目录
          re += '(?:.*/)?';
        } else {
          // 单独的 `**` 匹配任意（含 `/`）
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if ('\\^$.|+()[]{}'.includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/** 编译结果缓存（同一 pattern 只编译一次）。 */
const cache = new Map();

function compile(pattern) {
  let compiled = cache.get(pattern);
  if (!compiled) {
    compiled = globToRegExp(pattern);
    cache.set(pattern, compiled);
  }
  return compiled;
}

/**
 * 判断单个 pattern 是否命中某个相对路径（POSIX 风格）。
 * @param {string} pattern glob 模式
 * @param {string} relPosix 相对路径，如 'tool/voices/x/s00.mp3'
 * @returns {boolean}
 */
export function matchesPattern(pattern, relPosix) {
  const compiled = compile(pattern);
  if (pattern.includes('/')) {
    return compiled.test(relPosix);
  }
  const base = relPosix.slice(relPosix.lastIndexOf('/') + 1);
  return compiled.test(base);
}

/** 是否有任意一个 pattern 命中。 */
export function matchesAny(patterns, relPosix) {
  return patterns.some((pattern) => matchesPattern(pattern, relPosix));
}

/**
 * 综合 include / exclude 判断某文件是否应被同步。
 * include 为空 => 默认全部纳入；exclude 命中 => 排除（优先级更高）。
 * @param {string} relPosix 相对源目录的 POSIX 路径
 * @param {string[]} include 白名单 glob
 * @param {string[]} exclude 黑名单 glob
 */
export function isIncluded(relPosix, include, exclude) {
  const included = include && include.length > 0 ? matchesAny(include, relPosix) : true;
  if (!included) {
    return false;
  }
  if (exclude && exclude.length > 0 && matchesAny(exclude, relPosix)) {
    return false;
  }
  return true;
}
