import { Item } from './item.model';
import { Quantity } from './quantity.model';

export interface Manufacture{
    item: Item;
    quantity: Quantity;
}