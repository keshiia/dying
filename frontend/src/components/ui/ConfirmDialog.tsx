import Modal from './Modal'
import Button from './Button'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** 破坏性操作（删除、不可撤销的标记）用红色确认按钮 */
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * 统一的确认框。
 *
 * 在此之前，全站唯一一处确认是 Tasks.tsx 里的 `window.confirm` —— 一个阻塞式的
 * 原生弹窗，与其余全部自绘 Modal 风格脱节；而真正不可撤销的操作
 * （删除 AI 会话、把风险预警标为误报）反倒没有任何确认。
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确定',
  cancelLabel = '取消',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose} className="max-w-md">
      {description && <div className="text-sm leading-relaxed text-zinc-600">{description}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? '处理中…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
