import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface Manufacture{
    manufacture_id?: string;
    item: Item;
    booked_quantity: Quantity;
    quantity: Quantity;
    source_barcode?: string;
    is_spool?: boolean;
    timestamp: string;
}