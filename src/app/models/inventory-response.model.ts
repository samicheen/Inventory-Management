import { Item } from './item.model';

export interface InventoryResponse {
    alerts: any[];
    items: Item[];
}