import { Button as AriaButton } from 'react-aria-components';
import React from 'react';
import { getPath } from '../../config-parser/getPath';
/**
 * @typedef {Object} CustomButtonProps
 * @property {'primary' | 'secondary' | 'danger' | string} [variant] - Variante visual.
 * @property {string} [className] - Clases CSS opcionales.
 * @property {string} [imageSrc] - Si se pasa, el botón se renderiza como imagen o con imagen.
 * @property {string} [imageAlt] - Texto alternativo para la imagen.
 * @property {string} [imageClassName] - Clases aplicadas a la imagen.
 * @property {boolean} [useAsBackground=false] - Si true, usa la imagen como fondo del botón.
 * @property {string|JSX.Element} [text] - Texto del botón.
 */

/**
 * Botón extendido: permite usar texto, imagen o ambos.
 *
 * @param {import('react-aria-components').ButtonProps & CustomButtonProps} props
 */

/**
 * Ejemplo de uso:
 * 
solo texto
<Button text="Guardar" variant="primary" />
solo imagen
<Button imageSrc="/icons/trash.svg" imageAlt="Eliminar" variant="danger" />
Imagen y texto
<Button
  imageSrc="/icons/add.svg"
  imageClassName="w-4 h-4 mr-2"
  text="Agregar"
  variant="primary"
/>
Imagen fondo
<Button
  imageSrc="/img/bg-button.png"
  useAsBackground
  text="Iniciar"
  className="w-40 h-12 text-white rounded-lg"
/>
imagen y children
<Button imageSrc="/icons/play.svg">
  <span>Continuar</span>
</Button>

 */
const Button = React.forwardRef(
  (
    {
      variant,
      className,
      imageSrc,
      imageAlt,
      imageClassName,
      useAsBackground = false,
      text,
      elements,      // hijos declarados desde YAML
      children,      // hijos React directos
      renderElement, // función del motor de escenas para renderizar elementos
      onAction,
      action,
      ...props
    },
    ref
  ) => {

    const finalClassName = [
      variant ? `button-${variant}` : null,
      className || null
    ]
      .filter(Boolean)
      .join(" ") || undefined;
    

    const style =
      useAsBackground && imageSrc
        ? {
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
        : {};
    return (
      <AriaButton
        {...props}
        ref={ref}
        {...(finalClassName ? { className: finalClassName } : {})}
        {...(Object.keys(style).length ? { style } : {})}
        onPress={() => onAction?.(action)}
      >

        {/* Imagen inline cuando NO es fondo */}
        {imageSrc && !useAsBackground && (
          <img
            src={getPath(imageSrc)}
            alt={imageAlt || ''}
            className={imageClassName || ''}
          />
        )}

        {/* CHILDREN DEL YAML: elements[] */}
        {Array.isArray(elements) && renderElement &&
          elements.map((el, idx) => renderElement(el, idx))}

        {/* CHILDREN DE REACT */}
        {children}

        {/* TEXTO */}
        {!children && !elements && text}

      </AriaButton>
    );
  }
);

Button.displayName = 'Button';
export default Button;