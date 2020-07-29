import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SalesListComponent } from './components/sales-list/sales-list.component';
import { EmailComponent } from './components/email/email.component';
import { PurchaseListComponent } from './components/purchase-list/purchase-list.component';


const routes: Routes = [
  { path: 'purchase', component: PurchaseListComponent },
  { path: 'inventory', component: InventoryListComponent },
  { path: 'inventory/:item_id', component: InventoryListComponent }, 
  { path: 'dashboard', component: DashboardComponent },
  { path: 'sales', component: SalesListComponent },
  { path: 'email', component: EmailComponent },
  { path: '',
    redirectTo: '/inventory',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
