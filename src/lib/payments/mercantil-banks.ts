/**
 * Venezuelan banks with SUDEBAN codes.
 * Used for C2P (Pago Móvil) and Débito Inmediato transactions.
 */

export interface VenezuelanBank {
  code: string;
  name: string;
  shortName: string;
}

export const VENEZUELAN_BANKS: VenezuelanBank[] = [
  { code: "0102", name: "Banco de Venezuela", shortName: "Venezuela" },
  { code: "0104", name: "Venezolano de Crédito", shortName: "Venezolano" },
  { code: "0105", name: "Banco Mercantil", shortName: "Mercantil" },
  { code: "0108", name: "Banco Provincial", shortName: "Provincial" },
  { code: "0114", name: "Bancaribe", shortName: "Bancaribe" },
  { code: "0115", name: "Banco Exterior", shortName: "Exterior" },
  { code: "0128", name: "Banco Caroní", shortName: "Caroní" },
  { code: "0134", name: "Banesco", shortName: "Banesco" },
  { code: "0137", name: "Banco Sofitasa", shortName: "Sofitasa" },
  { code: "0138", name: "Banco Plaza", shortName: "Plaza" },
  { code: "0146", name: "Bangente", shortName: "Bangente" },
  { code: "0151", name: "BFC Banco Fondo Común", shortName: "BFC" },
  { code: "0156", name: "100% Banco", shortName: "100% Banco" },
  { code: "0157", name: "Del Sur", shortName: "Del Sur" },
  { code: "0163", name: "Banco del Tesoro", shortName: "Tesoro" },
  { code: "0166", name: "Banco Agrícola de Venezuela", shortName: "Agrícola" },
  { code: "0168", name: "Bancrecer", shortName: "Bancrecer" },
  { code: "0169", name: "Mi Banco", shortName: "Mi Banco" },
  { code: "0171", name: "Banco Activo", shortName: "Activo" },
  { code: "0172", name: "Bancamiga", shortName: "Bancamiga" },
  { code: "0174", name: "Banplus", shortName: "Banplus" },
  { code: "0177", name: "Banco de la Fuerza Armada Nacional Bolivariana", shortName: "BANFANB" },
];

export function getBankByCode(code: string): VenezuelanBank | undefined {
  return VENEZUELAN_BANKS.find((b) => b.code === code);
}
