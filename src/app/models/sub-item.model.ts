import { Quantity } from './quantity.model';

export interface SubItem {
    id: string;
    item_id: string;
    name: string;
    size: string;
    grade: string;
    quantity: Quantity;
    timestamp: string;
}