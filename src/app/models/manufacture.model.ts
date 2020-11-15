import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface Manufacture{
    item: Item;
    booked_quantity: Quantity;
    quantity: Quantity;
    timestamp: string;
}