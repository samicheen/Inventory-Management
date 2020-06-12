export interface Item {
    item_number: string;
    barcode: string;
    item_name: string;
    size: string;
    quantity: {
        value: number;
        unit: QuantityUnit;
    };
    timestamp: string;
    invoice_number: string;
    vendor: string;
    grade: string;
    rate: string;
    amount: string;
}

export enum QuantityUnit {
    KG = 'KG',
    NOS = 'NOS'
}

export const QuantityUnitToLabelMapping: Record<QuantityUnit, string> = {
    [QuantityUnit.KG]: "Kg.",
    [QuantityUnit.NOS]: "Nos."
};