import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { AlertModule } from 'ngx-bootstrap/alert';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { AddPurchaseComponent } from './components/add-purchase/add-purchase.component';
import { ModalComponent } from './components/modal/modal.component';
import { AddInventoryItemComponent } from './components/add-inventory-item/add-inventory-item.component';
import { SellItemComponent } from './components/sell-item/sell-item.component';
import { SalesListComponent } from './components/sales-list/sales-list.component';
import { EmailComponent } from './components/email/email.component';
import { GapiSession } from './sessions/gapi.session';
import { PurchaseListComponent } from './components/purchase-list/purchase-list.component';
import { AddManufacturingComponent } from './components/add-manufacturing/add-manufacturing.component';
import { ManufacturingListComponent } from './components/manufacturing-list/manufacturing-list.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { SummaryComponent } from './components/summary/summary.component';
import { DecimalNumberDirective } from './directives/decimal-number.directive';
import { AddPartyComponent } from './components/add-party/add-party.component';
import { PartyListComponent } from './components/party-list/party-list.component';
import { AuthModule } from '@auth0/auth0-angular';
import { LoadingComponent } from './components/loading/loading.component';

const ENVIRONMENT = "environment";

export function initGapi(gapiSession: GapiSession) {
  return () => gapiSession.initClient();
}

@NgModule({ declarations: [
        AppComponent,
        InventoryListComponent,
        PurchaseListComponent,
        DashboardComponent,
        HeaderComponent,
        AddPurchaseComponent,
        ModalComponent,
        AddInventoryItemComponent,
        AddManufacturingComponent,
        ManufacturingListComponent,
        SellItemComponent,
        SalesListComponent,
        EmailComponent,
        AddItemComponent,
        ItemListComponent,
        SummaryComponent,
        DecimalNumberDirective,
        AddPartyComponent,
        PartyListComponent,
        LoadingComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        NgSelectModule,
        ReactiveFormsModule,
        BsDropdownModule.forRoot(),
        AlertModule.forRoot(),
        CollapseModule.forRoot(),
        ModalModule.forRoot(),
        BsDatepickerModule.forRoot(),
        TypeaheadModule.forRoot(),
        TabsModule.forRoot(),
        AuthModule.forRoot({
            domain: 'vinayakashot.us.auth0.com',
            clientId: '50fgJifDAG98Mak73bNJamStUK4gfpA9',
            authorizationParams: {
                redirect_uri: environment.baseUrl + environment.baseUri
            }
        })], providers: [
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
        { provide: APP_BASE_HREF, useValue: environment.baseUri },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
