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
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
import { GoogleService } from './services/google.service';
import { PurchaseListComponent } from './components/purchase-list/purchase-list.component';
import { AddManufacturingComponent } from './components/add-manufacturing/add-manufacturing.component';
import { ManufacturingListComponent } from './components/manufacturing-list/manufacturing-list.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { SummaryComponent } from './components/summary/summary.component';
import { DecimalNumberDirective } from './directives/decimal-number.directive';
import { AddPartyComponent } from './components/add-party/add-party.component';
import { PartyListComponent } from './components/party-list/party-list.component';
import { LoadingComponent } from './components/loading/loading.component';
import { LoginComponent } from './components/login/login.component';
import { PrintLabelsComponent } from './components/print-labels/print-labels.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { ChoiceDialogComponent } from './components/choice-dialog/choice-dialog.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ReceivePurchaseComponent } from './components/receive-purchase/receive-purchase.component';
import { ProcessingTypeListComponent } from './components/processing-type-list/processing-type-list.component';
import { AddProcessingTypeComponent } from './components/add-processing-type/add-processing-type.component';
import { ProcessFurtherPackagesComponent } from './components/process-further-packages/process-further-packages.component';
import { ScanSalesPackagesComponent } from './components/scan-sales-packages/scan-sales-packages.component';
import { DataGridComponent } from './components/data-grid/data-grid.component';
import { ReportsListComponent } from './components/report/reports-list/reports-list.component';
import { CustomerSalesReportComponent } from './components/report/customer-sales-report/customer-sales-report.component';
import { VendorPurchaseReportComponent } from './components/report/vendor-purchase-report/vendor-purchase-report.component';
import { ItemSalesReportComponent } from './components/report/item-sales-report/item-sales-report.component';
import { ItemPurchaseReportComponent } from './components/report/item-purchase-report/item-purchase-report.component';
import { ProfitAnalysisReportComponent } from './components/report/profit-analysis-report/profit-analysis-report.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

const ENVIRONMENT = "environment";

// GAPI initialization removed - Email functionality will work only if GAPI is manually initialized
// This prevents blocking app startup on mobile

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
        LoadingComponent,
        LoginComponent,
        PrintLabelsComponent,
        UserListComponent,
        AddUserComponent,
        ChoiceDialogComponent,
        ConfirmDialogComponent,
        ReceivePurchaseComponent,
        ProcessingTypeListComponent,
        AddProcessingTypeComponent,
        ProcessFurtherPackagesComponent,
        ScanSalesPackagesComponent,
        DataGridComponent,
        ReportsListComponent,
        CustomerSalesReportComponent,
        VendorPurchaseReportComponent,
        ItemSalesReportComponent,
        ItemPurchaseReportComponent,
        ProfitAnalysisReportComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        FormsModule,
        NgSelectModule,
        ReactiveFormsModule,
        BsDropdownModule.forRoot(),
        AlertModule.forRoot(),
        CollapseModule.forRoot(),
        ModalModule.forRoot(),
        BsDatepickerModule.forRoot(),
        TypeaheadModule.forRoot(),
        TabsModule.forRoot()], providers: [
        HttpClient,
        GapiSession,
        GoogleService,
        {
            provide: ENVIRONMENT,
            useValue: environment
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy
        },
        { provide: APP_BASE_HREF, useValue: environment.baseUri },
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ] })
export class AppModule { }
