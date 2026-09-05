/**
 * PRUEBAS DE INTEGRACIÓN — US-003, control de acceso.
 *
 * Estas son las pruebas que demuestran que **la seguridad está en el servidor**, no en el
 * frontend. Todas hacen peticiones HTTP reales contra la aplicación levantada.
 *
 * Se verifican los cuatro criterios de aceptación de US-003:
 *   1. Los roles definidos existen y se distinguen
 *   2. Una ruta protegida rechaza a quien no tiene sesión
 *   3. Un rol insuficiente recibe 403
 *   4. El acceso no autorizado devuelve 403, **no 404 ni el recurso**
 *
 * El verificador de tokens se sustituye por un doble: así se prueba el comportamiento del
 * guard sin depender de la firma real ni de la caducidad, que ya están probadas aparte.
 */
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { RolUsuario } from '../src/modules/usuarios/domain/enums/rol-usuario.enum';
import {
  PortadorToken,
  VERIFICADOR_TOKEN,
  VerificadorToken,
} from '../src/modules/usuarios/domain/ports/verificador-token';
import { AutenticacionGuard } from '../src/modules/usuarios/presentation/guards/autenticacion.guard';
import { Publico, Roles } from '../src/modules/usuarios/presentation/guards/decoradores';
import { RolesGuard } from '../src/modules/usuarios/presentation/guards/roles.guard';

/**
 * Verificador falso: reconoce tres tokens y rechaza todo lo demás.
 * No firma nada; solo permite decidir quién es el portador de cada petición.
 */
class VerificadorFalso implements VerificadorToken {
  private readonly conocidos = new Map<string, PortadorToken>([
    ['token-admin', { usuarioId: '1', nombreUsuario: 'admin', rol: RolUsuario.ADMINISTRADOR }],
    ['token-evaluador', { usuarioId: '2', nombreUsuario: 'eva', rol: RolUsuario.EVALUADOR }],
    ['token-estudiante', { usuarioId: '3', nombreUsuario: 'ana', rol: RolUsuario.ESTUDIANTE }],
  ]);

  verificar(token: string): Promise<PortadorToken | null> {
    return Promise.resolve(this.conocidos.get(token) ?? null);
  }
}

/** Controlador de prueba con una ruta de cada tipo. */
@Controller('prueba')
class ControladorDePrueba {
  @Publico()
  @Get('abierta')
  abierta() {
    return { visto: 'por cualquiera' };
  }

  @Get('con-sesion')
  conSesion() {
    return { visto: 'por cualquiera autenticado' };
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('solo-admin')
  soloAdmin() {
    return { visto: 'solo por administradores' };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @Get('admin-o-evaluador')
  adminOEvaluador() {
    return { visto: 'por administradores y evaluadores' };
  }
}

describe('US-003 · Control de acceso (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ControladorDePrueba],
      providers: [
        Reflector,
        { provide: VERIFICADOR_TOKEN, useClass: VerificadorFalso },
        { provide: APP_GUARD, useClass: AutenticacionGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const con = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('rutas públicas', () => {
    it('se pueden abrir sin token', async () => {
      await request(app.getHttpServer()).get('/prueba/abierta').expect(200);
    });

    it('también funcionan con un token válido', async () => {
      await request(app.getHttpServer()).get('/prueba/abierta').set(con('token-admin')).expect(200);
    });
  });

  describe('seguro por defecto', () => {
    it('una ruta SIN decorador exige sesión: sin token devuelve 401', async () => {
      // Este es el criterio de diseño más importante de US-003: olvidar el decorador
      // produce un 401 visible, no una fuga silenciosa.
      await request(app.getHttpServer()).get('/prueba/con-sesion').expect(401);
    });

    it('con un token válido, la ruta responde', async () => {
      await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set(con('token-estudiante'))
        .expect(200);
    });
  });

  describe('tokens rechazados', () => {
    it('rechaza un token desconocido', async () => {
      await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set(con('token-inventado'))
        .expect(401);
    });

    it('rechaza la cabecera sin el esquema Bearer', async () => {
      await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set({ Authorization: 'token-admin' })
        .expect(401);
    });

    it('rechaza un esquema distinto de Bearer', async () => {
      await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set({ Authorization: 'Basic token-admin' })
        .expect(401);
    });

    it('rechaza Bearer sin valor', async () => {
      await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set({ Authorization: 'Bearer ' })
        .expect(401);
    });

    it('devuelve el mismo mensaje falte el token o sea inválido', async () => {
      // Distinguirlos le diría a quien tantea si va por buen camino.
      const sinToken = await request(app.getHttpServer()).get('/prueba/con-sesion').expect(401);
      const conBasura = await request(app.getHttpServer())
        .get('/prueba/con-sesion')
        .set(con('basura'))
        .expect(401);

      expect(sinToken.body.message).toBe(conBasura.body.message);
    });
  });

  describe('autorización por rol', () => {
    it('el administrador entra a la ruta de administrador', async () => {
      await request(app.getHttpServer())
        .get('/prueba/solo-admin')
        .set(con('token-admin'))
        .expect(200);
    });

    it('un estudiante recibe 403, NO 404 ni el recurso', async () => {
      // Criterio de aceptación textual de US-003.
      const respuesta = await request(app.getHttpServer())
        .get('/prueba/solo-admin')
        .set(con('token-estudiante'))
        .expect(403);

      expect(JSON.stringify(respuesta.body)).not.toContain('solo por administradores');
    });

    it('un evaluador tampoco entra a la ruta de administrador', async () => {
      await request(app.getHttpServer())
        .get('/prueba/solo-admin')
        .set(con('token-evaluador'))
        .expect(403);
    });

    it('sin sesión, una ruta con rol devuelve 401 y no llega a evaluar el rol', async () => {
      await request(app.getHttpServer()).get('/prueba/solo-admin').expect(401);
    });

    it('una ruta con varios roles admite a cualquiera de ellos', async () => {
      await request(app.getHttpServer())
        .get('/prueba/admin-o-evaluador')
        .set(con('token-admin'))
        .expect(200);

      await request(app.getHttpServer())
        .get('/prueba/admin-o-evaluador')
        .set(con('token-evaluador'))
        .expect(200);
    });

    it('y sigue rechazando a quien no está en la lista', async () => {
      await request(app.getHttpServer())
        .get('/prueba/admin-o-evaluador')
        .set(con('token-estudiante'))
        .expect(403);
    });
  });
});
