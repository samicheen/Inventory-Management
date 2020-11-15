import { QuantityUnit } from './quantity.model';

export interface SummaryItem {
    item_name: string;
    purchase_qty: number;
    opening_stock: number;
    closing_stock: number;
    man_qty: number;
    sub_item_qty: number;
    sales_qty: number;
    sub_sales_qty: number;
    unit: QuantityUnit;
}