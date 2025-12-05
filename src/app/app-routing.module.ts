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
import { ProcessingTypeListComponent } from './components/processing-type-list/processing-type-list.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';


const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'item', component: ItemListComponent, canActivate: [AuthGuard] },
  { path: 'processing-type', component: ProcessingTypeListComponent, canActivate: [AuthGuard] },
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
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
