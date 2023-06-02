import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PolygonMapComponent } from './polygon-map/polygon-map.component';
import { OsmMapComponent } from './osm-map/osm-map.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoordsMarkerComponent } from './coords-markers/coords-marker.component';

@NgModule({
  declarations: [AppComponent, PolygonMapComponent, OsmMapComponent, CoordsMarkerComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
