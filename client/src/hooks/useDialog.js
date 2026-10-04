import { useEffect, useRef } from "react";
export function useDialog(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    const cancel = (event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", cancel);
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          "a[href], button, input, select, textarea, [tabindex]",
        ),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          element.getClientRects().length,
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (
        !dialog.contains(document.activeElement) ||
        (event.shiftKey && document.activeElement === first)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    const focusTimer = requestAnimationFrame(() =>
      (
        dialog.querySelector("[data-autofocus]") ??
        dialog.querySelector("button, input, a, select, textarea")
      )?.focus(),
    );
    return () => {
      cancelAnimationFrame(focusTimer);
      dialog.removeEventListener("cancel", cancel);
      dialog.removeEventListener("keydown", trapFocus);
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, onClose]);
  return ref;
}
