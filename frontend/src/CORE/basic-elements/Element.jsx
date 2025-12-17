import React from "react";
import Button from "./types/AriaButton";
import Link from "./types/AriaLink";
import AudioElement from "./types/AudioElement";
import ImageElement from "./types/ImageElement";
import TextElement from "./types/TextElement";
import CardElement from "./types/CardElement";

import FileUploadElement from "./types/FileUploadElement";
import GroupElement from "./types/GroupElement";
import DialogElement from "./types/DialogElement";
import ModalElement from "./types/ModalElement";


const typeMap = {
  button: Button,
  link: Link,
  audio: AudioElement,
  image: ImageElement,
  text: TextElement,
  card: CardElement,
  dialog: DialogElement,
  group: GroupElement,
  modal: ModalElement,

  fileupload: FileUploadElement,
};

export default function Element({ type, onAction, ...props }) {
  // Props comunes para todos los elementos
  const commonProps = {
    onAction,
    className: props.className || "",
    renderElement: Element,
  };

  const SpecificElement = typeMap[type];

  if (!SpecificElement) return null;
  return <SpecificElement key={type + props.id} {...props} {...commonProps} onAction={onAction} />;
}
