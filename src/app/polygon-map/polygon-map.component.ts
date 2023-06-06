import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, LatLngTuple, LeafletEvent, Marker } from 'leaflet';
import 'leaflet-draw';
import { LocalStorageItems } from '../interfaces/local-storage-items';
import { LocalStorageService } from '../services/local-storage.service';
import { Coordinates } from '../interfaces/coordinates';

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

  markerCoordinates: Coordinates = { lat: 0, lng: 0 };

  drawControl = new L.Control.Draw({
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

  private colorNewMarker: MarkerColor = { colorName: '', colorValue: '' };

  constructor(private ref: ChangeDetectorRef, private LSService: LocalStorageService) {}

  ngOnInit(): void {
    this.myMap = this.createMap();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.Icon.Default.imagePath = 'assets/';

    this.myMap.addControl(this.drawControl);
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
                  icon: L.divIcon({
                    className: 'select-color-marker',
                    html: `<span style="background-color: ${geoJsonPoint.properties.colorMarker}"></span>`,
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = featureType;
          if (featureType === 'circlemarker' || featureType === 'circle') {
            layer.feature.properties['radius'] = feature.properties.radius;
          }
          layer.on('drag', (e: any) => {
            this.markerCoordinates = {
              lat: e.latlng.lat,
              lng: e.latlng.lng,
            };
            this.ref.markForCheck();
          });
          this.drawnItems.addLayer(layer);
        });
      });
      this.myMap.fitBounds(this.drawnItems.getBounds());
    }
  }

  addMarker(marker: Marker): void {
    this.drawnItems.addLayer(marker);
    this.myMap.panTo(marker.getLatLng());
    this.myMap.fitBounds(this.drawnItems.getBounds());
    this.saveDrawChanges();
  }

  getColorMarker(color: MarkerColor): void {
    this.colorNewMarker = color;
    this.drawControl.setDrawingOptions({
      marker: {
        icon: L.divIcon({
          className: 'select-color-marker',
          html: `<span style="background-color: ${color.colorValue}"></span>`,
        }),
      },
    });
    this.ref.markForCheck();
  }

  saveDrawChanges(): void {
    this.LSService.setItem(LocalStorageItems.DrawItems, this.drawnItems.toGeoJSON());
    this.ref.markForCheck();
  }

  private createMap(): DrawMap {
    return L.map(this.mapEl?.nativeElement)
      .setView(this.centerCoords, this.mapZoom)
      .on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
        const createdEvent = e as L.DrawEvents.Created;
        const type = createdEvent.layerType;
        const colorMarker: MarkerColor = this.colorNewMarker;
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
                  icon: L.divIcon({
                    className: 'select-color-marker',
                    html: `<span style="background-color: ${colorMarker.colorValue}"></span>`,
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = type;
          layer.feature.properties['colorMarker'] = this.colorNewMarker.colorValue;

          if (type === 'circlemarker' || type === 'circle') {
            layer.feature.properties['radius'] = e.layer.getRadius();
          }

          layer.on('drag', (e: any) => {
            this.markerCoordinates = {
              lat: e.latlng.lat,
              lng: e.latlng.lng,
            };
            this.ref.markForCheck();
          });

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
