import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import ConfirmDialog from "./ConfirmDialog";
export default function UnsavedChanges({ dirty }) {
  const { status } = useAdminAuth();
  const blocker = useBlocker(dirty && status === "authenticated");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const cancel = useCallback(() => blocker.reset?.(), [blocker]);
  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      title="Discard unsaved changes?"
      description="Your edits have not been saved. Stay on this page to keep editing, or discard them to continue."
      confirmLabel="Discard changes"
      onCancel={cancel}
      onConfirm={() => blocker.proceed?.()}
    />
  );
}
