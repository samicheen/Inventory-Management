import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PackageInventoryComponent } from './components/package-inventory/package-inventory.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const ENVIRONMENT = "environment";

@NgModule({
  declarations: [
    AppComponent,
    PackageInventoryComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    HttpClient,
    {
      provide: ENVIRONMENT,
      useValue: environment
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
