import { QuantityUnit } from './item.model';

export interface SellItem {
    item_id: string;
    party_name: string;
    quantity: {
        value: number;
        unit: QuantityUnit;
    };
    selling_price: string;
    amount: string;
    timestamp: string;
}