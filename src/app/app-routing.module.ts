import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SalesListComponent } from './components/sales-list/sales-list.component';
import { EmailComponent } from './components/email/email.component';
import { PurchaseListComponent } from './components/purchase-list/purchase-list.component';
import { ManufacturingListComponent } from './components/manufacturing-list/manufacturing-list.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { SummaryComponent } from './components/summary/summary.component';


const routes: Routes = [
  { path: 'item', component: ItemListComponent }, 
  { path: 'purchase', component: PurchaseListComponent },
  { path: 'inventory', component: InventoryListComponent },
  { path: 'inventory/:item_id', component: InventoryListComponent }, 
  { path: 'dashboard', component: DashboardComponent },
  { path: 'manufacture', component: ManufacturingListComponent },
  { path: 'sales', component: SalesListComponent },
  { path: 'summary', component: SummaryComponent },
  { path: 'email', component: EmailComponent },
  { path: '',
    redirectTo: '/purchase',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
