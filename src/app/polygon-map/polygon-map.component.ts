import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, LatLngTuple, Layer, LeafletEvent, Marker } from 'leaflet';
import { LocalStorageItems } from '../interfaces/local-storage-items';
import { LocalStorageService } from '../services/local-storage.service';
import { Coordinates } from '../interfaces/coordinates';
import 'leaflet-draw';
import 'leaflet.markercluster';

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
      circle: {
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

  markerCluster = L.markerClusterGroup({ animate: true });

  private colorControl: MarkerColor = { colorName: '', colorValue: '' };

  constructor(private ref: ChangeDetectorRef, private LSService: LocalStorageService) {}

  ngOnInit(): void {
    this.myMap = this.createMap();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.Icon.Default.imagePath = 'assets/';

    this.myMap.addControl(this.drawControl);
    this.myMap.addLayer(this.markerCluster);
    this.drawnItems.addTo(this.myMap);

    L.control.scale().addTo(this.myMap);

    if (this.LSService.getItem(LocalStorageItems.DrawItems)) {
      const drawItems = this.LSService.getItem(LocalStorageItems.DrawItems);
      if (drawItems === null) {
        return;
      }
      const drawItemJson = JSON.parse(drawItems);
      drawItemJson.features.map((feature: any) => {
        this.loadFeaturesOptions(feature);
      });
      this.myMap.fitBounds(this.markerCluster.getBounds());
      this.ref.markForCheck();
    }
  }

  addMarker(marker: Marker): void {
    this.drawnItems.addLayer(marker);
    if (marker.options.alt === 'Marker') {
      this.markerCluster.addLayer(marker);
      this.ref.markForCheck();
    }
    this.myMap.panTo(marker.getLatLng());
    this.myMap.fitBounds(this.drawnItems.getBounds());
    this.saveDrawChanges();
  }

  getColorControl(color: MarkerColor): void {
    this.colorControl = color;
    this.drawControl.setDrawingOptions({
      polyline: {
        shapeOptions: {
          color: color.colorValue,
        },
      },
      polygon: {
        shapeOptions: {
          color: color.colorValue,
        },
      },
      circle: {
        shapeOptions: {
          color: color.colorValue,
        },
      },
      circlemarker: {
        color: color.colorValue,
      },
      rectangle: <any>{
        shapeOptions: {
          color: color.colorValue,
        },
      },
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

  getImportFile(file: any) {
    const futures = file.features;
    if (futures.length > 0) {
      this.clearFeatureGroup();
      futures.map((feature: any) => {
        this.loadFeaturesOptions(feature);
      });

      this.saveDrawChanges();
    }
  }

  private createMap(): DrawMap {
    return L.map(this.mapEl?.nativeElement)
      .setView(this.centerCoords, this.mapZoom)
      .on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
        const createdEvent = e as L.DrawEvents.Created;
        const type = createdEvent.layerType;
        const colorMarker: MarkerColor = this.colorControl;
        L.geoJson(createdEvent.layer.toGeoJSON(), {
          style: {
            color: this.colorControl.colorValue,
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
          layer.feature.properties['color'] = this.colorControl.colorValue;

          if (type === 'circlemarker' || type === 'circle') {
            layer.feature.properties['radius'] = e.layer.getRadius();
          }

          if (type === 'marker') {
            this.markerCluster.addLayer(layer);
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
        this.markerCluster.clearLayers();
        this.saveDrawChanges();
      });
  }

  private clearFeatureGroup(): void {
    this.drawnItems.eachLayer((layer: Layer) => {
      this.drawnItems.removeLayer(layer);
    });
  }

  private loadFeaturesOptions(feature: any): void {
    const featureType = feature.properties.type;

    new L.GeoJSON(feature, {
      style: {
        color: feature.properties.color,
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
                html: `<span style="background-color: ${geoJsonPoint.properties.color}"></span>`,
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
      if (layer.options.alt === 'Marker' || featureType === 'Marker') {
        this.markerCluster.addLayer(layer);
        console.log('!');
      }
      this.ref.markForCheck();
    });
  }
}
