import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.scss']
})
export class AppSidebarComponent implements OnChanges {
  @Input() userRole: string = 'ROLE_CLIENTE';
  @Input() userName: string = '';

  menuItems: MenuItem[] = [];
  userInitials: string = '';
  ngOnChanges(changes: SimpleChanges): void {

    if (changes['userRole'] || changes['userName']) {

      if (!this.userRole) {
        this.userRole = 'ROLE_CLIENTE';
      }

      this.userInitials = this.getUserInitials();
      this.loadMenuByRole();
    }
  }

  private loadMenuByRole() {
    switch (this.userRole) {
      case 'ROLE_CLIENTE':
        this.menuItems = [
          { icon: '📅', label: 'Mis Citas', route: '/dashboard-cliente' },
          { icon: '🐾', label: 'Mis Mascotas', route: '/mascotas' },
          { icon: '📋', label: 'Historial', disabled: true }
        ];
        break;

      case 'ROLE_VETERINARIO':
        this.menuItems = [
          { icon: '🏠', label: 'Dashboard', route: '/dashboard-vet' },
          { icon: '📅', label: 'Citas', disabled: true },
          { icon: '📋', label: 'Historial', disabled: true },
          { icon: '🩺', label: 'Consulta', disabled: true },
        ];
        break;

      case 'ROLE_RECEPCIONISTA':
        this.menuItems = [
          { icon: '🏠', label: 'Dashboard', route: '/dashboard-recep' },
          { icon: '📅', label: 'Citas', disabled: true },
          { icon: '👥', label: 'Clientes', disabled: true },
          { icon: '📦', label: 'Veterinarios', disabled: true }
        ];
        break;

      case 'ROLE_ADMIN':
        this.menuItems = [
          { icon: '🏠', label: 'Dashboard', route: '/dashboard-admin' },
          { icon: '👥', label: 'Usuarios', disabled: true },
          { icon: '📊', label: 'Reportes', disabled: true },
          { icon: '⚙️', label: 'Inventario', disabled: true }
        ];
        break;

      default:
        this.menuItems = [];
    }
  }

  private getUserInitials(): string {
    if (!this.userName) return '??';

    return this.userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleLabel(): string {
    const labels: { [key: string]: string } = {
      'ROLE_CLIENTE': 'Cliente',
      'ROLE_VETERINARIO': 'Veterinario',
      'ROLE_RECEPCIONISTA': 'Recepcionista',
      'ROLE_ADMIN': 'Administrador'
    };
    return labels[this.userRole] || 'Usuario';
  }
}
