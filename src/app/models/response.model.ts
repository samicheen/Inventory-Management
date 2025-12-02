export interface Response<T> {
    alerts: any[];
    items: T[];
    total_amount?: string;
    total?: {
        opening_amount?: string;
        closing_amount?: string;
        main_items?: {
            opening_amount: string;
            closing_amount: string;
        };
        sub_items?: {
            opening_amount: string;
            closing_amount: string;
        };
    }
}