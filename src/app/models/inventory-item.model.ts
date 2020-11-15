import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface InventoryItem {
    inventory_id?: string;
    item: Item;
    opening_stock?: Quantity;
    closing_stock: Quantity;
    opening_amount?: string;
    closing_amount: string;
    timestamp: string;
}