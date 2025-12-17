import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { getPath } from "../../config-parser/getPath";
import Button from "./AriaButton";
import { stateManager } from "../../managers/stateManager";

export default function CardElement({
  id,
  img,
  title,
  content,
  action,
  requires = [],
  onAction,
  className,
}) {
  const assignments = useMemo(() => {
    try {
      return stateManager.get("assignments");
    } catch {
      return [];
    }
  }, []);

  const isCompleted = (key) => {
    const found = assignments.find((a) => a.name === key);
    return found?.submissionstatus === "submitted";
  };

  const unlocked = requires.every((r) => isCompleted(r));

  const handleClick = () => {
    if (unlocked && onAction) onAction(action);
  };

  // -------------------------------
  // 1. Variantes completas de estilos
  // -------------------------------
  const variantClass = unlocked ? "card--unlocked" : "card--locked";

  return (
    <Button
      className={`card ${variantClass} ${className || ""}`}
      onClick={handleClick}
      isDisabled={!unlocked}
    >
      <div className="card__media">
        <img
          src={getPath(img)}
          alt={title}
          className="card__image"
        />

        {/* Botón de acción */}
        <span className="card__action-icon">
          <Icon icon="mdi:plus-circle-outline" width={48} height={48} />
        </span>

        {/* Lock solo si está bloqueado */}
        {!unlocked && (
          <span className="card__lock-icon">
            <Icon icon="mdi:lock" width={32} height={32} />
          </span>
        )}
      </div>

      <p className="card__text">
        <strong>{title}</strong> {content}
      </p>
    </Button>
  );
}
