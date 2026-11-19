import { pedir } from './http'

// Contrato de GET /buscar. Tipos propios: el esquema generado declara los enteros como number | string.
export type ResultadoBusqueda = { guid: string; titulo: string; ruta: string; fragmento: string; fechaActualizacion: string }
export type RespuestaBusqueda = { total: number; pagina: number; porPagina: number; resultados: ResultadoBusqueda[] }

export const buscar = (q: string, pagina: number) =>
  pedir<RespuestaBusqueda>('GET', `/buscar?q=${encodeURIComponent(q)}&pagina=${pagina}`)
