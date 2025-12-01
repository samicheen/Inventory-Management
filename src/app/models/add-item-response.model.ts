export interface AddItemResponse {
    alerts: any[];
    item_number?: string;
    purchase_id?: string;
    barcode?: string; // Barcode for purchase/inventory items
}