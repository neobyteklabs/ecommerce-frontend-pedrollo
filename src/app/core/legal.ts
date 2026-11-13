/**
 * La política comercial de la tienda en UN lugar (bala 8). La leen la página de términos, la de devoluciones y —cuando exista— el
 * formulario de solicitud de devolución: el plazo que promete el texto y el que valida el formulario no pueden salir de dos sitios.
 *
 * VALORES DE ARRANQUE del 12-nov-2026, propuestos por el tech lead y aceptados por Felipe para construir. **Pendientes de la
 * confirmación de Manuel** antes de publicar: cambiar un número aquí cambia el texto de toda la tienda.
 */
export const POLITICA = {
  /** Fecha que se muestra como «última actualización» de los textos legales. */
  actualizado: '12 de noviembre de 2026',
  devolucion: {
    /** Días naturales, contados desde la entrega, para solicitar la devolución. */
    plazoDias: 30,
    /** Días hábiles para reembolsar una vez recibido y revisado el equipo. */
    reembolsoDiasHabiles: 10,
    /** Horas para reportar un paquete dañado o incompleto. */
    reporteDanoHoras: 48,
  },
  cancelacion: {
    /** % del total del pedido que se retiene al cancelar, por papeleo y documentación (definido por Manuel, 12-nov-2026). */
    cargoPct: 4,
  },
  /** Minutos que el pedido conserva su reserva de inventario mientras se paga. */
  reservaMinutos: 30,
  /** A dónde se escriben las solicitudes sobre datos personales (el mismo buzón del aviso de privacidad del grupo). */
  correoPrivacidad: 'soporte@grupoempresarialvega.com',
  correoVentas: 'ventas@bombasvega.mx',
  telefono: { texto: '55 7258 9681', tel: '+525572589681' },
  whatsapp: 'https://wa.me/525572589681',
  jurisdiccion: 'Tlalnepantla de Baz, Estado de México',
} as const;

/** La matriz, como aparece en la landing del grupo (barmesamexico.com.mx, 12-nov-2026). */
export const MATRIZ = {
  nombre: 'Matriz Tlalnepantla',
  direccion: 'Periférico Blvd. Manuel Ávila Camacho 98, Tequexquináhuac Parte Alta, 54020 Tlalnepantla de Baz, Estado de México',
  /** Mapa incrustado de Google (sin llave de API: es el «insertar un mapa» público de Maps). */
  mapaEmbed: 'https://www.google.com/maps?q=Perif.+Blvd.+Manuel+%C3%81vila+Camacho+98,+54020+Tlalnepantla+de+Baz,+M%C3%A9x.&output=embed',
  comoLlegar: 'https://www.google.com/maps/search/?api=1&query=Perif.+Blvd.+Manuel+%C3%81vila+Camacho+98%2C+54020+Tlalnepantla+de+Baz',
} as const;

/** Las redes del grupo, las mismas del pie de su landing. */
export const REDES: readonly { id: 'facebook' | 'instagram' | 'linkedin' | 'youtube'; nombre: string; url: string }[] = [
  { id: 'facebook', nombre: 'Facebook', url: 'https://www.facebook.com/Bombas.y.Sistemas.VEGA.SA.de.CV/' },
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/bombasysistemasvega' },
  { id: 'linkedin', nombre: 'LinkedIn', url: 'https://www.linkedin.com/company/bombas-y-sistemas-vega/' },
  { id: 'youtube', nombre: 'YouTube', url: 'https://www.youtube.com/@BombasysistemasVega' },
];
