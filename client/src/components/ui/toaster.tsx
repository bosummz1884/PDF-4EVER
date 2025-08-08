import { useToast } from "@/features/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider data-oid="f6i:k-v">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} data-oid="10qnwjv">
            <div className="grid gap-1" data-oid="8ztuocz">
              {title && <ToastTitle data-oid="5w195:f">{title}</ToastTitle>}
              {description && (
                <ToastDescription data-oid="leaes-4">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose data-oid="6.62oq6" />
          </Toast>
        );
      })}
      <ToastViewport data-oid="ktss.._" />
    </ToastProvider>
  );
}
