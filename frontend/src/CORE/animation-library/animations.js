export const animations = {
  fade: {
    initial: { opacity: 0, pointerEvents: "none" },
    animate: { opacity: 1, pointerEvents: "auto" },
    exit: { opacity: 0, pointerEvents: "none" },
    transition: { duration: 0.5 },
  },

  fadeUp: {
    initial: { opacity: 0, y: 20, pointerEvents: "none" },
    animate: { opacity: 1, y: 0, pointerEvents: "auto" },
    exit: { opacity: 0, y: 20, pointerEvents: "none" },
    transition: { duration: 0.5 },
  },

  fadeDown: {
    initial: { opacity: 0, y: -20, pointerEvents: "none" },
    animate: { opacity: 1, y: 0, pointerEvents: "auto" },
    exit: { opacity: 0, y: -20, pointerEvents: "none" },
    transition: { duration: 0.5 },
  },

  fadeLeft: {
    initial: { opacity: 0, x: 30, pointerEvents: "none" },
    animate: { opacity: 1, x: 0, pointerEvents: "auto" },
    exit: { opacity: 0, x: 30, pointerEvents: "none" },
    transition: { duration: 0.5 },
  },

  fadeRight: {
    initial: { opacity: 0, x: -30, pointerEvents: "none" },
    animate: { opacity: 1, x: 0, pointerEvents: "auto" },
    exit: { opacity: 0, x: -30, pointerEvents: "none" },
    transition: { duration: 0.5 },
  },

  zoomIn: {
    initial: { opacity: 0, scale: 0.3, pointerEvents: "none" },
    animate: { opacity: 1, scale: 1, pointerEvents: "auto" },
    exit: { opacity: 0, scale: 0.8, pointerEvents: "none" },
    transition: { type: "spring", stiffness: 250, damping: 18 },
  },

  zoomOut: {
    initial: { opacity: 0, scale: 1.8, pointerEvents: "none" },
    animate: { opacity: 1, scale: 1, pointerEvents: "auto" },
    exit: { opacity: 0, scale: 0.5, pointerEvents: "none" },
    transition: { type: "spring", stiffness: 220, damping: 20 },
  },

  slideLeft: {
    initial: { opacity: 0, x: 50, pointerEvents: "none" },
    animate: { opacity: 1, x: 0, pointerEvents: "auto" },
    exit: { opacity: 0, x: -50, pointerEvents: "none" },
    transition: { duration: 0.7 },
  },

  slideRight: {
    initial: { opacity: 0, x: -50, pointerEvents: "none" },
    animate: { opacity: 1, x: 0, pointerEvents: "auto" },
    exit: { opacity: 0, x: 50, pointerEvents: "none" },
    transition: { duration: 0.7 },
  },

  slideUp: {
    initial: { opacity: 0, y: 50, pointerEvents: "none" },
    animate: { opacity: 1, y: 0, pointerEvents: "auto" },
    exit: { opacity: 0, y: -50, pointerEvents: "none" },
    transition: { duration: 0.7 },
  },

  slideDown: {
    initial: { opacity: 0, y: -50, pointerEvents: "none" },
    animate: { opacity: 1, y: 0, pointerEvents: "auto" },
    exit: { opacity: 0, y: 50, pointerEvents: "none" },
    transition: { duration: 0.7 },
  },

  rotateIn: {
    initial: { opacity: 0, rotate: -15, scale: 0.95, pointerEvents: "none" },
    animate: { opacity: 1, rotate: 0, scale: 1, pointerEvents: "auto" },
    exit: { opacity: 0, rotate: 15, pointerEvents: "none" },
    transition: { duration: 0.6 },
  },

  rotateOut: {
    initial: { opacity: 1, rotate: 0, pointerEvents: "auto" },
    exit: { opacity: 0, rotate: 15, pointerEvents: "none" },
    transition: { duration: 0.6 },
  },

  pop: {
    initial: { scale: 0.8, opacity: 0, pointerEvents: "none" },
    animate: { scale: 1.05, opacity: 1, pointerEvents: "auto" },
    exit: { opacity: 0, scale: 0.8, pointerEvents: "none" },
    transition: { type: "spring", stiffness: 300, damping: 10 },
  },

  bounce: {
    initial: { y: 0, pointerEvents: "auto" },
    animate: {
      y: [0, -20, 0],
      pointerEvents: "auto",
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    },
  },

  pulse: {
    initial: { scale: 1, pointerEvents: "auto" },
    animate: {
      scale: [1, 1.05, 1],
      pointerEvents: "auto",
      transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
    },
  },

  heartbeat: {
    initial: { pointerEvents: "auto" },
    animate: {
      scale: [1, 0.92, 1.05, 0.9, 1],
      pointerEvents: "auto",
    },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },

  flipY: {
    initial: { rotateY: 90, opacity: 0, pointerEvents: "none" },
    animate: { rotateY: 0, opacity: 1, pointerEvents: "auto" },
    exit: { rotateY: -90, opacity: 0, pointerEvents: "none" },
    transition: { duration: 0.8 },
  },

  flipX: {
    initial: { rotateX: 90, opacity: 0, pointerEvents: "none" },
    animate: { rotateX: 0, opacity: 1, pointerEvents: "auto" },
    exit: { rotateX: -90, opacity: 0, pointerEvents: "none" },
    transition: { duration: 0.8 },
  },

  staggerContainer: {
    initial: { pointerEvents: "none", opacity: 0 },
    animate: {
      pointerEvents: "auto",
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  },

  none: {},
};
