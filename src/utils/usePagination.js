/**
 * 前端分页组合式函数
 *
 * 当前接口一次性返回全量列表，页面全量渲染在数据量变大后会明显卡顿。
 * 这里先在前端切片，统一分页交互；后端接入分页接口后，
 * 只需把 source 换成「当前页数据」、把 total 换成接口返回的总数即可。
 */
import { computed, ref, watch } from 'vue'

export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100]

export function usePagination(source, { pageSize = 10, pageSizes = DEFAULT_PAGE_SIZES } = {}) {
    const page = ref(1)
    const size = ref(pageSize)

    const total = computed(() => (Array.isArray(source.value) ? source.value.length : 0))

    const paged = computed(() => {
        const list = Array.isArray(source.value) ? source.value : []
        const start = (page.value - 1) * size.value
        return list.slice(start, start + size.value)
    })

    // 筛选或删除导致总数变少时，自动回到第一页，避免停留在空白页
    watch([total, size], () => {
        const maxPage = Math.max(1, Math.ceil(total.value / size.value))
        if (page.value > maxPage) page.value = 1
    })

    return { page, size, pageSizes, total, paged }
}
