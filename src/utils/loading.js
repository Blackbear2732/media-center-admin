import { customRef } from 'vue'

/**
 * 延迟显示的 loading 状态。
 *
 * 用法与普通 ref 完全一致（v-loading="loading" / loading.value = true），
 * 区别是：赋值 true 后要超过 delay 毫秒才真正变为 true。
 * 瞬时完成的请求（Mock 数据、缓存命中、后端秒回）不会出现遮罩闪烁。
 */
export function useDelayedLoading(delay = 150) {
    let timer = null
    return customRef((track, trigger) => {
        let shown = false
        return {
            get() {
                track()
                return shown
            },
            set(val) {
                if (timer) {
                    clearTimeout(timer)
                    timer = null
                }
                if (val) {
                    timer = setTimeout(() => {
                        timer = null
                        shown = true
                        trigger()
                    }, delay)
                } else if (shown) {
                    // 关闭立即生效，避免遮罩残留
                    shown = false
                    trigger()
                }
            }
        }
    })
}
