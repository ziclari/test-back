import React from "react";
import MotionWrapper from "../MotionWrapper";

export default function DialogElement({
  title,
  text,
  button,
  onAction,
  className,
  flip = false,
}) {
  const classes = [
    "dialog",             // clase base del diálogo
    "dialog-anim",        // animación base (fade-in, slide, etc.)
    flip ? "dialog-flip" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className={flip ? "dialog-inner-flip" : ""}>
       
      {title && <h1 className="dialog-title">{title}</h1>}

      {text && <p className="dialog-text">{text}</p>}

      {button && (
        <div
          className="dialog-button"
          onClick={() => onAction?.(button.action)}
        >
          <span className="dialog-button-label">{button.label}</span>

          <MotionWrapper animate={button.animate} delay={button.delay}>
            <img
              src={button.icon}
              alt=""
              className="dialog-button-icon"
            />
          </MotionWrapper>
        </div>
      )}
      </div>
    </div>
  );
}
