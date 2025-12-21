export interface Item {
    main_item_id?: string; // Main item ID (traversed up hierarchy) for rate calculation
    item_id: string;
    name?: string;
    size?: string;
    grade?: string;
    is_sub_item?: boolean;
}