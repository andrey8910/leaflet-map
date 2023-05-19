import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PolygonMapComponent } from './polygon-map/polygon-map.component';

@NgModule({
  declarations: [AppComponent, PolygonMapComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, LeafletModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
