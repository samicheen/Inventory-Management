export interface InventoryResponse {
    alerts: any[];
    items: Item[];
}

export interface Item {
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