import React, { useEffect, useState } from "react";
import Element from "../Element";
import MotionWrapper from "../MotionWrapper";
import { computeLayout } from "../../render/computeLayout";
import { isVisible } from "../../render/isVisible";
import { resolveElement } from "../../render/resolveElement";
import { interpolate } from "../../render/interpolate";
import { stateManager } from "../../managers/stateManager";
import { onEvent } from "../../events/eventBus";

export default function GroupElement({
  elements,
  assets,
  className,
  action,
  onAction,
  activeElements,
  setActiveElements,
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = onEvent("state:changed", () => {
      setTick((t) => t + 1);
    });

    return unsub;
  }, []);

  const classes = ["group", "group-bg", className].filter(Boolean).join(" ");
  const handleGroupClick = (e) => {
    e.stopPropagation();
    if (action && onAction) {
      onAction(action);
    }
  };
  return (
    <div className={classes} onClick={handleGroupClick}>
      {elements.map((el, i) => {
        if (!isVisible(el, activeElements)) return null;

        const resolved = resolveElement(el, assets);
        const state = stateManager.get();
        const custom = stateManager.getCustom();
        const context = { ...state, custom };

        const interpolated = {};
        for (const [key, value] of Object.entries(resolved)) {
          interpolated[key] =
            typeof value === "string" ? interpolate(value, context) : value;
        }

        const layout = computeLayout(interpolated);

        return (
          <MotionWrapper
            key={resolved.id || i}
            animate={el.animate}
            delay={el.delay ?? el.animate?.delay}
            style={layout}
          >
            <Element
              {...interpolated}
              assets={assets}
              activeElements={activeElements}
              setActiveElements={setActiveElements}
              onAction={onAction}
              action={resolved.action}
            />
          </MotionWrapper>
        );
      })}
    </div>
  );
}
