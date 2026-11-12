/**
 * 文本展示清洗
 *
 * 视频号标题常常带一串 @提及 与 #话题#，例如：
 *   @共青团中央 @学校共青团 #山西农业大学#创新创业
 * 原始标题需要保持原样（接口与数据库都不改），只在展示层把 @ 之后的内容截掉。
 */

// 标题被截断成空时的占位文案，避免列表里出现空白行
export const EMPTY_TITLE = '（无标题）'

// 半角 @ 与全角 ＠ 都算提及起始符
const MENTION_START = /[@＠]/

// 截断位置前可能残留的空白与分隔符，需要一并清理
const TRAILING_SEPARATORS = /[\s\-—–－~～_·・|｜/、,，;；:：]+$/

/**
 * 去掉标题里第一个 @ / ＠ 及其后的全部内容（包括紧随其后的 #话题#）。
 *
 * - 标题不含 @ 时原样返回；
 * - 截断后清掉尾部空白与多余分隔符（- — 、 ， : 等）；
 * - 截断后为空则回退占位文案，保证不渲染空白行。
 *
 * @param {string} title 后端返回的原始标题
 * @param {string} [placeholder] 截断后为空时的兜底文案
 * @returns {string}
 */
export function stripMentions(title, placeholder = EMPTY_TITLE) {
    if (title === null || title === undefined) return placeholder
    const raw = String(title)
    if (!raw.trim()) return placeholder

    const start = raw.search(MENTION_START)
    if (start === -1) return raw

    const cleaned = raw.slice(0, start).replace(TRAILING_SEPARATORS, '')
    return cleaned || placeholder
}
