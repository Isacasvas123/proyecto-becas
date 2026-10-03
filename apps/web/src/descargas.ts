/**
 * Entrega al navegador un archivo que ya se descargó con la sesión.
 *
 * Los documentos no tienen URL pública (NFR de seguridad): se piden con el token y llegan como
 * `Blob`. Aquí se convierten en una descarga normal.
 */
export function guardarArchivo(archivo: Blob, nombre: string): void {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  // Se libera después: si se liberara en el acto, algunos navegadores cancelan la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
