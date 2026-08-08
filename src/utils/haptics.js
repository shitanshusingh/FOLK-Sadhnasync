export const triggerHaptic = (type = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      switch (type) {
        case 'light':
          window.navigator.vibrate(15);
          break;
        case 'medium':
          window.navigator.vibrate(30);
          break;
        case 'heavy':
          window.navigator.vibrate(50);
          break;
        case 'success':
          window.navigator.vibrate([20, 30, 20]);
          break;
        case 'error':
          window.navigator.vibrate([40, 40, 40, 40, 40]);
          break;
        default:
          window.navigator.vibrate(15);
      }
    } catch (e) {
      // Ignore vibration errors securely
    }
  }
};
