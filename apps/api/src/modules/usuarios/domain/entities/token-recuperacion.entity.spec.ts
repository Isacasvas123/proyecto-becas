/**
 * Las tres reglas que hacen seguro un permiso de recuperación (US-035).
 *
 * Es una prueba unitaria y no e2e porque dos de las reglas dependen del paso del tiempo: probar
 * la caducidad por HTTP obligaría a esperar una hora o manipular el reloj. La entidad recibe el
 * instante como argumento justamente para adelantar la fecha y no el reloj.
 */
import { ReglaDeNegocioError } from '../../../../shared/exceptions/errores-dominio';
import { TokenRecuperacion, VIGENCIA_MINUTOS } from './token-recuperacion.entity';

const AHORA = new Date('2026-10-24T10:00:00.000Z');
const minutosDespues = (minutos: number) => new Date(AHORA.getTime() + minutos * 60_000);

const nuevo = () =>
  TokenRecuperacion.nuevo({
    id: 'tok-1',
    usuarioId: 'id-ana',
    hashToken: 'hash-del-token',
    ahora: AHORA,
  });

describe('TokenRecuperacion', () => {
  it('nace vigente y caduca a los sesenta minutos', () => {
    const token = nuevo();

    expect(token.estaVigente(AHORA)).toBe(true);
    expect(token.estaVigente(minutosDespues(VIGENCIA_MINUTOS - 1))).toBe(true);
    expect(token.estaVigente(minutosDespues(VIGENCIA_MINUTOS + 1))).toBe(false);
  });

  it('el último minuto todavía cuenta: se vence DESPUÉS de la hora, no al llegar', () => {
    expect(nuevo().estaVigente(minutosDespues(VIGENCIA_MINUTOS))).toBe(true);
  });

  it('usarlo lo deja usado, y no se puede volver a usar', () => {
    const usado = nuevo().usar(minutosDespues(5));

    expect(usado.usadoEn).toEqual(minutosDespues(5));
    expect(usado.estaVigente(minutosDespues(6))).toBe(false);
    expect(() => usado.usar(minutosDespues(6))).toThrow(ReglaDeNegocioError);
  });

  it('un token caducado no se puede usar', () => {
    expect(() => nuevo().usar(minutosDespues(VIGENCIA_MINUTOS + 1))).toThrow(ReglaDeNegocioError);
  });

  /**
   * A quien tiene el enlace en la mano le da igual el motivo, y a quien lo esté probando no
   * se le regala la información de si ese enlace existió alguna vez.
   */
  it('caducado y ya usado dan el mismo mensaje', () => {
    const caducado = () => nuevo().usar(minutosDespues(VIGENCIA_MINUTOS + 1));
    const yaUsado = () => nuevo().usar(minutosDespues(1)).usar(minutosDespues(2));

    const mensaje = (lanzar: () => unknown): string => {
      try {
        lanzar();
        return 'no lanzó';
      } catch (error) {
        return (error as Error).message;
      }
    };

    expect(mensaje(caducado)).toBe(mensaje(yaUsado));
  });

  it('usarlo no muta el original: la entidad es inmutable', () => {
    const token = nuevo();
    token.usar(minutosDespues(1));

    expect(token.usadoEn).toBeNull();
  });
});
