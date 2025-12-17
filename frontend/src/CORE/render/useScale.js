import { useEffect, useState } from "react";

export function useScale(baseWidth = 1920, baseHeight = 1080) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const newScale = Math.min(
        window.innerWidth / baseWidth,
        window.innerHeight / baseHeight
      );
      setScale(newScale);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [baseWidth, baseHeight]);

  return scale;
}
