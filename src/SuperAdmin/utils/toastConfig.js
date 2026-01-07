// Import centralized toast config
import { toastConfig } from '../../utils/toastConfig';

// Use centralized config for SuperAdmin toasts
export const superToastOptions = {
  ...toastConfig,
  pauseOnHover: true, // Override for SuperAdmin if needed
};

