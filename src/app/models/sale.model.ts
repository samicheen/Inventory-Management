import { QuantityUnit } from './item.model';

export interface Sale {
    id: string;
    item_name: string;
    grade: string;
    size: string;
    party_name: string;
    quantity: {
        value: number;
        unit: QuantityUnit;
    };
    selling_price: string;
    amount: string;
    timestamp: string;
}