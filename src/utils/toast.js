import { toast } from "sonner";

const showToast = {
  success(message) {
    toast.success(message);
  },

  error(message) {
    toast.error(message);
  },

  warning(message) {
    toast.warning(message);
  },

  info(message) {
    toast.info(message);
  },

  loading(message) {
    return toast.loading(message);
  },

  promise(promise, messages) {
    return toast.promise(promise, messages);
  },
};

export default showToast;