import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PathLocationStrategy, LocationStrategy } from '@angular/common';
import { environment } from '../environments/environment';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/header/header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AlertModule } from 'ngx-bootstrap';
import { AddItemComponent } from './components/add-item/add-item.component';
import { ModalComponent } from './components/modal/modal.component';
import { AddItemModalComponent } from './components/add-item-modal/add-item-modal.component';

const ENVIRONMENT = "environment";

@NgModule({
  declarations: [
    AppComponent,
    ItemListComponent,
    DashboardComponent,
    HeaderComponent,
    AddItemComponent,
    ModalComponent,
    AddItemModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
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
  entryComponents: [AddItemModalComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
