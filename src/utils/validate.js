/**
 * 上传文件校验
 *
 * el-upload 只负责选择文件，不会限制类型和大小；这里统一校验，
 * 避免用户误传 .exe / 超大文件导致解析失败或占用带宽。
 */

const toMegabytes = (bytes) => Math.round((Number(bytes) / 1024 / 1024) * 10) / 10

/**
 * 解析 "YYYY-MM-DD HH:mm" / "YYYY-MM-DD" 这类字符串为 Date。
 *
 * 不能直接 new Date('2026-11-05 16:10')：带空格的格式不是 ISO 标准，
 * 部分浏览器会解析失败；也不要用字符串比较（"16:10" > "9:00" 会误判）。
 * 这里统一把空格替换成 T，交给 Date 按本地时区解析。
 */
export function parseDateTime(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    if (typeof value === 'number') return new Date(value)
    const text = String(value || '').trim()
    if (!text) return null
    const date = new Date(text.includes('T') ? text : text.replace(' ', 'T'))
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 校验时间区间：两个时间必填，且开始时间必须早于结束时间。
 * 返回结构对齐 validateUploadFile，便于表单 validator 和普通函数复用。
 */
export function validateTimeRange(start, end, { startLabel = '开始时间', endLabel = '结束时间' } = {}) {
    if (!start) return { ok: false, message: `请选择${startLabel}` }
    if (!end) return { ok: false, message: `请选择${endLabel}` }
    const startDate = parseDateTime(start)
    if (!startDate) return { ok: false, message: `${startLabel}格式不正确` }
    const endDate = parseDateTime(end)
    if (!endDate) return { ok: false, message: `${endLabel}格式不正确` }
    // 相等同样不合法：区间必须存在实际跨度
    if (startDate.getTime() >= endDate.getTime()) {
        return { ok: false, message: '开始时间不能晚于结束时间' }
    }
    return { ok: true, message: '' }
}

const getExtension = (name = '') => {
    const index = String(name).lastIndexOf('.')
    return index === -1 ? '' : String(name).slice(index).toLowerCase()
}

/**
 * @param {File} file 原生 File 对象（el-upload 的 raw）
 * @param {{ accept?: string[], maxSizeMB?: number }} options
 * @returns {{ ok: boolean, message: string }}
 */
export function validateUploadFile(file, { accept = [], maxSizeMB = 20 } = {}) {
    if (!file) return { ok: false, message: '请选择要上传的文件' }

    if (accept.length > 0) {
        const extension = getExtension(file.name)
        if (!accept.includes(extension)) {
            return { ok: false, message: `仅支持 ${accept.join('、')} 格式的文件` }
        }
    }

    if (maxSizeMB > 0 && Number(file.size) > maxSizeMB * 1024 * 1024) {
        return { ok: false, message: `文件不能超过 ${toMegabytes(maxSizeMB * 1024 * 1024)}MB` }
    }

    return { ok: true, message: '' }
}
