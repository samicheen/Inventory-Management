import { QuantityUnit } from './item.model';

export interface SubItem {
    id: string;
    item_id: string;
    name: string;
    size: string;
    grade: string;
    quantity: {
        value: number;
        unit: QuantityUnit;
    };
    timestamp: string;
}