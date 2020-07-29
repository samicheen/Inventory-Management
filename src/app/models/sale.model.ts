import { Quantity } from './quantity.model';

export interface Sale {
    id: string;
    item_name: string;
    grade: string;
    size: string;
    party_name: string;
    quantity: Quantity;
    selling_price: string;
    amount: string;
    timestamp: string;
}