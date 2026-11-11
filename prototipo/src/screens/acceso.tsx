import React from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, MailCheck } from 'lucide-react';
import { ir } from '../lib/store';
import { Button, Campo, Logotipo, cx, inputCls } from '../ui';

/* Pantallas del módulo 1 (Acceso). Fuera del armazón: no hay sesión. */

function Marco({ titulo, linea, children }: { titulo: string; linea?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logotipo hueco="var(--surface)" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.015em]">{titulo}</h1>
            {linea && <p className="mt-1.5 text-[15px] leading-6 text-muted">{linea}</p>}
            <div className="mt-7">{children}</div>
          </div>
        </div>
        <nav aria-label="Pantallas del prototipo" className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
          <span>Prototipo:</span>
          {[
            ['login', 'Inicio de sesión'],
            ['activar', 'Activar cuenta'],
            ['recuperar', 'Recuperar'],
            ['nueva', 'Nueva contraseña'],
            ['bloqueo', 'Bloqueo'],
          ].map(([id, l]) => (
            <a key={id} href={`#/acceso/${id}`} className="hover:text-ink hover:underline">
              {l}
            </a>
          ))}
        </nav>
      </div>
      {/* Campo de marca: el ciclo de vida que DataHub gobierna. */}
      {/* Campo de marca con dos fichas reales del producto: lo que DataHub gobierna. */}
      <aside className="hidden flex-col justify-between bg-[#2b3a8f] p-12 text-white lg:flex" aria-hidden="true">
        <div className="flex flex-1 flex-col justify-center gap-4 pr-6">
          <FichaMuestra
            ruta="Proyectos / Portal Clientes / Publicación y operación"
            titulo="Publicar Portal Clientes en producción"
            estado={{ texto: 'Aprobado', cls: 'bg-[#e9f5d9] text-[#2c4f08]', punto: true }}
            meta="Runbook · Andrés Rojas"
            revision={<span className="font-mono text-[12px] text-[#555a6a]">2027-01-15</span>}
          />
          <FichaMuestra
            ruta="Proyectos / Facturación Legada / Publicación y operación"
            titulo="Publicar Facturación Legada en IIS"
            estado={{ texto: 'Aprobado', cls: 'bg-[#e9f5d9] text-[#2c4f08]', punto: true }}
            meta="Procedimiento · Julián Pardo"
            revision={<span className="font-medium text-[#b3261e]">Vencida hace 26 días</span>}
            desplazada
          />
        </div>
        <div>
          <p className="max-w-[460px] text-[30px] leading-[38px] font-semibold tracking-[-0.02em]">
            El conocimiento técnico de tu equipo, con responsable y vigencia.
          </p>
          <p className="mt-4 text-[13px] text-white/75">DataGlobal · Solo por invitación</p>
        </div>
      </aside>
    </div>
  );
}

/** Fragmento de la interfaz real (siempre en claro, sobre el azul de marca). */
function FichaMuestra({
  ruta,
  titulo,
  estado,
  meta,
  revision,
  desplazada,
}: {
  ruta: string;
  titulo: string;
  estado: { texto: string; cls: string; punto?: boolean };
  meta: string;
  revision: React.ReactNode;
  desplazada?: boolean;
}) {
  return (
    <div
      data-ui
      className={cx(
        'w-full max-w-[440px] rounded-lg bg-white px-5 py-4 text-[#12141c] shadow-[0_18px_40px_rgb(10_16_60/0.35)]',
        desplazada && 'ml-12',
      )}
    >
      <p className="truncate text-[12px] text-[#555a6a]">{ruta}</p>
      <p className="mt-1 text-[16px] leading-6 font-semibold">{titulo}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[#555a6a]">
        <span className={cx('inline-flex h-[22px] items-center gap-1.5 rounded px-2 text-[12px] font-medium', estado.cls)}>
          {estado.punto && <span className="h-1.5 w-1.5 rounded-full bg-[#8dc63f]" />}
          {estado.texto}
        </span>
        <span>{meta}</span>
      </div>
      <p className="mt-2 text-[13px] text-[#555a6a]">Revisión: {revision}</p>
    </div>
  );
}

function Clave({ id, value, onChange, autoFocus }: { id: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const [ver, setVer] = React.useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={ver ? 'text' : 'password'}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, 'pr-11')}
      />
      <button
        type="button"
        onClick={() => setVer(!ver)}
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-faint hover:text-ink"
      >
        {ver ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Regla({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cx('flex items-center gap-2 text-[13px]', ok ? 'text-ok-ink' : 'text-muted')}>
      <span className={cx('flex h-4 w-4 items-center justify-center rounded-full', ok ? 'bg-ok-bg' : 'border border-control')}>
        {ok && <Check size={11} />}
      </span>
      {children}
    </li>
  );
}

function Login() {
  const [correo, setCorreo] = React.useState('andres.rojas@dataglobal.co');
  const [clave, setClave] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  return (
    <Marco titulo="Inicia sesión" linea="Usa el correo con el que te invitaron.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!correo || !clave) return setError('Escribe tu correo y tu contraseña.');
          ir('/inicio');
        }}
      >
        <Campo label="Correo" htmlFor="l-correo">
          <input id="l-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={inputCls} />
        </Campo>
        <Campo label="Contraseña" htmlFor="l-clave" error={error}>
          <Clave id="l-clave" value={clave} onChange={setClave} autoFocus />
        </Campo>
        <a href="#/acceso/recuperar" className="-mt-1 self-start text-[13px] text-brand-text hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
          Iniciar sesión
        </Button>
        <p className="text-[13px] text-muted">No hay registro abierto: un Admin de tu empresa debe invitarte.</p>
      </form>
    </Marco>
  );
}

function Activar() {
  const [nombre, setNombre] = React.useState('');
  const [clave, setClave] = React.useState('');
  const [conf, setConf] = React.useState('');
  const ok = nombre.trim().length > 1 && clave.length >= 10 && clave === conf;
  return (
    <Marco titulo="Activa tu cuenta" linea={<>Laura Méndez te invitó a DataHub de <strong className="text-ink">DataGlobal</strong> como Colaborador.</>}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok) ir('/inicio'); }}>
        <Campo label="Correo" htmlFor="a-correo">
          <input id="a-correo" value="valentina.ruiz@dataglobal.co" readOnly className={cx(inputCls, 'bg-raised text-muted')} />
        </Campo>
        <Campo label="Tu nombre" htmlFor="a-nombre">
          <input id="a-nombre" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
        </Campo>
        <Campo label="Contraseña" htmlFor="a-clave">
          <Clave id="a-clave" value={clave} onChange={setClave} />
        </Campo>
        <Campo label="Confirma la contraseña" htmlFor="a-conf">
          <Clave id="a-conf" value={conf} onChange={setConf} />
        </Campo>
        <ul className="flex flex-col gap-1.5">
          <Regla ok={clave.length >= 10}>Mínimo 10 caracteres</Regla>
          <Regla ok={clave.length > 0 && clave === conf}>Las dos contraseñas coinciden</Regla>
        </ul>
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={!ok}>
          Activar cuenta
        </Button>
        <p className="text-[13px] text-muted">Este enlace es de un solo uso y vence el 29 oct a las 10:15.</p>
      </form>
    </Marco>
  );
}

function Recuperar() {
  const [correo, setCorreo] = React.useState('');
  const [enviado, setEnviado] = React.useState(false);
  if (enviado)
    return (
      <Marco titulo="Revisa tu correo">
        <div className="flex gap-3 rounded-lg border border-line bg-raised p-4 text-[14px]">
          <MailCheck size={18} className="mt-0.5 flex-none text-brand-text" />
          <p>
            Si <strong>{correo}</strong> está registrado, te enviamos un enlace para crear una contraseña nueva. Vence en 1 hora y sirve una sola vez.
          </p>
        </div>
        <a href="#/acceso/login" className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-brand-text hover:underline">
          <ArrowLeft size={15} /> Volver a iniciar sesión
        </a>
      </Marco>
    );
  return (
    <Marco titulo="Recupera tu contraseña" linea="Te enviaremos un enlace al correo de tu cuenta.">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (correo) setEnviado(true); }}>
        <Campo label="Correo" htmlFor="r-correo">
          <input id="r-correo" type="email" autoFocus value={correo} onChange={(e) => setCorreo(e.target.value)} className={inputCls} />
        </Campo>
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Enviar enlace
        </Button>
        <a href="#/acceso/login" className="inline-flex items-center gap-1.5 text-[14px] text-brand-text hover:underline">
          <ArrowLeft size={15} /> Volver a iniciar sesión
        </a>
      </form>
    </Marco>
  );
}

function Nueva() {
  const [clave, setClave] = React.useState('');
  const [conf, setConf] = React.useState('');
  const ok = clave.length >= 10 && clave === conf;
  return (
    <Marco titulo="Crea una contraseña nueva" linea="Para andres.rojas@dataglobal.co">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok) ir('/acceso/login'); }}>
        <Campo label="Contraseña nueva" htmlFor="n-clave">
          <Clave id="n-clave" value={clave} onChange={setClave} autoFocus />
        </Campo>
        <Campo label="Confirma la contraseña" htmlFor="n-conf">
          <Clave id="n-conf" value={conf} onChange={setConf} />
        </Campo>
        <ul className="flex flex-col gap-1.5">
          <Regla ok={clave.length >= 10}>Mínimo 10 caracteres</Regla>
          <Regla ok={clave.length > 0 && clave === conf}>Las dos contraseñas coinciden</Regla>
        </ul>
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={!ok}>
          Guardar contraseña
        </Button>
      </form>
    </Marco>
  );
}

function Bloqueo() {
  const [seg, setSeg] = React.useState(15 * 60);
  React.useEffect(() => {
    const t = setInterval(() => setSeg((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seg / 60)).padStart(2, '0');
  const ss = String(seg % 60).padStart(2, '0');
  return (
    <Marco titulo="Cuenta bloqueada por 15 minutos" linea="Hubo 5 intentos fallidos de inicio de sesión seguidos.">
      <div className="flex items-center gap-4 rounded-lg border border-line bg-raised p-4">
        <Lock size={20} className="flex-none text-faint" />
        <div>
          <p className="text-[13px] text-muted">Podrás intentarlo de nuevo en</p>
          <p className="num font-mono text-[24px] leading-8 font-medium" aria-live="polite">
            {mm}:{ss}
          </p>
        </div>
      </div>
      <p className="mt-5 text-[14px] text-muted">
        Si no recuerdas tu contraseña, no esperes:{' '}
        <a href="#/acceso/recuperar" className="text-brand-text hover:underline">
          recupérala por correo
        </a>
        .
      </p>
      <Button size="lg" className="mt-6 w-full" disabled={seg > 0} onClick={() => ir('/acceso/login')}>
        Volver a iniciar sesión
      </Button>
    </Marco>
  );
}

export function Acceso({ id }: { id: string }) {
  switch (id) {
    case 'activar':
      return <Activar />;
    case 'recuperar':
      return <Recuperar />;
    case 'nueva':
      return <Nueva />;
    case 'bloqueo':
      return <Bloqueo />;
    default:
      return <Login />;
  }
}
