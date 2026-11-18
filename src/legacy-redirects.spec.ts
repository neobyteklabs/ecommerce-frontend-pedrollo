import { legacyAnswer } from './legacy-redirects';

describe('direcciones del sitio anterior', () => {
  it('las listas de precios en PDF van a la categoría de su familia', () => {
    expect(legacyAnswer('/wp-content/uploads/2024/03/LP-TANQUES-SP.pdf')).toEqual({ redirect: '/categoria/tanques-precargados' });
    expect(legacyAnswer('/wp-content/uploads/2024/03/LP-PRESURIZACION-SP.pdf')).toEqual({ redirect: '/categoria/presurizacion' });
    expect(legacyAnswer('/wp-content/uploads/2023/11/lp-perifericas-sp.PDF')).toEqual({ redirect: '/categoria/perifericas' });
    expect(legacyAnswer('/wp-content/uploads/2024/03/LP-POZO-PROFUNDO-SP.pdf')).toEqual({ redirect: '/categoria/pozo-profundo' });
    expect(legacyAnswer('/wp-content/uploads/2024/03/LP-SUMERGIBLES-DRENAJE-SP.pdf')).toEqual({ redirect: '/categoria/sumergibles-para-drenaje' });
  });

  it('un PDF que no se reconoce va al catálogo', () => {
    expect(legacyAnswer('/wp-content/uploads/2022/01/garantia.pdf')).toEqual({ redirect: '/catalogo' });
  });

  it('el resto de WordPress ya no existe', () => {
    expect(legacyAnswer('/wp-content/uploads/2024/03/logo.png')).toEqual({ gone: true });
    expect(legacyAnswer('/wp-login.php')).toEqual({ gone: true });
    expect(legacyAnswer('/wp-admin/')).toEqual({ gone: true });
    expect(legacyAnswer('/wp-json/wp/v2/users')).toEqual({ gone: true });
    expect(legacyAnswer('/xmlrpc.php')).toEqual({ gone: true });
  });

  it('las rutas de la tienda no se tocan', () => {
    expect(legacyAnswer('/')).toBeNull();
    expect(legacyAnswer('/categoria/presurizacion')).toBeNull();
    expect(legacyAnswer('/media/fichas/pkm.pdf')).toBeNull();
    expect(legacyAnswer('/wp-contenido')).toBeNull();
  });
});
