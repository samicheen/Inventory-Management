export interface Item {
    barcode: string;
    item_name: string;
    size: string;
    quantity: {
        value: string;
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