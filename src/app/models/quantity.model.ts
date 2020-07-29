export interface Quantity {
    value: number;
    unit: QuantityUnit;
}

export enum QuantityUnit {
    KG = 'KG',
    NOS = 'NOS'
}

export const QuantityUnitToLabelMapping: Record<QuantityUnit, string> = {
    [QuantityUnit.KG]: "Kg.",
    [QuantityUnit.NOS]: "Nos."
};