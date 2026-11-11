import React from 'react';
import { ESTADO_LABEL, TIPO_LABEL } from './format';
import type { Bloque, Pagina, Usuario } from './types';

/*
  Contenido de ejemplo con marcado mínimo en línea: <strong>, <em>, <code>, <a href>.
  Se interpreta a nodos de React (sin innerHTML). En web/ el contenido es JSON de Tiptap.
*/
const TOKEN = /<(strong|em|code)>(.*?)<\/\1>|<a href="([^"]+)">(.*?)<\/a>/g;

function decodificar(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function enLinea(html: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(html))) {
    if (m.index > ultimo) out.push(decodificar(html.slice(ultimo, m.index)));
    const [, tag, txt, href, atxt] = m;
    if (tag === 'strong') out.push(<strong key={i++}>{decodificar(txt)}</strong>);
    else if (tag === 'em') out.push(<em key={i++}>{decodificar(txt)}</em>);
    else if (tag === 'code') out.push(<code key={i++}>{decodificar(txt)}</code>);
    else if (/^(https?:|mailto:|#)/.test(href)) out.push(<a key={i++} href={href}>{decodificar(atxt)}</a>);
    else out.push(decodificar(atxt));
    ultimo = TOKEN.lastIndex;
  }
  if (ultimo < html.length) out.push(decodificar(html.slice(ultimo)));
  return out;
}

export function Bloques({ bloques }: { bloques: Bloque[] }) {
  return (
    <>
      {bloques.map((b, i) => {
        switch (b.t) {
          case 'p':
            return <p key={i}>{b.html ? enLinea(b.html) : <br />}</p>;
          case 'h2':
            return <h2 key={i}>{b.texto}</h2>;
          case 'h3':
            return <h3 key={i}>{b.texto}</h3>;
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{enLinea(it)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{enLinea(it)}</li>
                ))}
              </ol>
            );
          case 'check':
            return (
              <ul key={i} className="check">
                {b.items.map((it, j) => (
                  <li key={j} className={it.hecho ? 'done' : undefined}>
                    <input type="checkbox" defaultChecked={it.hecho} aria-label={it.texto} contentEditable={false} />
                    <span>{enLinea(it.texto)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'code':
            return (
              <pre key={i} data-lenguaje={b.lenguaje}>
                <code>{b.codigo}</code>
              </pre>
            );
          case 'quote':
            return <blockquote key={i}>{b.texto}</blockquote>;
          case 'table':
            return (
              <table key={i}>
                <thead>
                  <tr>
                    {b.cabecera.map((c, j) => (
                      <th key={j}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.filas.map((f, j) => (
                    <tr key={j}>
                      {f.map((c, k) => (
                        <td key={k}>{enLinea(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </>
  );
}

/* ---------- Exportación a Markdown (módulo 9) ---------- */

function md(html: string): string {
  return decodificar(
    html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '_$1_')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<a href="([^"]+)">(.*?)<\/a>/g, '[$2]($1)'),
  );
}

function yamlTexto(s: string): string {
  return /[:#"'\[\]{},]/.test(s) ? JSON.stringify(s) : s;
}

export function aMarkdown(
  p: Pagina,
  ruta: string,
  responsable: Usuario | undefined,
): string {
  const yaml = [
    '---',
    `titulo: ${yamlTexto(p.titulo)}`,
    `estado: ${ESTADO_LABEL[p.estado]}`,
    `tipo: ${TIPO_LABEL[p.tipo]}`,
    `ruta: ${yamlTexto(ruta)}`,
    `responsable: ${responsable?.nombre ?? ''}`,
    `etiquetas: [${p.etiquetas.join(', ')}]`,
    `fecha_revision: ${p.fechaRevision ?? ''}`,
    `actualizada: ${p.actualizada.replace('T', ' ')}`,
    '---',
    '',
    `# ${p.titulo}`,
    '',
  ];
  const cuerpo = p.contenido.flatMap((b): string[] => {
    switch (b.t) {
      case 'p':
        return [md(b.html), ''];
      case 'h2':
        return [`## ${b.texto}`, ''];
      case 'h3':
        return [`### ${b.texto}`, ''];
      case 'ul':
        return [...b.items.map((x) => `- ${md(x)}`), ''];
      case 'ol':
        return [...b.items.map((x, i) => `${i + 1}. ${md(x)}`), ''];
      case 'check':
        return [...b.items.map((x) => `- [${x.hecho ? 'x' : ' '}] ${md(x.texto)}`), ''];
      case 'code':
        return ['```' + b.lenguaje, b.codigo, '```', ''];
      case 'quote':
        return [`> ${b.texto}`, ''];
      case 'table':
        return [
          `| ${b.cabecera.join(' | ')} |`,
          `| ${b.cabecera.map(() => '---').join(' | ')} |`,
          ...b.filas.map((f) => `| ${f.map(md).join(' | ')} |`),
          '',
        ];
    }
  });
  return [...yaml, ...cuerpo].join('\n').trimEnd() + '\n';
}

export function nombreArchivo(titulo: string): string {
  return (
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.md'
  );
}
