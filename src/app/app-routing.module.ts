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
import { PartyListComponent } from './components/party-list/party-list.component';
import { AuthGuard } from '@auth0/auth0-angular';


const routes: Routes = [
  { path: 'item', component: ItemListComponent, canActivate: [AuthGuard] },
  { path: 'vendor', component: PartyListComponent, canActivate: [AuthGuard] },
  { path: 'customer', component: PartyListComponent, canActivate: [AuthGuard] },
  { path: 'purchase', component: PurchaseListComponent, canActivate: [AuthGuard] },
  { path: 'inventory', component: InventoryListComponent, canActivate: [AuthGuard] },
  { path: 'inventory/:item_id', component: InventoryListComponent, canActivate: [AuthGuard] }, 
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'manufacture', component: ManufacturingListComponent, canActivate: [AuthGuard] },
  { path: 'sales', component: SalesListComponent, canActivate: [AuthGuard] },
  { path: 'summary', component: SummaryComponent, canActivate: [AuthGuard] },
  { path: 'email', component: EmailComponent, canActivate: [AuthGuard] },
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
