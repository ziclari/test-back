import React from "react";
import { getPath } from "../../config-parser/getPath";

export default function ImageElement({
  src,
  className,
  action,
  onAction
}) {
  const handleClick = () => {
    if (action) onAction?.(action);
  };

  return (
    <img
      src={getPath(src)}
      className={className}
      onClick={action ? handleClick : undefined}
    />
  );
}
