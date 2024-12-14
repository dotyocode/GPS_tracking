import { Component, OnDestroy, OnInit } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  map: L.Map | undefined;
  route: L.Polyline | undefined;
  coordinates: L.LatLng[] = [];
  isTracking: boolean = false;
  watchId: string | undefined | any;
  currentMarker: L.Marker | undefined;
  compassInterval: any;
  compassElement: HTMLElement | null = null;
  activeButton: string | null = null;

  showDialog: boolean = false;
  showDetails: boolean = false;

  timer: number = 0;
  interval: any;
  totalDistance: number = 0;
  averagePace: number = 0;

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.initMap();
  }

  activateButton(button: string) {
    if (this.activeButton === button) {
      this.activeButton = null;
    } else {
      this.activeButton = button;
    }
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
    if (this.compassInterval) {
      clearInterval(this.compassInterval);
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  initMap() {
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Elemento #map não encontrado!');
        return;
      }

      this.map = L.map(mapElement).setView([0, 0], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      console.log('Mapa inicializado com sucesso!');

      this.getCurrentLocation();
    }, 0);
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });

      const latLng = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );

      const customIcon = L.divIcon({
        className: 'person_pin_circle',
        html: `<span class="material-icons" style="font-size:30px;color:red;">person_pin_circle</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });

      if (this.map) {
        this.map.setView(latLng, 15);

        L.marker(latLng, { icon: customIcon }).addTo(this.map).openPopup();
      }
    } catch (err) {
      console.error('Erro ao obter localização atual:', err);
    }
  }

  async startBackgroundTracking() {
    this.isTracking = true;
    const customIcon = L.divIcon({
      className: 'directions_run',
      html: `<span class="material-icons" style="font-size:30px;color:blue;">directions_run</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });

    this.watchId = Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          console.error('Erro ao rastrear localização:', err);
          return;
        }

        if (position) {
          const latLng = L.latLng(
            position.coords.latitude,
            position.coords.longitude
          );

          this.updateTrackingData(
            { coords: position } as unknown as Position,
            customIcon
          );
        }
      }
    );
  }

  updateTrackingData(position: Position, customIcon?: L.DivIcon) {
    const latLng = L.latLng(
      position.coords.latitude,
      position.coords.longitude
    );

    if (this.coordinates.length > 0) {
      const lastPoint = this.coordinates[this.coordinates.length - 1];
      this.totalDistance += this.calculateDistance(lastPoint, latLng) / 1000; // km
    }

    this.coordinates.push(latLng);
    this.route?.addLatLng(latLng);

    if (!this.currentMarker) {
      this.currentMarker = L.marker(latLng, { icon: customIcon }).addTo(
        this.map!
      );
    } else {
      this.currentMarker.setLatLng(latLng);
    }
  }

  async startTracking() {
    this.isTracking = true;
    this.coordinates = [];
    this.route = L.polyline([], { color: 'blue' }).addTo(this.map!);

    this.timer = 0;
    this.totalDistance = 0;
    this.averagePace = 0;

    this.interval = setInterval(() => {
      if (this.isTracking && this.coordinates.length > 1) {
        this.timer++;
        this.calculatePace();
      }
    }, 1000);


    const customIcon = L.divIcon({
      className: 'directions_run',
      html: `<span class="material-icons" style="font-size:30px;color:blue;">directions_run</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });

    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          console.error('Erro ao rastrear localização:', err);
          return;
        }

        if (position) {
          const latLng = L.latLng(
            position.coords.latitude,
            position.coords.longitude
          );

          if (this.coordinates.length > 0) {
            const lastPoint = this.coordinates[this.coordinates.length - 1];
            const distance = this.calculateDistance(lastPoint, latLng);
            this.totalDistance += distance / 1000; // Converte para km
          }

          this.coordinates.push(latLng);
          this.route?.addLatLng(latLng);

          if (!this.currentMarker) {
            this.currentMarker = L.marker(latLng, { icon: customIcon }).addTo(
              this.map!
            );
          } else {
            this.currentMarker.setLatLng(latLng);
          }
        }
      }
    );
  }

  calculateDistance(coord1: L.LatLng, coord2: L.LatLng): number {
    return coord1.distanceTo(coord2);
  }

  calculatePace() {
    if (this.totalDistance > 0 && this.coordinates.length > 1) {
      this.averagePace = (this.timer / 60) / this.totalDistance;
    } else {
      this.averagePace = 0;
    }
  }


  stopTracking() {
    this.isTracking = false;
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
    const savedRoute = this.saveRoute();

    this.showSaveDialog(savedRoute);
  }

  async showSaveDialog(routeData: any) {
    const alert = await this.alertController.create({
      header: 'Salvar Corrida',
      message: `
        Corrida salva com sucesso!
        Tempo: ${this.formatTimer(this.timer)}
        Distância: ${this.totalDistance.toFixed(2)} km
        Ritmo médio: ${this.averagePace.toFixed(2)} min/km
        Deseja salvar a corrida em seu histórico?
      `,
      buttons: [
        {
          text: 'Não',
          role: 'cancel',
          handler: () => {
            console.log('Usuário optou por não salvar a corrida.');
          },
        },
        {
          text: 'Sim',
          handler: () => {
            this.saveToHistory(routeData);
          },
        },
      ],
    });

    await alert.present();
  }

  saveToHistory(routeData: any) {
    const savedRun = {
      time: this.timer,
      distance: this.totalDistance,
      pace: this.averagePace,
      route: routeData,
      date: new Date().toISOString(),
    };

    console.log('Corrida salva no histórico:', savedRun);
  }

  saveRoute() {
    const routeData = this.coordinates.map((coord) => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

    console.log('Rota salva:', routeData);
    return routeData;
  }

  recenterMap() {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      .then((position) => {
        const latLng = L.latLng(
          position.coords.latitude,
          position.coords.longitude
        );
        this.map?.setView(latLng, 15);
      })
      .catch((err) => console.error('Erro ao recentralizar o mapa:', err));
  }

  async openStopDialog() {
    const alert = await this.alertController.create({
      header: 'Confirmação',
      message: 'Deseja realmente parar a corrida?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.cancelStop();
          },
        },
        {
          text: 'Sim',
          handler: () => {
            this.confirmStop();
          },
        },
      ],
    });

    await alert.present();
  }

  confirmStop() {
    this.showDialog = false;
    console.log('Rastreamento parado pelo usuário.');
    this.stopTracking();
  }

  cancelStop() {
    this.showDialog = false;
    console.log('Parada cancelada pelo usuário.');
  }

  addCompass() {
    this.compassElement = document.getElementById('compass-button');
    if (!this.compassElement) {
      console.error('Elemento da bússola não encontrado!');
      return;
    }

    this.watchId = Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position: Position | null, err?: any) => {
        if (err) {
          console.error('Erro ao monitorar posição:', err);
          return;
        }

        if (position && position.coords.heading !== null) {
          const heading = position.coords.heading;
          if (this.compassElement) {
            this.compassElement.style.transform = `rotate(${heading}deg)`;
          }
        }
      }
    );
  }

  formatTimer(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
  }

  getFormattedPace(): string {
    return this.averagePace > 0
      ? `${this.averagePace.toFixed(2)} min/km`
      : '--:--';
  }

}
