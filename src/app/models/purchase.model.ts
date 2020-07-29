import { Item } from './item.model';
import { Vendor } from './vendor.model';
import { Quantity } from './quantity.model';

export interface Purchase {
    purchase_id: string;
    invoice_id: string;
    item: Item;
    vendor: Vendor;
    quantity: Quantity;
    rate: string;
    amount: string;
    timestamp: string;
}