export interface Gasto {
  id: string;
  uid: string;
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: Date;
  creadoEn: Date;
}

export interface NuevoGasto {
  monto: number;
  descripcion: string;
  categoria: string;
  fecha?: Date;
}
