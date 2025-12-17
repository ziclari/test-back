import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GroupElement from "./GroupElement";

export default function ModalElement({
  id,
  elements = [],
  assets,
  className,
  background,
  onAction,
  activeElements,
  setActiveElements
}) {
  const overlayClasses = [
    "modal-overlay",      // capa oscura
    "fixed inset-0",
    "flex items-center justify-center",
    "z-50",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const containerClasses = ["modal-container", "relative"].join(" ");
  const closeBtnClasses = ["modal-close"].join(" ");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        className={overlayClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={containerClasses}
          style={{
            backgroundImage: background ? `url(${background})` : "",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <button
            className={closeBtnClasses}
            onClick={() => onAction?.(`hide:${id}`)}
          >
            ✕
          </button>

          <GroupElement
            elements={elements}
            assets={assets}
            activeElements={activeElements}
            setActiveElements={setActiveElements}
            onAction={onAction}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
