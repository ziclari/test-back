export function isVisible(el, activeElements) {
  // Si existe en activeElements, manda
  if (activeElements && el.id in activeElements) {
    return activeElements[el.id] === true;
  }

  // Si no existe, usar el visible por defecto del elemento
  if (el.visible !== undefined) {
    return el.visible === true;
  }

  // Por defecto visible
  return true;
}
