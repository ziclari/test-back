export function resolveElement(el, assets) {

    return {
      ...el,
      src: assets?.[el.src] || el.src,
      img: assets?.[el.img] || el.img,
      icon: assets?.[el.icon] || el.icon,
      imageSrc: assets?.[el.imageSrc] || el.imageSrc,
      background: assets?.[el.background] || el.background,
      button: el.button
        ? {
            ...el.button,
            icon: assets?.[el.button.icon] || el.button.icon,
          }
        : undefined
    };
  }
  