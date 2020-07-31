import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface SubItemInventory{
    item: Item,
    quantity: Quantity,
    rate: string,
    amount: string
}