import { readableDescription, specSummary, specsFromDescription } from './specs';

const fila = (d: string) => Object.fromEntries(specsFromDescription(d).map(r => [r.id, r.value]));

describe('datos técnicos desde la descripción del catálogo', () => {
  it('una centrífuga trae potencia, fase, tensión, altura, caudal y conexiones', () => {
    const d = 'Electrobombas centrífugas Marca PEDROLLO Modelo CPm 620, de 1.0 HP, versión monofásica, a 115 V, 60 Hz, carga de 34÷21 m, caudal de 10÷100 L/min, succión de 1" y descarga de 1".';
    expect(fila(d)).toEqual({ hp: '1 HP', fase: 'Monofásica', voltaje: '115 V', frecuencia: '60 Hz', altura: 'de 34 a 21 m', caudal: 'de 10 a 100 L/min', succion: '1"', descarga: '1"' });
    expect(specSummary(specsFromDescription(d))).toBe('1 HP, 115 V, hasta 34 m, hasta 100 L/min');
  });

  it('trifásica con dos tensiones, caudal en m³/h, etapas, paso de sólidos y roscas con fracción', () => {
    expect(fila('Modelo MAGNIFICA 4, de 2.0 HP, versión trifásica, a 220/440 V, 60 Hz, carga de 22.3÷6 m, caudal de 6÷36 m³/h, succión de 2" y descarga de 2".'))
      .toMatchObject({ fase: 'Trifásica', voltaje: '220 / 440 V', altura: 'de 22.3 a 6 m', caudal: 'de 6 a 36 m³/h' });
    expect(fila('Modelo 140PR 24N/12, de 25 HP, 12 etapas, carga de 199÷26 m, caudal de 240÷720 L/min, descarga de 3". Cuerpo hidráulico Panelli (no incluye motor).'))
      .toEqual({ hp: '25 HP', etapas: '12', altura: 'de 199 a 26 m', caudal: 'de 240 a 720 L/min', descarga: '3"' });
    expect(fila('Modelo MC 20/50-2, de 2.0 HP, versión trifásica, a 220 V, 60 Hz, carga de 16÷1 m, caudal de 100÷900 L/min, descarga de 2½", paso de sólidos de 50 mm.'))
      .toMatchObject({ descarga: '2½"', solidos: '50 mm' });
    expect(fila('Modelo X, succión de 1 1/4 y descarga de 1 ')).toEqual({ succion: '1 1/4"', descarga: '1"' });
  });

  it('lo que la descripción no dice no se inventa', () => {
    expect(specsFromDescription('Sellos mecánicos Marca PEDROLLO Modelo AR-12V. Consultar el release en la placa de datos.')).toEqual([]);
    expect(fila('Membranas de reemplazo Marca PEDROLLO Modelo MR 150, capacidad de 150 litros.')).toEqual({ capacidad: '150 L' });
    expect(fila('Combipress sumergible Marca PEDROLLO Modelo CB UP 4/3-2, de 2 HP.')).toEqual({ hp: '2 HP' });
    expect(specsFromDescription(null)).toEqual([]); expect(specSummary([])).toBe('');
    expect(specSummary([{ id: 'hp', label: 'Potencia', value: '10 HP · 7.5 kW' }, { id: 'altura', label: 'Altura (carga)', value: 'de 90 a 48 m' }])).toBe('10 HP, hasta 90 m');
  });

  it('la descripción se muestra legible: «÷» como «a» y con mayúscula inicial', () => {
    expect(readableDescription('mc sumergibles bicanal, carga de 16÷1 m.')).toBe('Mc sumergibles bicanal, carga de 16 a 1 m.');
    expect(readableDescription('  ')).toBeNull();
  });
});
