import { Sale } from './sale.model';

export interface SalesResponse {
    alerts: any[];
    sales: Sale[];
}