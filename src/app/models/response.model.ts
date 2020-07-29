export interface Response<T> {
    alerts: any[];
    items: T[];
    total_amount?: string;
}