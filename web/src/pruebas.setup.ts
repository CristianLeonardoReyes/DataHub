import '@testing-library/jest-dom/vitest'

// ProseMirror mide el DOM; jsdom no implementa estas APIs.
const rectVacio = () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {} }) as DOMRect
const listaVacia = () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect = rectVacio
Range.prototype.getClientRects = listaVacia
Element.prototype.getClientRects ??= listaVacia
document.elementFromPoint ??= () => null

