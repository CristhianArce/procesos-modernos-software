"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import { FranjaIndicadores } from "@/modulos/estado/ui/FranjaIndicadores";
import { PanelAlarmas } from "@/modulos/estado/ui/PanelAlarmas";
import { aplicarPendientes, cambiosPorGuardar, editar, EDITOR_INICIAL, type AccionEditor, type EstadoEditor } from "@/modulos/topologia/editor";
import { armarMimico, type DatosMimico, type Punto } from "@/modulos/topologia/mimico";
import type { Enlace, Topologia } from "@/modulos/topologia/service";
import type { TipoNodo } from "@/modulos/topologia/tipos";
import { BarraEditor, type Mensaje } from "@/modulos/topologia/ui/BarraEditor";
import { LeyendaMimico } from "@/modulos/topologia/ui/LeyendaMimico";
import { Mimico, type Edicion } from "@/modulos/topologia/ui/Mimico";
import { PanelNodo } from "@/modulos/topologia/ui/PanelNodo";
import { pedir } from "@/modulos/topologia/ui/peticiones";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

/** Datos del mímico con la última instantánea; los nodos con una alerta recién llegada parpadean. */
function useMimicoVivo(topologia: Topologia): DatosMimico {
  const { instantanea, nuevas } = useEstadoVivo();
  return useMemo(() => {
    const conAlertaNueva = new Set(nuevas.map((a) => a.nodoId));
    const datos = armarMimico(topologia, instantanea.nodos);
    return { ...datos, nodos: datos.nodos.map((n) => (conAlertaNueva.has(n.id) ? { ...n, parpadeo: true } : n)) };
  }, [topologia, instantanea.nodos, nuevas]);
}

const reductor = (e: EstadoEditor, { accion, topologia }: { accion: AccionEditor; topologia: Topologia }) => editar(e, accion, topologia);

type Props = { topologia: Topologia; puedeEditar: boolean };

/** Dashboard en vivo: indicadores, mímico (con editor para el administrador), panel lateral del nodo y alarmas. */
export function TableroVivo({ topologia: inicial, puedeEditar }: Props) {
  const { instantanea } = useEstadoVivo();
  const [topologia, setTopologia] = useState(inicial);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [editor, despacharAccion] = useReducer(reductor, EDITOR_INICIAL);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const despachar = useCallback((accion: AccionEditor) => despacharAccion({ accion, topologia }), [topologia]);
  const datos = useMimicoVivo(useMemo(() => aplicarPendientes(topologia, editor), [topologia, editor]));
  const nodoAbierto = abierto ? datos.nodos.find((n) => n.id === abierto) : undefined;
  const pendientes = cambiosPorGuardar(topologia, editor).length;

  const recargar = useCallback(async () => {
    const r = await pedir<Topologia>("/api/topologia");
    if (r.ok) setTopologia(r.datos);
  }, []);

  // Si la red cambió (un nodo creado o borrado en otra pantalla), se vuelve a leer la topología.
  const distinta = instantanea.nodos.length !== topologia.nodos.length || instantanea.nodos.some((n) => !topologia.nodos.some((t) => t.id === n.id));
  useEffect(() => {
    if (!distinta) return;
    let vigente = true;
    void pedir<Topologia>("/api/topologia").then((r) => vigente && r.ok && setTopologia(r.datos));
    return () => {
      vigente = false;
    };
  }, [distinta]);

  const cerrar = useCallback(() => {
    const id = abierto;
    setAbierto(null);
    // Devuelve el foco al nodo del mímico que abrió el panel (sigue montado: se puede enfocar ya).
    if (id) document.querySelector<SVGGElement>(`[data-nodo-id="${id}"]`)?.focus();
  }, [abierto]);

  async function ejecutar(tarea: () => Promise<Mensaje>) {
    setOcupado(true);
    setMensaje(await tarea());
    setOcupado(false);
  }

  const crearEnlace = (origenId: string, destinoId: string) =>
    ejecutar(async () => {
      const r = await pedir<Enlace>("/api/topologia/enlaces", "POST", { origenId, destinoId });
      despachar({ tipo: "enlaceAtendido" });
      if (!r.ok) return { tipo: "error", texto: r.error };
      await recargar();
      const nombre = (id: string) => topologia.nodos.find((n) => n.id === id)?.nombre;
      return { tipo: "ok", texto: `Enlace creado: ${nombre(origenId)} → ${nombre(destinoId)}.` };
    });

  const edicion: Edicion | undefined = editando
    ? {
        origen: editor.origen,
        enlaceSeleccionado: editor.enlaceSeleccionado,
        onMoverNodo: (id: string, p: Punto) => despachar({ tipo: "mover", id, ...p }),
        onDesplazarNodo: (id: string, dx: number, dy: number, desde: Punto) => despachar({ tipo: "desplazar", id, dx, dy, desde }),
        onElegirEnlace: (id: string) => despachar({ tipo: "elegirEnlace", id }),
        onElegirNodo: (id: string) => {
          const accion: AccionEditor = { tipo: "elegirNodo", id };
          const siguiente = editar(editor, accion, topologia);
          despachar(accion);
          setMensaje(null);
          if (siguiente.enlacePropuesto) void crearEnlace(siguiente.enlacePropuesto.origenId, siguiente.enlacePropuesto.destinoId);
        },
      }
    : undefined;

  const elegido = editor.origen ? datos.nodos.find((n) => n.id === editor.origen) : undefined;
  const enlaceElegido = editor.enlaceSeleccionado ? datos.enlaces.find((e) => e.id === editor.enlaceSeleccionado) : undefined;

  const guardar = () =>
    ejecutar(async () => {
      const cambios = cambiosPorGuardar(topologia, editor);
      const resultados = await Promise.all(cambios.map((c) => pedir(`/api/topologia/nodos/${c.id}`, "PUT", c.posicion)));
      const fallos = resultados.filter((r) => !r.ok).length;
      await recargar();
      if (fallos) return { tipo: "error", texto: `No se pudieron guardar ${fallos} de ${cambios.length} posiciones.` };
      despachar({ tipo: "descartar" });
      return { tipo: "ok", texto: `Posiciones guardadas (${cambios.length}).` };
    });

  const borrarEnlace = () =>
    ejecutar(async () => {
      const e = enlaceElegido!;
      const r = await pedir(`/api/topologia/enlaces/${e.id}`, "DELETE");
      despachar({ tipo: "elegirEnlace", id: e.id }); // lo deselecciona
      if (!r.ok) return { tipo: "error", texto: r.error };
      await recargar();
      return { tipo: "ok", texto: `Enlace borrado: ${e.etiqueta}.` };
    });

  function salir() {
    if (pendientes > 0 && !window.confirm("Hay posiciones sin guardar. ¿Descartarlas y salir del modo edición?")) return;
    despachar({ tipo: "descartar" });
    setMensaje(null);
    setEditando(false);
  }

  return (
    <>
      <FranjaIndicadores indicadores={instantanea.indicadores} />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_30rem]">
        <Tarjeta titulo="Mímico de la red">
          {puedeEditar && (
            <div className="mb-3">
              <BarraEditor
                editando={editando}
                pendientes={pendientes}
                nodoElegido={elegido ? { nombre: elegido.nombre, tipo: elegido.tipo } : null}
                enlaceElegido={enlaceElegido?.etiqueta ?? null}
                ocupado={ocupado}
                mensaje={mensaje}
                onEditar={() => {
                  setAbierto(null);
                  setEditando(true);
                }}
                onGuardar={guardar}
                onDescartar={() => despachar({ tipo: "descartar" })}
                onSalir={salir}
                onBorrarEnlace={borrarEnlace}
                onCambiarTipo={(tipo: TipoNodo) => elegido && despachar({ tipo: "cambiarTipo", id: elegido.id, tipoNodo: tipo, posicionActual: elegido })}
              />
            </div>
          )}
          {datos.nodos.length === 0 ? (
            <EstadoVacio
              titulo="Aún no hay nodos en la red"
              accion={
                <Link href="/nodos" className="enlace text-sm font-medium">
                  Ir a Nodos
                </Link>
              }
            >
              Cuando existan nodos, el mímico los dibuja aquí. Un administrador puede crearlos en Nodos y ubicarlos con el editor.
            </EstadoVacio>
          ) : (
            <div className="relative h-[clamp(22rem,50vw,640px)]">
              <Mimico datos={datos} onAbrir={setAbierto} seleccionado={abierto} edicion={edicion} />
              {nodoAbierto && !editando && <PanelNodo nodo={nodoAbierto} generadaEn={instantanea.generadaEn} onCerrar={cerrar} />}
            </div>
          )}
          <div className="mt-3">
            <LeyendaMimico />
          </div>
        </Tarjeta>
        <div id="alarmas" className="scroll-mt-4">
          <Tarjeta titulo="Alarmas" className="flex max-h-[32rem] flex-col 2xl:max-h-[calc(clamp(22rem,50vw,640px)+6rem)] [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col [&>div]:p-0">
            <PanelAlarmas />
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
