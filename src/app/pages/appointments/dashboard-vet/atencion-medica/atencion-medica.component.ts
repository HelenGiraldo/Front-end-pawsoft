import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppSidebarComponent } from 'src/app/share/components/app-sidebar/app-sidebar.component';
import { AppointmentService, RecepAppointmentResponse } from 'src/app/services/appointment.service';
import { MedicalRecordService } from 'src/app/services/medical-record.service';

@Component({
  selector: 'app-atencion-medica',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSidebarComponent],
  templateUrl: './atencion-medica.component.html',
  styleUrls: ['./atencion-medica.component.scss']
})
export class AtencionMedicaComponent implements OnInit {

  userName = '';
  userRole = 'ROLE_VETERINARIO';

  citas: RecepAppointmentResponse[] = [];
  citasFiltradas: RecepAppointmentResponse[] = [];
  searchText = '';

  isLoading = false;
  errorMsg = '';

  todayFormatted = '';

  constructor(
    private readonly router: Router,
    private readonly appointmentService: AppointmentService,
    public readonly medicalRecordService: MedicalRecordService,
  ) {}

  ngOnInit(): void {
    this.userName = localStorage.getItem('email') || 'Veterinario';
    this.userRole = localStorage.getItem('rol') || 'ROLE_VETERINARIO';
    this.buildTodayDate();
    this.cargarCitas();
  }

  private buildTodayDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    };
    this.todayFormatted = now.toLocaleDateString('es-CO', options);
    this.todayFormatted = this.todayFormatted.charAt(0).toUpperCase() + this.todayFormatted.slice(1);
  }

  cargarCitas(): void {
    this.isLoading = true;
    this.errorMsg = '';

    const todayStr = new Date().toISOString().split('T')[0];

    this.appointmentService.getVetAppointments().subscribe({
      next: (data) => {
        // Citas CONFIRMED o IN_PROGRESS de hoy
        this.citas = data.filter(a => 
          (a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS') && 
          a.date === todayStr
        );
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar las citas. Intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    const atencionActiva = this.medicalRecordService.getAtencionActiva();
    const search = this.searchText.toLowerCase();

    this.citasFiltradas = this.citas.filter(c => {
      return !search ||
        c.petName.toLowerCase().includes(search) ||
        c.clientName.toLowerCase().includes(search);
    });
  }

  isEnProceso(cita: RecepAppointmentResponse): boolean {
    return this.medicalRecordService.getAtencionActiva()?.appointmentId === cita.id;
  }

  iniciarAtencion(cita: RecepAppointmentResponse): void {
    const atencionActiva = this.medicalRecordService.getAtencionActiva();
    
    // Si ya hay una atención activa diferente, mostrar error
    if (atencionActiva && atencionActiva.appointmentId !== cita.id) {
      this.errorMsg = `Ya tienes una atención en proceso para ${atencionActiva.petName}. Debes cerrarla antes de iniciar otra.`;
      return;
    }
    
    // Llamar al backend para cambiar estado a IN_PROGRESS
    this.appointmentService.startAppointment(cita.id).subscribe({
      next: () => {
        this.medicalRecordService.iniciarAtencion(cita);
        this.router.navigate(['/veterinario/formulario-consulta']);
      },
      error: (err) => {
        console.error('Error iniciando atención:', err);
        this.errorMsg = err.error?.message || 'No se pudo iniciar la atención. Intenta de nuevo.';
      }
    });
  }

  continuarAtencion(): void {
    this.router.navigate(['/veterinario/formulario-consulta']);
  }

  getEmojiBySpecies(species: string): string {
    const map: { [key: string]: string } = {
      'Perro': '🐕', 'Dog': '🐕',
      'Gato': '🐈', 'Cat': '🐈',
      'Conejo': '🐇', 'Rabbit': '🐇',
      'Ave': '🦜', 'Bird': '🦜',
      'Pez': '🐠', 'Fish': '🐠'
    };
    return map[species] || '🐾';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hourStr, minStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minStr} ${ampm}`;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
