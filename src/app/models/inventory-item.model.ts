import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface InventoryItem {
    inventory_id?: string;
    barcode?: string;
    source_barcode?: string;
    item: Item;
    initial_stock?: Quantity;
    opening_stock?: Quantity;
    closing_stock: Quantity;
    loss_quantity?: Quantity;
    rate?: string;
    opening_amount?: string;
    closing_amount: string;
    timestamp: string;
}