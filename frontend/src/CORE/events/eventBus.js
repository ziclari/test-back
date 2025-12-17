// eventBus.js
const listeners = {};

export const onEvent = (event, callback) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(callback);

  return () => {
    listeners[event].delete(callback);
  };
};

export const emitEvent = (event, payload) => {
  if (!listeners[event]) return;
  listeners[event].forEach((cb) => cb(payload));
};
