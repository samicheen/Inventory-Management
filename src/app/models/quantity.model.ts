export interface Quantity {
    value: number;
    unit: QuantityUnit;
}

export enum QuantityUnit {
    KG = 'KG',
    NOS = 'NOS',
    LITRES = 'LITRES'
}

export const QuantityUnitToLabelMapping: Record<QuantityUnit, string> = {
    [QuantityUnit.KG]: "Kg.",
    [QuantityUnit.NOS]: "Nos.",
    [QuantityUnit.LITRES]: "Litres"
};