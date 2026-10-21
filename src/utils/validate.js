/**
 * 上传文件校验
 *
 * el-upload 只负责选择文件，不会限制类型和大小；这里统一校验，
 * 避免用户误传 .exe / 超大文件导致解析失败或占用带宽。
 */

const toMegabytes = (bytes) => Math.round((Number(bytes) / 1024 / 1024) * 10) / 10

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
