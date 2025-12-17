import { Link as AriaLink } from 'react-aria-components';
import React from 'react';

/**
 * @typedef {Object} CustomLinkProps
 * @property {'default' | 'subtle' | 'button-like' | string} [variant='default'] - Define la variante visual del enlace para estilos personalizados.
 * @property {LinkProps} [LinkProps] - Todas las props nativas del componente Link de react-aria-components.
 * @property {string} [className] - Clases CSS opcionales.
 * @property {string} [imageSrc] - Si se pasa, el botón se renderiza como imagen o con imagen.
 * @property {string} [imageAlt] - Texto alternativo para la imagen.
 * @property {string} [imageClassName] - Clases aplicadas a la imagen.
 * @property {boolean} [useAsBackground=false] - Si true, usa la imagen como fondo del botón.
 * @property {string|JSX.Element} [text] - Texto del botón.
 */

const Link = React.forwardRef(
  (
    {
      variant,
      className,
      imageSrc,
      imageAlt,
      imageClassName,
      useAsBackground = false,
      text,
      elements,
      renderElement, // función del motor de escenas para renderizar elementos
      ...props
    },
    ref
  ) => {

    const finalClassName =
      className != null
        ? variant != null
          ? `link-${variant} ${className}`
          : className
        : undefined;

    const style =
      useAsBackground && imageSrc
        ? {
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
        : {};

    return (
      <AriaLink
        {...props}
        ref={ref}
        {...(finalClassName ? { className: finalClassName } : {})}
        {...(Object.keys(style).length ? { style } : {})}
      >

        {/* Imagen inline cuando NO es fondo */}
        {imageSrc && !useAsBackground && (
          <img
            src={imageSrc}
            alt={imageAlt || ''}
            className={imageClassName || ''}
          />
        )}

        {/* CHILDREN DEL YAML: elements[] */}
        {Array.isArray(elements) && renderElement &&
          elements.map((el, idx) => renderElement(el, idx))}

        {/* TEXTO */}
        {!elements && text}

      </AriaLink>
    );
  }
);

Link.displayName = 'Link';
export default Link;