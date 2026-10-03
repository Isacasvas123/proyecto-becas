import { ExecutionContext, HttpException } from '@nestjs/common';

import { LIMITE, LimiteConsultasGuard, VENTANA_MS } from './limite-consultas.guard';

const contexto = (ip: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ ip }) }) }) as unknown as ExecutionContext;

describe('LimiteConsultasGuard (US-025)', () => {
  afterEach(() => jest.useRealTimers());

  it(`deja pasar ${LIMITE} consultas por dirección y frena la siguiente con 429`, () => {
    const guard = new LimiteConsultasGuard();
    for (let i = 0; i < LIMITE; i++) {
      expect(guard.canActivate(contexto('1.1.1.1'))).toBe(true);
    }
    try {
      guard.canActivate(contexto('1.1.1.1'));
      fail('debió lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it('cada dirección cuenta por separado', () => {
    const guard = new LimiteConsultasGuard();
    for (let i = 0; i < LIMITE; i++) guard.canActivate(contexto('1.1.1.1'));
    expect(guard.canActivate(contexto('2.2.2.2'))).toBe(true);
  });

  it('pasada la ventana, vuelve a dejar pasar', () => {
    jest.useFakeTimers({ now: new Date('2026-10-05T10:00:00Z') });
    const guard = new LimiteConsultasGuard();
    for (let i = 0; i < LIMITE; i++) guard.canActivate(contexto('1.1.1.1'));
    jest.setSystemTime(Date.now() + VENTANA_MS + 1);
    expect(guard.canActivate(contexto('1.1.1.1'))).toBe(true);
  });
});
