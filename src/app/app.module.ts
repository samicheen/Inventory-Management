import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PathLocationStrategy, LocationStrategy, APP_BASE_HREF } from '@angular/common';
import { environment } from '../environments/environment';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/header/header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AlertModule } from 'ngx-bootstrap';
import { AddPurchaseComponent } from './components/add-purchase/add-purchase.component';
import { ModalComponent } from './components/modal/modal.component';
import { AddSubItemComponent } from './components/add-sub-item/add-sub-item.component';
import { SellItemComponent } from './components/sell-item/sell-item.component';
import { SalesListComponent } from './components/sales-list/sales-list.component';
import { EmailComponent } from './components/email/email.component';
import { GapiSession } from './sessions/gapi.session';
import { PurchaseListComponent } from './components/purchase-list/purchase-list.component';
import { AddManufacturingComponent } from './components/add-manufacturing/add-manufacturing.component';
import { ManufacturingListComponent } from './components/manufacturing-list/manufacturing-list.component';

const ENVIRONMENT = "environment";

export function initGapi(gapiSession: GapiSession) {
  return () => gapiSession.initClient();
}

@NgModule({
  declarations: [
    AppComponent,
    InventoryListComponent,
    PurchaseListComponent,
    DashboardComponent,
    HeaderComponent,
    AddPurchaseComponent,
    ModalComponent,
    AddSubItemComponent,
    AddManufacturingComponent,
    ManufacturingListComponent,
    SellItemComponent,
    SalesListComponent,
    EmailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    CollapseModule.forRoot(),
    ModalModule.forRoot()
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: initGapi, deps: [GapiSession], multi: true },
    HttpClient,
    GapiSession,
    {
      provide: ENVIRONMENT,
      useValue: environment
    },
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy
    },
    {provide: APP_BASE_HREF, useValue: '/inventory-management'}
  ],
  entryComponents: [AddPurchaseComponent,
                    AddSubItemComponent,
                    SellItemComponent,
                    AddManufacturingComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
