export interface InventoryResponse {
    alerts: any[];
    inventory: Inventory[];
}

export interface Inventory {
    barcode: string;
    item_name: string;
    size: string;
    quantity: string;
    timestamp: string;
}