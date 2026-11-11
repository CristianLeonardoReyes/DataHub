import React from 'react';
import { MoreHorizontal, Plus, Send, UserPlus } from 'lucide-react';
import { ESTADO_USUARIO_LABEL, PERFIL_LABEL, cuando, normalizar, plural } from '../lib/format';
import { HOY } from '../lib/mock';
import { puede, useStore } from '../lib/store';
import type { Cliente, EstadoUsuario, Perfil, Usuario } from '../lib/types';
import { Avatar, Button, Campo, Dialogo, IconButton, Lateral, Menu, MenuItem, Panel, cx, inputCls } from '../ui';
import { Encabezado, Lienzo, Seg } from './comun';
import { NoEncontrado } from './jerarquia';

function EstadoBadge({ activo, texto, tono }: { activo?: boolean; texto: string; tono?: 'ok' | 'pendiente' | 'off' }) {
  const t = tono ?? (activo ? 'ok' : 'off');
  return (
    <span
      className={cx(
        'inline-flex h-[22px] flex-none items-center gap-1.5 rounded px-2 text-[12px] font-medium whitespace-nowrap',
        t === 'ok' && 'bg-ok-bg text-ok-ink',
        t === 'pendiente' && 'bg-review-bg text-review-ink',
        t === 'off' && 'bg-archived-bg text-archived-ink',
      )}
    >
      {texto}
    </span>
  );
}

const thCls = 'h-10 px-3 text-left text-[12px] font-normal text-muted first:pl-5 last:pr-5';
const tdCls = 'h-14 px-3 first:pl-5 last:pr-5';

/* ---------- Clientes (Super admin) ---------- */

export function Clientes() {
  const { yo, clientes, setClientes, usuarios, setUsuarios, workspaces, operarEn, avisar } = useStore();
  const [nuevo, setNuevo] = React.useState(false);
  const [confirmar, setConfirmar] = React.useState<Cliente | null>(null);
  const [form, setForm] = React.useState({ nombre: '', identificador: '', correo: '' });
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  const [identManual, setIdentManual] = React.useState(false);

  if (!puede(yo, 'clientes.gestionar')) return <NoEncontrado />;

  const activos = clientes.filter((c) => c.activo).length;

  const crear = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.nombre.trim()) err.nombre = 'Escribe el nombre del cliente.';
    if (!/^[a-z0-9-]{3,30}$/.test(form.identificador)) err.identificador = 'Entre 3 y 30 caracteres: minúsculas, números y guiones.';
    else if (clientes.some((c) => c.identificador === form.identificador)) err.identificador = 'Ya existe un cliente con este identificador.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo)) err.correo = 'Escribe un correo válido.';
    else if (usuarios.some((u) => u.correo === form.correo.toLowerCase())) err.correo = 'Este correo ya pertenece a otro usuario.';
    setErrores(err);
    if (Object.keys(err).length) return;
    const id = `c-${Date.now()}`;
    setClientes((cs) => [...cs, { id, nombre: form.nombre.trim(), identificador: form.identificador, activo: true, fechaCreacion: HOY }]);
    setUsuarios((us) => [
      ...us,
      {
        id: `u-${Date.now()}`,
        clienteId: id,
        nombre: form.correo.split('@')[0],
        correo: form.correo.toLowerCase(),
        perfil: 'admin',
        estado: 'invitado',
        ultimoAcceso: null,
        workspaces: [],
      },
    ]);
    setNuevo(false);
    setForm({ nombre: '', identificador: '', correo: '' });
    setIdentManual(false);
    avisar(`Cliente creado. Invitación enviada a ${form.correo}`);
  };

  return (
    <Lienzo>
      <Encabezado
        titulo="Clientes"
        linea={`${plural(clientes.length, 'cliente', 'clientes')} · ${activos} activos. Desactivar un cliente deja fuera de inmediato a todos sus usuarios.`}
        acciones={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setNuevo(true)}>
            Nuevo cliente
          </Button>
        }
      />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[14px]">
            <thead>
              <tr>
                <th className={thCls}>Cliente</th>
                <th className={thCls}>Admin principal</th>
                <th className={cx(thCls, 'text-right')}>Usuarios</th>
                <th className={cx(thCls, 'text-right')}>Workspaces</th>
                <th className={thCls}>Estado</th>
                <th className={cx(thCls, 'text-right')}>Creado</th>
                <th className={cx(thCls, 'w-[150px]')}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const us = usuarios.filter((u) => u.clienteId === c.id);
                const admin = us.find((u) => u.perfil === 'admin');
                return (
                  <tr key={c.id} className="border-t border-rule">
                    <td className={tdCls}>
                      <span className="block font-medium">{c.nombre}</span>
                      <span className="block font-mono text-[12px] text-muted">{c.identificador}</span>
                    </td>
                    <td className={tdCls}>
                      {admin ? (
                        <span className="block">
                          <span className="block text-[13px]">{admin.correo}</span>
                          {admin.estado === 'invitado' && <span className="block text-[12px] text-review-ink">Invitación pendiente</span>}
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className={cx(tdCls, 'num text-right')}>{us.length}</td>
                    <td className={cx(tdCls, 'num text-right')}>{workspaces.filter((w) => w.clienteId === c.id).length}</td>
                    <td className={tdCls}>
                      <EstadoBadge activo={c.activo} texto={c.activo ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className={cx(tdCls, 'num text-right font-mono text-[13px] text-muted')}>{c.fechaCreacion}</td>
                    <td className={cx(tdCls, 'text-right')}>
                      <span className="flex items-center justify-end gap-1">
                        {c.activo && (
                          <Button size="sm" variant="ghost" onClick={() => operarEn(c.id)}>
                            Operar en
                          </Button>
                        )}
                        <Menu
                          alinear="derecha"
                          ancho={200}
                          boton={({ alternar, abierto }) => (
                            <IconButton label={`Acciones de ${c.nombre}`} aria-expanded={abierto} onClick={alternar}>
                              <MoreHorizontal size={16} />
                            </IconButton>
                          )}
                        >
                          {(cerrar) => (
                            <>
                              <MenuItem onClick={() => { cerrar(); avisar('Prototipo: edición de nombre e identificador'); }}>Editar</MenuItem>
                              <MenuItem
                                peligro={c.activo}
                                onClick={() => {
                                  cerrar();
                                  if (c.activo) setConfirmar(c);
                                  else {
                                    setClientes((cs) => cs.map((x) => (x.id === c.id ? { ...x, activo: true } : x)));
                                    avisar(`${c.nombre} activado`);
                                  }
                                }}
                              >
                                {c.activo ? 'Desactivar' : 'Activar'}
                              </MenuItem>
                            </>
                          )}
                        </Menu>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Lateral abierto={nuevo} cerrar={() => setNuevo(false)} titulo="Nuevo cliente">
        <form onSubmit={crear} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <Campo label="Nombre" htmlFor="cl-nombre" error={errores.nombre}>
              <input
                id="cl-nombre"
                autoFocus
                value={form.nombre}
                onChange={(e) => {
                  const nombre = e.target.value;
                  setForm((f) => ({
                    ...f,
                    nombre,
                    identificador: identManual ? f.identificador : normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30),
                  }));
                }}
                placeholder="Ej.: Transportes Ruta 45"
                className={inputCls}
              />
            </Campo>
            <Campo label="Identificador corto" htmlFor="cl-ident" error={errores.identificador} ayuda="Único y en minúsculas. No se puede cambiar después.">
              <input
                id="cl-ident"
                value={form.identificador}
                onChange={(e) => {
                  setIdentManual(true);
                  setForm((f) => ({ ...f, identificador: e.target.value.toLowerCase() }));
                }}
                className={cx(inputCls, 'font-mono text-[13px]')}
              />
            </Campo>
            <Campo label="Correo del primer Admin" htmlFor="cl-correo" error={errores.correo} ayuda="Le enviaremos una invitación de un solo uso que vence en 72 horas.">
              <input
                id="cl-correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                placeholder="nombre@empresa.com"
                className={inputCls}
              />
            </Campo>
          </div>
          <footer className="flex justify-end gap-2 border-t border-rule px-6 py-4">
            <Button type="button" onClick={() => setNuevo(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={<Send size={14} />}>
              Crear y enviar invitación
            </Button>
          </footer>
        </form>
      </Lateral>

      <Dialogo abierto={!!confirmar} cerrar={() => setConfirmar(null)} titulo={`Desactivar ${confirmar?.nombre ?? ''}`}>
        {confirmar && (
          <div className="p-5 text-[14px]">
            <p>
              Los {plural(usuarios.filter((u) => u.clienteId === confirmar.id && u.estado === 'activo').length, 'usuario activo', 'usuarios activos')} de{' '}
              <strong>{confirmar.nombre}</strong> perderán el acceso en su siguiente acción. Su contenido se conserva y puedes volver a activarlo.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setConfirmar(null)}>Cancelar</Button>
              <Button
                variant="danger"
                onClick={() => {
                  setClientes((cs) => cs.map((x) => (x.id === confirmar.id ? { ...x, activo: false } : x)));
                  avisar(`${confirmar.nombre} desactivado`);
                  setConfirmar(null);
                }}
              >
                Desactivar cliente
              </Button>
            </div>
          </div>
        )}
      </Dialogo>
    </Lienzo>
  );
}

/* ---------- Usuarios (Admin y Super admin) ---------- */

const PERFILES_CLIENTE: Perfil[] = ['admin', 'coordinador', 'colaborador'];

function badgeUsuario(e: EstadoUsuario) {
  return <EstadoBadge texto={ESTADO_USUARIO_LABEL[e]} tono={e === 'activo' ? 'ok' : e === 'invitado' ? 'pendiente' : 'off'} />;
}

export function Usuarios() {
  const { yo, usuarios, setUsuarios, clienteActivo, workspaces, avisar } = useStore();
  const [filtro, setFiltro] = React.useState<'todos' | EstadoUsuario>('todos');
  const [invitar, setInvitar] = React.useState(false);
  const [editar, setEditar] = React.useState<Usuario | null>(null);
  const [form, setForm] = React.useState<{ correo: string; perfil: Perfil; ws: string[] }>({ correo: '', perfil: 'colaborador', ws: [] });
  const [error, setError] = React.useState<string | null>(null);

  if (!puede(yo, 'usuarios.gestionar')) return <NoEncontrado />;

  const delCliente = usuarios.filter((u) => u.clienteId === clienteActivo.id);
  const wsCliente = workspaces.filter((w) => w.clienteId === clienteActivo.id);
  const adminsActivos = delCliente.filter((u) => u.perfil === 'admin' && u.estado === 'activo');
  const lista = filtro === 'todos' ? delCliente : delCliente.filter((u) => u.estado === filtro);
  const n = (e: EstadoUsuario) => delCliente.filter((u) => u.estado === e).length;

  /** Reglas: un Admin no se cambia a sí mismo; un cliente nunca queda sin Admin activo. */
  const bloqueo = (u: Usuario): string | null => {
    if (u.id === yo.id) return 'No puedes cambiar tu propio perfil ni desactivarte.';
    if (u.perfil === 'admin' && u.estado === 'activo' && adminsActivos.length === 1) return 'Es el único Admin activo del cliente.';
    return null;
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const correo = form.correo.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return setError('Escribe un correo válido.');
    if (usuarios.some((u) => u.correo === correo)) return setError('Este correo ya está registrado. El correo es único en todo DataHub.');
    setUsuarios((us) => [
      ...us,
      {
        id: `u-${Date.now()}`,
        clienteId: clienteActivo.id,
        nombre: correo.split('@')[0],
        correo,
        perfil: form.perfil,
        estado: 'invitado',
        ultimoAcceso: null,
        workspaces: form.perfil === 'admin' ? [] : form.ws,
      },
    ]);
    setInvitar(false);
    setForm({ correo: '', perfil: 'colaborador', ws: [] });
    setError(null);
    avisar(`Invitación enviada a ${correo}`);
  };

  const guardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editar) return;
    setUsuarios((us) => us.map((u) => (u.id === editar.id ? editar : u)));
    avisar(`Cambios guardados para ${editar.nombre}`);
    setEditar(null);
  };

  const venceInvitacion = '29 oct a las 10:15';

  return (
    <Lienzo>
      <Encabezado
        titulo="Usuarios"
        linea={`${clienteActivo.nombre} · ${plural(n('activo'), 'usuario activo', 'usuarios activos')} · ${plural(n('invitado'), 'invitación pendiente', 'invitaciones pendientes')}`}
        acciones={
          <Button variant="primary" icon={<UserPlus size={15} />} onClick={() => setInvitar(true)}>
            Invitar usuario
          </Button>
        }
      />
      <Panel>
        <div className="border-b border-line px-5">
          <Seg
            etiqueta="Filtrar por estado"
            valor={filtro}
            cambiar={(v) => setFiltro(v as typeof filtro)}
            opciones={[
              { id: 'todos', label: 'Todos', n: delCliente.length },
              { id: 'activo', label: 'Activos', n: n('activo') },
              { id: 'invitado', label: 'Invitados', n: n('invitado') },
              { id: 'inactivo', label: 'Inactivos', n: n('inactivo') },
            ]}
          />
        </div>
        {lista.length === 0 ? (
          <p className="px-5 py-5 text-[14px] text-muted">No hay usuarios en este estado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[14px]">
              <thead>
                <tr>
                  <th className={thCls}>Persona</th>
                  <th className={thCls}>Perfil</th>
                  <th className={thCls}>Workspaces</th>
                  <th className={thCls}>Estado</th>
                  <th className={cx(thCls, 'text-right')}>Último acceso</th>
                  <th className={cx(thCls, 'w-[64px]')}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id} className={cx('border-t border-rule', u.estado === 'inactivo' && 'text-muted')}>
                    <td className={tdCls}>
                      <span className="flex items-center gap-3">
                        <Avatar nombre={u.nombre} id={u.id} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {u.nombre}
                            {u.id === yo.id && <span className="font-normal text-muted"> (tú)</span>}
                          </span>
                          <span className="block truncate text-[13px] text-muted">{u.correo}</span>
                        </span>
                      </span>
                    </td>
                    <td className={tdCls}>{PERFIL_LABEL[u.perfil]}</td>
                    <td className={cx(tdCls, 'max-w-[260px]')}>
                      {u.perfil === 'admin' ? (
                        <span className="text-[13px] text-muted">Todos</span>
                      ) : u.workspaces.length ? (
                        <span className="block truncate text-[13px]">
                          {u.workspaces.map((id) => workspaces.find((w) => w.id === id)?.nombre).join(', ')}
                        </span>
                      ) : (
                        <span className="text-[13px] text-danger">Sin asignar</span>
                      )}
                    </td>
                    <td className={tdCls}>{badgeUsuario(u.estado)}</td>
                    <td className={cx(tdCls, 'num text-right text-[13px] whitespace-nowrap text-muted')}>
                      {u.ultimoAcceso ? cuando(u.ultimoAcceso) : '—'}
                    </td>
                    <td className={cx(tdCls, 'text-right')}>
                      <Menu
                        alinear="derecha"
                        ancho={260}
                        boton={({ alternar, abierto }) => (
                          <IconButton label={`Acciones de ${u.nombre}`} aria-expanded={abierto} onClick={alternar}>
                            <MoreHorizontal size={16} />
                          </IconButton>
                        )}
                      >
                        {(cerrar) => {
                          const motivo = bloqueo(u);
                          return (
                            <>
                              <MenuItem
                                onClick={() => {
                                  cerrar();
                                  setEditar({ ...u });
                                }}
                              >
                                Editar perfil y workspaces
                              </MenuItem>
                              {u.estado === 'invitado' && (
                                <MenuItem
                                  onClick={() => {
                                    cerrar();
                                    avisar(`Invitación reenviada a ${u.correo}`);
                                  }}
                                >
                                  Reenviar invitación
                                </MenuItem>
                              )}
                              {u.estado !== 'invitado' &&
                                (motivo && u.estado === 'activo' ? (
                                  <p className="px-2.5 py-1.5 text-[12px] leading-4 text-muted">No se puede desactivar: {motivo.toLowerCase()}</p>
                                ) : (
                                  <MenuItem
                                    peligro={u.estado === 'activo'}
                                    onClick={() => {
                                      cerrar();
                                      setUsuarios((us) =>
                                        us.map((x) => (x.id === u.id ? { ...x, estado: x.estado === 'activo' ? 'inactivo' : 'activo' } : x)),
                                      );
                                      avisar(u.estado === 'activo' ? `${u.nombre} desactivado` : `${u.nombre} activado`);
                                    }}
                                  >
                                    {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                  </MenuItem>
                                ))}
                            </>
                          );
                        }}
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Invitar */}
      <Lateral abierto={invitar} cerrar={() => setInvitar(false)} titulo="Invitar usuario">
        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <Campo label="Correo" htmlFor="inv-correo" error={error}>
              <input
                id="inv-correo"
                type="email"
                autoFocus
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                placeholder="nombre@dataglobal.co"
                className={inputCls}
              />
            </Campo>
            <Campo label="Perfil" htmlFor="inv-perfil">
              <select
                id="inv-perfil"
                value={form.perfil}
                onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as Perfil }))}
                className={inputCls}
              >
                {PERFILES_CLIENTE.map((p) => (
                  <option key={p} value={p}>
                    {PERFIL_LABEL[p]}
                  </option>
                ))}
              </select>
            </Campo>
            {form.perfil !== 'admin' ? (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[14px] font-medium">Workspaces</legend>
                {wsCliente.map((w) => (
                  <label key={w.id} className="flex items-center gap-2.5 text-[14px]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--brand)]"
                      checked={form.ws.includes(w.id)}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ws: e.target.checked ? [...f.ws, w.id] : f.ws.filter((x) => x !== w.id) }))
                      }
                    />
                    {w.nombre}
                  </label>
                ))}
                <p className="text-[13px] text-muted">Solo verá y buscará en los workspaces que marques.</p>
              </fieldset>
            ) : (
              <p className="text-[13px] text-muted">Un Admin ve y administra todo {clienteActivo.nombre}.</p>
            )}

            {/* Lo que recibirá la persona. */}
            <div>
              <p className="mb-2 text-[14px] font-medium">Así llega la invitación</p>
              <div className="rounded-lg border border-line bg-raised p-4 text-[13px] leading-5">
                <p className="text-muted">Para: {form.correo || 'nombre@dataglobal.co'}</p>
                <p className="mt-2 font-semibold">Te invitaron a DataHub de {clienteActivo.nombre}</p>
                <p className="mt-1">
                  {yo.nombre} te invitó como <strong>{PERFIL_LABEL[form.perfil]}</strong>. Activa tu cuenta para definir tu nombre y contraseña.
                </p>
                <p className="mt-3 inline-flex h-8 items-center rounded-md bg-brand px-3 font-medium text-on-brand">Activar mi cuenta</p>
                <p className="mt-3 text-muted">El enlace es de un solo uso y vence el {venceInvitacion} (72 horas).</p>
              </div>
            </div>
          </div>
          <footer className="flex justify-end gap-2 border-t border-rule px-6 py-4">
            <Button type="button" onClick={() => setInvitar(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={<Send size={14} />}>
              Enviar invitación
            </Button>
          </footer>
        </form>
      </Lateral>

      {/* Editar */}
      <Lateral abierto={!!editar} cerrar={() => setEditar(null)} titulo={editar ? editar.nombre : ''}>
        {editar && (
          <form onSubmit={guardarEdicion} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <p className="text-[13px] text-muted">
                {editar.correo} · último acceso {editar.ultimoAcceso ? cuando(editar.ultimoAcceso).toLowerCase() : 'nunca'}
              </p>
              <Campo label="Perfil" htmlFor="ed-perfil" ayuda={bloqueo(usuarios.find((u) => u.id === editar.id)!) ?? undefined}>
                <select
                  id="ed-perfil"
                  value={editar.perfil}
                  disabled={!!bloqueo(usuarios.find((u) => u.id === editar.id)!)}
                  onChange={(e) => setEditar({ ...editar, perfil: e.target.value as Perfil })}
                  className={inputCls}
                >
                  {PERFILES_CLIENTE.map((p) => (
                    <option key={p} value={p}>
                      {PERFIL_LABEL[p]}
                    </option>
                  ))}
                </select>
              </Campo>
              {editar.perfil !== 'admin' && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[14px] font-medium">Workspaces asignados</legend>
                  {wsCliente.map((w) => (
                    <label key={w.id} className="flex items-center gap-2.5 text-[14px]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--brand)]"
                        checked={editar.workspaces.includes(w.id)}
                        onChange={(e) =>
                          setEditar({
                            ...editar,
                            workspaces: e.target.checked ? [...editar.workspaces, w.id] : editar.workspaces.filter((x) => x !== w.id),
                          })
                        }
                      />
                      {w.nombre}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
            <footer className="flex justify-end gap-2 border-t border-rule px-6 py-4">
              <Button type="button" onClick={() => setEditar(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Guardar cambios
              </Button>
            </footer>
          </form>
        )}
      </Lateral>
    </Lienzo>
  );
}
