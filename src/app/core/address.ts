import { OrderAddress } from './api/storefront-api';

/** La dirección de entrega del comprador, recordada en SU dispositivo (F14, limpieza pre-bala 6). La fuente de verdad es el
 *  back-office (`direccion_comprador` por contacto, que nunca la devuelve al navegador); esto solo prellena formularios. */
const ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
export const ESTADOS_MX = ESTADOS;
export const EMPTY_ADDRESS: OrderAddress = { cp: '', calle: '', numeroExt: '', numeroInt: '', colonia: '', municipio: '', estado: 'Ciudad de México', referencias: '' };
const KEY = 'bsv.entrega';
export function loadAddress(): OrderAddress | null {
  try { const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY); return raw ? { ...EMPTY_ADDRESS, ...(JSON.parse(raw) as Partial<OrderAddress>) } : null; } catch { return null; }
}
export function saveAddress(a: OrderAddress) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* privado o sin cuota: no pasa nada */ } }
/** Completa = los seis obligatorios del pedido (§4 del contrato). `numeroInt` y `referencias` son opcionales. */
export function addressComplete(a: OrderAddress | null | undefined): a is OrderAddress {
  return !!a && /^\d{5}$/.test(a.cp.trim()) && !!a.calle.trim() && !!a.numeroExt.trim() && !!a.colonia.trim() && !!a.municipio.trim() && !!a.estado;
}
export function addressEmpty(a: OrderAddress | null | undefined) { return !a || !(a.cp.trim() || a.calle.trim() || a.numeroExt.trim() || a.colonia.trim() || a.municipio.trim()); }
/** Limpia espacios y quita los opcionales vacíos, como hace el checkout. */
export function normalizeAddress(a: OrderAddress): OrderAddress {
  return { cp: a.cp.trim(), calle: a.calle.trim(), numeroExt: a.numeroExt.trim(), ...(a.numeroInt?.trim() ? { numeroInt: a.numeroInt.trim() } : {}), colonia: a.colonia.trim(), municipio: a.municipio.trim(), estado: a.estado, ...(a.referencias?.trim() ? { referencias: a.referencias.trim() } : {}) };
}
