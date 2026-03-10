import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Yo mantengo TODOS los componentes necesarios para que el HTML no truene
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonCardContent, IonButton, IonIcon, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// Yo registro cada icono que usamos en la vista
import { globeOutline, bagCheckOutline, storefrontOutline, cartOutline, addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.page.html',
  styleUrls: ['./tienda.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonBackButton, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, 
    IonCardContent, IonButton, IonIcon, IonBadge
  ]
})
export class TiendaPage implements OnInit {
  // Yo cambio esto a public para que el HTML pueda usarlo si es necesario
  public router = inject(Router);

  // Yo mantengo la lista de productos idéntica a la que el Admin edita en el Perfil
  public productos = [
    { id: 1, sku: 'ATJ-01', nombre: 'Collar GPS Atja', precio: 850, stock: 15, descripcion: 'Rastreo satelital para tu mascota.' },
    { id: 2, sku: 'BAT-09', nombre: 'Batería Repuesto', precio: 250, stock: 40, descripcion: 'Carga rápida y larga duración.' },
    { id: 3, sku: 'QR-55', nombre: 'Placa ID QR', precio: 120, stock: 100, descripcion: 'Identificación digital inteligente.' }
  ];

  constructor() {
    // Yo registro los iconos para que la interfaz se vea profesional
    addIcons({ globeOutline, bagCheckOutline, storefrontOutline, cartOutline, addOutline });
  }

  ngOnInit() {}

  // Yo programo esta función para abrir tu tienda web de Laravel (donde tienes el error de stream)
  verEnWeb(sku: string) {
    // Apunto a tu IP local de Laravel
    const urlWeb = `http://127.0.0.1:8000/tienda/producto/${sku}`;
    window.open(urlWeb, '_blank');
    console.log("Redirigiendo a Laravel para el producto: " + sku);
  }
}