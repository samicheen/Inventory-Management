export interface Response<T> {
    alerts: any[];
    items: T[];
    total_amount?: string;
    total?: {
        opening_amount: string;
        closing_amount: string;
    }
}