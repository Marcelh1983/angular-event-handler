import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxEventHandlerModule } from 'modules';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    NgxEventHandlerModule,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
