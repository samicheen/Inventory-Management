import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface Inventory {
    inventory_id: string;
    item: Item;
    quantity: Quantity;
    amount: string;
    timestamp: string;
}