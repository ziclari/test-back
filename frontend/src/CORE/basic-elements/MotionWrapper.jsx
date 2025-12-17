import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { animations } from "../animation-library/animations";

export default function MotionWrapper({ children, animate, delay = 0, style }) {
  const controls = useAnimationControls();
  const [isDelayActive, setIsDelayActive] = useState(delay > 0);

  useEffect(() => {
    // Resetear el estado cuando cambia el delay
    setIsDelayActive(delay > 0);

    // Timer para habilitar clicks después del delay
    let timeoutId;
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        setIsDelayActive(false);
      }, delay * 1000);
    }

    const runSequence = async () => {
      let animList = [];
      let repeatInfinite = false;
      
      if (animate?.sequence) {
        animList = animate.sequence;
        repeatInfinite = animate.repeat === "infinite";
      } else if (Array.isArray(animate)) {
        animList = animate;
        repeatInfinite = animate.infinite === true;
      } else if (typeof animate === "string") {
        animList = [animate];
        repeatInfinite = animate?.infinite === true;
      }

      if (animList.length === 0) {
        const fallback = animations.fadeUp;
        if (fallback.initial) await controls.set(fallback.initial);
        await controls.start({
          ...fallback.animate,
          transition: { ...fallback.transition, delay },
        });
        return;
      }

      for (let j = 0; j < animList.length; j++) {
        const animName = animList[j];
        const anim = animations[animName] || animations.fadeUp;
        const baseTransition = anim.transition || {};

        if (repeatInfinite && j === animList.length - 1) {
          controls.start({
            ...anim.animate,
            transition: { ...baseTransition, delay, repeat: Infinity },
          });
        } else {
          if (anim.initial) await controls.set(anim.initial);
          await controls.start({
            ...anim.animate,
            transition: { ...baseTransition, delay },
          });
        }
      }
    };

    runSequence();

    // Cleanup del timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animate, controls, delay]);

  return (
    <motion.div
      animate={controls}
      style={{
        opacity: animate === "none" ? 1 : 0,
        ...style,
      }}
    >
      <div style={{ 
        pointerEvents: (animate === "none" || !isDelayActive) ? "auto" : "none",
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        {children}
      </div>
    </motion.div>
  );
}