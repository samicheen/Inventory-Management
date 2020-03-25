import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PathLocationStrategy, LocationStrategy } from '@angular/common';
import { environment } from '../environments/environment';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PackageListComponent } from './components/package-list/package-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/header/header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AlertModule } from 'ngx-bootstrap';
import { AddPackageComponent } from './components/add-package/add-package.component';
import { ModalComponent } from './components/modal/modal.component';
import { AddPackageModalComponent } from './components/add-package-modal/add-package-modal.component';

const ENVIRONMENT = "environment";

@NgModule({
  declarations: [
    AppComponent,
    PackageListComponent,
    DashboardComponent,
    HeaderComponent,
    AddPackageComponent,
    ModalComponent,
    AddPackageModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    CollapseModule.forRoot(),
    ModalModule.forRoot()
  ],
  providers: [
    HttpClient,
    {
      provide: ENVIRONMENT,
      useValue: environment
    },
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy
    }
  ],
  entryComponents: [AddPackageModalComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
