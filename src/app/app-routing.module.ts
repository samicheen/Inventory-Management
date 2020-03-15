import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PackageInventoryComponent } from './components/package-inventory/package-inventory.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


const routes: Routes = [
  { path: 'inventory', component: PackageInventoryComponent },
  { path: 'dashboard', component: DashboardComponent },
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
