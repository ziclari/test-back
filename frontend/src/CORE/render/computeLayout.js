export function computeLayout(el) {
    return {
      position: el.position || "absolute",
      top: el.top,
      left: el.left,
      right: el.right,
      bottom: el.bottom,
      width: el.width,
      height: el.height,
      zIndex: el.zIndex,
      ...el.style,
    };
  }
  