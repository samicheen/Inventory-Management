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
    invoice_number: string;
    vendor: string;
    grade: string;
    rate: string;
    amount: string
}