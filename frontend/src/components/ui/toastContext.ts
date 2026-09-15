import { createContext, useContext } from 'react'

/**
 * Toast 的 context 与读取它的 hook。
 *
 * 单独成一个文件（而不是留在 Toast.tsx 里），是因为 Toast.tsx 只应该导出组件：
 * 同一个模块里同时导出组件和非组件会让 React Fast Refresh 失效，改一行样式就
 * 整页刷新。这份 context 同时被 Provider（Toast.tsx）和消费者（各页面）需要，
 * 放在中间模块里两边都能引。
 */

/** error 原先缺失 —— 最需要提示的失败场景在这个体系里没有位置，各处只能自己造内联的红色卡片 */
export type ToastType = 'success' | 'info' | 'warning' | 'error'

export type ToastCtx = {
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}
