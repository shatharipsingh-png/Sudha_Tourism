import { useCallback, useRef } from "react";
import { useDialog } from "../../hooks/useDialog";
import s from "../styles/Admin.module.css";
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  error,
  onCancel,
  onConfirm,
}) {
  const guard = useRef({ busy, onCancel });
  guard.current = { busy, onCancel };
  const close = useCallback(() => {
    if (!guard.current.busy) guard.current.onCancel();
  }, []);
  const ref = useDialog(open, close);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      <div className={s.actions}>
        <button type="button" data-autofocus onClick={close} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={s.danger}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
