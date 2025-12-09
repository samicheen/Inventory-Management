import { Quantity } from './quantity.model';
import { Item } from './item.model';
import { Customer } from './customer.model';

export interface Sale {
    sale_id: string;
    invoice_id: string;
    item: Item;
    customer: Customer;
    quantity: Quantity;
    selling_price: string;
    amount: string;
    timestamp: string;
}