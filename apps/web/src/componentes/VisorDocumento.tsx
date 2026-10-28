/**
 * US-036 — Muestra un documento adjunto dentro de la pantalla, sin descargarlo.
 *
 * El archivo llega como `Blob` porque los documentos no tienen URL pública. Se convierte en una
 * URL de objeto temporal, que se libera al cerrar o al cambiar de documento.
 */
import { useEffect, useState, type ReactElement } from 'react';

import { guardarArchivo } from '../descargas';

interface Props {
  nombre: string;
  descripcion: string;
  archivo: Blob;
  onCerrar: () => void;
}

export function VisorDocumento({ nombre, descripcion, archivo, onCerrar }: Props): ReactElement {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const creada = URL.createObjectURL(archivo);
    setUrl(creada);
    // Se libera después, no en el acto: el visor del navegador puede seguir pidiéndola un
    // instante más y entonces falla con ERR_FILE_NOT_FOUND.
    return () => {
      setTimeout(() => URL.revokeObjectURL(creada), 10_000);
    };
  }, [archivo]);

  const tipo = archivo.type;
  const esPdf = tipo === 'application/pdf';
  const esImagen = tipo.startsWith('image/');

  return (
    <section className="panel visor">
      <h2>
        {descripcion}
        <span className="visor-acciones">
          <button type="button" className="enlace" onClick={() => guardarArchivo(archivo, nombre)}>
            Descargar
          </button>
          <button type="button" className="enlace" onClick={onCerrar}>
            Cerrar
          </button>
        </span>
      </h2>

      <div className="visor-cuerpo">
        {url === null && <p className="nota-panel">Abriendo…</p>}

        {url !== null && esPdf && <iframe className="visor-marco" src={url} title={descripcion} />}

        {url !== null && esImagen && <img className="visor-imagen" src={url} alt={descripcion} />}

        {url !== null && !esPdf && !esImagen && (
          <p className="nota-panel">
            Este formato no se puede mostrar aquí. Descárguelo para revisarlo.
          </p>
        )}

        <p className="pista">{nombre}</p>
      </div>
    </section>
  );
}
