import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, LatLngTuple, LeafletEvent } from 'leaflet';
import 'leaflet-draw';
import { LocalStorageItems } from '../interfaces/local-storage-items';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-polygon-map',
  templateUrl: './polygon-map.component.html',
  styleUrls: ['./polygon-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonMapComponent implements OnInit {
  @Input('center') centerCoords: LatLngTuple = [0, 0];
  @Input('zoom') mapZoom = 1;
  @ViewChild('map', { static: true }) mapEl: ElementRef | undefined;
  @ViewChild('coords', { static: true }) coordsEl: ElementRef | undefined;
  myMap!: DrawMap;
  drawnItems = new L.FeatureGroup();

  markersColorList: MarkerColor[] = [
    { colorName: 'red', colorValue: '#f70202' },
    { colorName: 'green', colorValue: '#019421' },
    { colorName: 'blue', colorValue: '#012394' },
    { colorName: 'yellow', colorValue: '#f5ec42' },
  ];

  drawPolygonColor = 'rgba(250, 0, 0, 0.8)';
  drawPolygonWeight = 4;

  constructor(private ref: ChangeDetectorRef, private LSService: LocalStorageService) {}

  ngOnInit(): void {
    this.myMap = this.createMap();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.Icon.Default.imagePath = 'assets/';

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: {
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
        polygon: {
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
        marker: {
          icon: L.icon({
            iconSize: [25, 41],
            iconAnchor: [13, 41],
            iconUrl: 'assets/marker-icon.png',
            shadowUrl: 'assets/marker-shadow.png',
          }),
        },
        rectangle: <any>{
          showArea: false,
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
      },
      edit: {
        featureGroup: this.drawnItems,
      },
    });

    this.myMap.addControl(drawControl);
    this.drawnItems.addTo(this.myMap);

    L.control.scale().addTo(this.myMap);

    if (this.LSService.getItem(LocalStorageItems.DrawItems)) {
      const drawItems = this.LSService.getItem(LocalStorageItems.DrawItems);
      if (drawItems === null) {
        return;
      }
      const drawItemJson = JSON.parse(drawItems);
      drawItemJson.features.map((feature: any) => {
        const featureType = feature.properties.type;
        L.geoJSON(feature, {
          style: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
            opacity: 0.65,
          },
          pointToLayer: function (geoJsonPoint, latlng) {
            return featureType === 'circlemarker'
              ? new L.CircleMarker(latlng, { radius: 10 })
              : featureType === 'circle'
              ? new L.Circle(latlng, { radius: feature.properties.radius })
              : L.marker(latlng, {
                  icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/marker-icon.png',
                    shadowUrl: 'assets/marker-shadow.png',
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = featureType;
          if (featureType === 'circlemarker' || featureType === 'circle') {
            layer.feature.properties['radius'] = feature.properties.radius;
          }
          this.drawnItems.addLayer(layer);
        });
      });
    }
  }

  saveDrawChanges(): void {
    this.LSService.setItem(LocalStorageItems.DrawItems, this.drawnItems.toGeoJSON());
  }

  private createMap(): DrawMap {
    return L.map(this.mapEl?.nativeElement)
      .setView(this.centerCoords, this.mapZoom)
      .on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
        const createdEvent = e as L.DrawEvents.Created;
        const type = createdEvent.layerType;
        L.geoJson(createdEvent.layer.toGeoJSON(), {
          style: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
            opacity: 0.65,
          },

          pointToLayer: function (geoJsonPoint, latlng) {
            return type === 'circlemarker'
              ? new L.CircleMarker(latlng, { radius: 10 })
              : type === 'circle'
              ? new L.Circle(latlng, { radius: e.layer.getRadius() })
              : L.marker(latlng, {
                  icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/marker-icon.png',
                    shadowUrl: 'assets/marker-shadow.png',
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = type;
          if (type === 'circlemarker' || type === 'circle') {
            layer.feature.properties['radius'] = e.layer.getRadius();
          }
          this.drawnItems.addLayer(layer);
          this.saveDrawChanges();
        });

        this.ref.markForCheck();
      })
      .on(L.Draw.Event.EDITSTOP, () => {
        this.saveDrawChanges();
      })
      .on(L.Draw.Event.DELETESTOP, () => {
        this.saveDrawChanges();
      });
  }
}
