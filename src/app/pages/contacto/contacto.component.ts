import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from 'src/app/share/components/app-sidebar/app-sidebar.component';
import { SUPPORT_INFO } from 'src/app/config/support-info.config';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, AppSidebarComponent],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss']
})
export class ContactoComponent implements OnInit {

  userName = '';
  userRole = '';
  readonly supportInfo = SUPPORT_INFO;

  ngOnInit(): void {
    this.userName = localStorage.getItem('email') || 'Usuario';
    this.userRole = localStorage.getItem('rol') || 'ROLE_CLIENTE';
  }

  getWhatsAppLink(): string {
    const { countryCode, number } = this.supportInfo.whatsapp;
    
    if (!countryCode || !number) {
      console.warn('Support info configuration is incomplete');
      return '';
    }
    
    return `https://wa.me/${countryCode}${number}`;
  }
}
