import { Component } from '@angular/core';
import { MapOptions, tileLayer, latLng } from 'leaflet';
@Component({
  selector: 'app-polygon-map',
  templateUrl: './polygon-map.component.html',
  styleUrls: ['./polygon-map.component.scss'],
})
export class PolygonMapComponent {
  options: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        opacity: 1,
        maxZoom: 20,
        detectRetina: true,
      }),
    ],
    zoom: 6,
    center: latLng(48.5132, 32.2597),
  };

  constructor() {}
}
