import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PackageListComponent } from './components/package-list/package-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


const routes: Routes = [
  { path: 'inventory', component: PackageListComponent },
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
