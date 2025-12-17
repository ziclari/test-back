// TextElement.jsx
import React from "react";

export default function TextElement({
  content,
  className = "",
  action,
  onAction,
}) {
  const isHTML = /<\/?[a-z][\s\S]*>/i.test(content);

  const Wrapper = action
    ? ({ children }) => (
        <button
          className={className}
          onClick={() => onAction?.(action)}
        >
          {children}
        </button>
      )
    : ({ children }) => (
        <div className={className}>
          {children}
        </div>
      );

  const contentElement = isHTML ? (
    <div
      style={{ whiteSpace: "pre-line" }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  ) : (
    <div style={{ whiteSpace: "pre-line" }}>
      {content}
    </div>
  );

  return <Wrapper>{contentElement}</Wrapper>;
}