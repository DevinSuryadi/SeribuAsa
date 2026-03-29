import * as React from "react";

// --- TYPES ---
export interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  open?: boolean;
  variant?: "default" | "destructive";
}

type State = { toasts: ToasterToast[] };

// --- LOGIC ---
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
const genId = () => (count = (count + 1) % Number.MAX_SAFE_INTEGER).toString();

const listeners = new Set<(state: State) => void>();
let memoryState: State = { toasts: [] };

function dispatch(action: any) {
  if (action.type === "ADD_TOAST") {
    memoryState = {
      ...memoryState,
      toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
    };

    // --- TAMBAHKAN LOGIC INI ---
    // Gunakan TOAST_REMOVE_DELAY di sini agar error-nya hilang
    setTimeout(() => {
      dispatch({
        type: "DISMISS_TOAST",
        toastId: action.toast.id,
      });
    }, TOAST_REMOVE_DELAY);
    // ---------------------------

  } else if (action.type === "DISMISS_TOAST") {
    memoryState = {
      ...memoryState,
      toasts: memoryState.toasts.map((t) =>
        t.id === action.toastId || !action.toastId ? { ...t, open: false } : t
      ),
    };
  } else if (action.type === "REMOVE_TOAST") {
    memoryState = {
      ...memoryState,
      toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
    };
  }
  listeners.forEach((l) => l(memoryState));
}

export const toast = ({ ...props }: Omit<ToasterToast, "id">) => {
  const id = genId();

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
    },
  });

  return { id, dismiss };
};

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}