import { toISODate, toLocalTimestamp } from '../../utils/format'
import type { Categoria, LineaPedido, Mesa, Pedido, Plato, Reserva } from '../types'

const CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Entrantes', orden: 1 },
  { id: 2, nombre: 'Principales', orden: 2 },
  { id: 3, nombre: 'Postres', orden: 3 },
  { id: 4, nombre: 'Bebidas', orden: 4 },
]

const PLATOS: Plato[] = [
  { id: 1, categoria_id: 1, nombre: 'Croquetas de jamón', descripcion: '6 unidades, cremosas', precio: '8.50', alergenos: 'gluten,lácteos', disponible: true },
  { id: 2, categoria_id: 1, nombre: 'Patatas bravas', descripcion: 'Con alioli y salsa brava', precio: '6.00', alergenos: 'huevo', disponible: true },
  { id: 3, categoria_id: 1, nombre: 'Ensalada de burrata', descripcion: 'Tomate, rúcula y pesto', precio: '11.50', alergenos: 'lácteos,frutos secos', disponible: true },
  { id: 4, categoria_id: 1, nombre: 'Pimientos de Padrón', descripcion: null, precio: '5.50', alergenos: null, disponible: true },
  { id: 5, categoria_id: 1, nombre: 'Gazpacho', descripcion: 'Solo en temporada', precio: '5.00', alergenos: null, disponible: false },
  { id: 6, categoria_id: 2, nombre: 'Paella de marisco', descripcion: 'Mínimo 2 personas (precio por persona)', precio: '18.00', alergenos: 'crustáceos,moluscos', disponible: true },
  { id: 7, categoria_id: 2, nombre: 'Entrecot a la brasa', descripcion: '300 g con patatas', precio: '22.00', alergenos: null, disponible: true },
  { id: 8, categoria_id: 2, nombre: 'Lubina al horno', descripcion: 'Con verduras de temporada', precio: '19.50', alergenos: 'pescado', disponible: true },
  { id: 9, categoria_id: 2, nombre: 'Risotto de setas', descripcion: 'Vegetariano', precio: '15.00', alergenos: 'lácteos', disponible: true },
  { id: 10, categoria_id: 2, nombre: 'Hamburguesa de la casa', descripcion: 'Ternera, queso y cebolla caramelizada', precio: '14.00', alergenos: 'gluten,lácteos,sésamo', disponible: false },
  { id: 11, categoria_id: 3, nombre: 'Tarta de queso', descripcion: 'Al horno, cremosa', precio: '6.50', alergenos: 'gluten,lácteos,huevo', disponible: true },
  { id: 12, categoria_id: 3, nombre: 'Crema catalana', descripcion: null, precio: '5.50', alergenos: 'lácteos,huevo', disponible: true },
  { id: 13, categoria_id: 3, nombre: 'Coulant de chocolate', descripcion: 'Con helado de vainilla', precio: '7.00', alergenos: 'gluten,lácteos,huevo', disponible: true },
  { id: 14, categoria_id: 4, nombre: 'Agua mineral', descripcion: '50 cl', precio: '2.00', alergenos: null, disponible: true },
  { id: 15, categoria_id: 4, nombre: 'Vino tinto de la casa', descripcion: 'Copa', precio: '3.50', alergenos: 'sulfitos', disponible: true },
  { id: 16, categoria_id: 4, nombre: 'Café', descripcion: null, precio: '1.80', alergenos: null, disponible: true },
]

const MESAS: Mesa[] = [
  { id: 1, numero: 1, capacidad: 2, ubicacion: 'interior', estado: 'libre' },
  { id: 2, numero: 2, capacidad: 2, ubicacion: 'interior', estado: 'ocupada' },
  { id: 3, numero: 3, capacidad: 4, ubicacion: 'interior', estado: 'reservada' },
  { id: 4, numero: 4, capacidad: 4, ubicacion: 'interior', estado: 'libre' },
  { id: 5, numero: 5, capacidad: 6, ubicacion: 'interior', estado: 'libre' },
  { id: 6, numero: 6, capacidad: 4, ubicacion: 'terraza', estado: 'ocupada' },
  { id: 7, numero: 7, capacidad: 4, ubicacion: 'terraza', estado: 'libre' },
  { id: 8, numero: 8, capacidad: 8, ubicacion: 'terraza', estado: 'fuera_servicio' },
  { id: 9, numero: 9, capacidad: 2, ubicacion: 'barra', estado: 'libre' },
  { id: 10, numero: 10, capacidad: 2, ubicacion: 'barra', estado: 'ocupada' },
]

function reservasIniciales(): Reserva[] {
  const hoy = toISODate(new Date())
  const manana = toISODate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const r = (
    id: number,
    usuario_id: number,
    mesa_id: number,
    fecha: string,
    horaTexto: string,
    num_personas: number,
    estado: Reserva['estado'] = 'confirmada',
    notas: string | null = null,
  ): Reserva => ({
    id,
    usuario_id,
    mesa_id,
    fecha_hora: `${fecha}T${horaTexto}:00`,
    duracion_min: 90,
    num_personas,
    estado,
    notas,
    creado_en: `${hoy}T09:00:00`,
  })
  return [
    r(1, 4, 3, hoy, '21:00', 4, 'confirmada', 'Cumpleaños, traen tarta'),
    r(2, 2, 4, hoy, '13:30', 3),
    r(3, 2, 7, hoy, '14:00', 2, 'completada'),
    r(4, 2, 5, hoy, '20:30', 6, 'cancelada'),
    r(5, 4, 7, manana, '20:30', 2),
    r(6, 2, 1, manana, '14:00', 2, 'confirmada', 'Mesa tranquila si es posible'),
  ]
}

function pedidosIniciales(): Pedido[] {
  const haceMin = (min: number) => toLocalTimestamp(new Date(Date.now() - min * 60_000))
  let lineaId = 1
  const linea = (plato_id: number, cantidad: number, notas: string | null = null): LineaPedido => {
    const plato = PLATOS.find((p) => p.id === plato_id)!
    return { id: lineaId++, plato_id, cantidad, precio_unitario: plato.precio, notas, plato: { nombre: plato.nombre } }
  }
  const p = (id: number, mesa_id: number, estado: Pedido['estado'], min: number, lineas: LineaPedido[]): Pedido => ({
    id,
    mesa_id,
    camarero_id: 2,
    estado,
    total: lineas.reduce((t, l) => t + l.cantidad * Number(l.precio_unitario), 0).toFixed(2),
    creado_en: haceMin(min),
    actualizado_en: null,
    lineas,
    mesa: { numero: MESAS.find((m) => m.id === mesa_id)!.numero },
  })
  return [
    p(1, 2, 'en_cocina', 12, [linea(7, 1, 'Al punto'), linea(2, 1), linea(15, 2)]),
    p(2, 6, 'pendiente', 3, [linea(6, 2), linea(3, 1, 'Sin frutos secos'), linea(14, 2)]),
    p(3, 10, 'servido', 40, [linea(1, 1), linea(16, 2)]),
  ]
}

interface MockDb {
  categorias: Categoria[]
  platos: Plato[]
  mesas: Mesa[]
  reservas: Reserva[]
  pedidos: Pedido[]
  nextReservaId: number
  nextPedidoId: number
  nextLineaId: number
}

function crearDb(): MockDb {
  const reservas = reservasIniciales()
  const pedidos = pedidosIniciales()
  return {
    categorias: structuredClone(CATEGORIAS),
    platos: structuredClone(PLATOS),
    mesas: structuredClone(MESAS),
    reservas,
    pedidos,
    nextReservaId: reservas.length + 1,
    nextPedidoId: pedidos.length + 1,
    nextLineaId: pedidos.flatMap((p) => p.lineas).length + 1,
  }
}

export let db: MockDb = crearDb()

export function resetMockDb(): void {
  db = crearDb()
}