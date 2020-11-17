import { Quantity } from './quantity.model';

export interface SellItem {
    item_id: string;
    invoice_id: string;
    party_name: string;
    quantity: Quantity;
    selling_price: string;
    amount: string;
    timestamp: string;
}