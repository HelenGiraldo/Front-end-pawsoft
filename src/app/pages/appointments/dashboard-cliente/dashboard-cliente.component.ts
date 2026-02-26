import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppSidebarComponent } from 'src/app/share/components/app-sidebar/app-sidebar.component';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  emoji: string;
  gender: string;
  birthDate: string;
  color: string;
  notes?: string;
}

interface CalendarDay {
  date: number | null;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  hasAvailableSlots: boolean;
  fullDate?: Date;
}

interface TimeSlot {
  time: string;
  status: 'available' | 'taken' | 'selected';
}

interface Appointment {
  id: string;
  petName: string;
  petEmoji: string;
  date: string;
  time: string;
  reason: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  canCancel: boolean;
}

@Component({
  selector: 'app-dashboard-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppSidebarComponent
  ],
  templateUrl: './dashboard-cliente.component.html',
  styleUrls: ['./dashboard-cliente.component.scss']
})
export class DashboardClienteComponent implements OnInit {
  // User data
  userName: string = '';
  userRole: string = '';

  // Pets
  pets: Pet[] = [];
  selectedPet: Pet | null = null;

  // Calendar
  weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  calendarDays: CalendarDay[] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  currentMonthYear: string = '';
  selectedDate: string | null = null;
  selectedDateObj: Date | null = null;

  // Time slots
  timeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;
  loadingSlots: boolean = false;

  // Appointment
  appointmentReason: string = '';
  appointmentNotes: string = '';
  confirmingAppointment: boolean = false;

  // Appointments list
  myAppointments: Appointment[] = [];

  // Pet modal
  showCreatePetModal: boolean = false;
  petForm: FormGroup;
  savingPet: boolean = false;

  // Cancel modal
  showCancelModal: boolean = false;
  appointmentToCancel: Appointment | null = null;
  cancelReason: string = '';
  cancelling: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.petForm = this.fb.group({
      name: ['', Validators.required],
      species: ['', Validators.required],
      breed: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      color: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadMockPets();
    this.loadMyAppointments();
    this.generateCalendar();
    this.updateMonthYearLabel();
  }

  // ──────────────────────────────────────────────────────────────
  // USER DATA
  // ──────────────────────────────────────────────────────────────

  loadUserData() {
    this.userName = localStorage.getItem('email') || 'Usuario';
    this.userRole = localStorage.getItem('rol') || 'ROLE_CLIENTE';
  }

  // ──────────────────────────────────────────────────────────────
  // APPOINTMENTS LIST
  // ──────────────────────────────────────────────────────────────

  loadMyAppointments() {
    // TODO: Replace with real API call
    this.myAppointments = [
      {
        id: '1',
        petName: 'Rocky',
        petEmoji: '🐕',
        date: '28 Feb 2026',
        time: '10:00 AM',
        reason: 'Consulta general',
        status: 'upcoming',
        canCancel: true
      },
      {
        id: '2',
        petName: 'Luna',
        petEmoji: '🐈',
        date: '5 Mar 2026',
        time: '15:30 PM',
        reason: 'Vacunación',
        status: 'upcoming',
        canCancel: true
      }
    ];
  }

  openCancelModal(appointment: Appointment) {
    this.appointmentToCancel = appointment;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.appointmentToCancel = null;
    this.cancelReason = '';
  }

  confirmCancel() {
    if (!this.appointmentToCancel) return;

    this.cancelling = true;

    const appointmentId = this.appointmentToCancel.id;

    setTimeout(() => {
      const appt = this.myAppointments.find(a => a.id === appointmentId);
      if (appt) {
        appt.status = 'cancelled';
        appt.canCancel = false;
      }

      this.cancelling = false;
      this.closeCancelModal();
      console.log('Cita cancelada:', appointmentId);
    }, 1000);
  }

  // ──────────────────────────────────────────────────────────────
  // PETS
  // ──────────────────────────────────────────────────────────────

  loadMockPets() {
    // TODO: Replace with real API call
    this.pets = [
      {
        id: '1',
        name: 'Rocky',
        species: 'Perro',
        breed: 'Labrador',
        age: 4,
        emoji: '🐕',
        gender: 'M',
        birthDate: '2022-01-15',
        color: 'Dorado'
      },
      {
        id: '2',
        name: 'Luna',
        species: 'Gato',
        breed: 'Siamés',
        age: 2,
        emoji: '🐈',
        gender: 'F',
        birthDate: '2024-03-20',
        color: 'Blanco con negro'
      }
    ];
  }

  selectPet(pet: Pet) {
    this.selectedPet = pet;
    this.resetBookingState();
  }

  resetBookingState() {
    this.selectedDate = null;
    this.selectedDateObj = null;
    this.selectedTimeSlot = null;
    this.appointmentReason = '';
    this.appointmentNotes = '';
    this.timeSlots = [];
  }

  openCreatePetModal() {
    this.showCreatePetModal = true;
    this.petForm.reset();
  }

  closeCreatePetModal() {
    this.showCreatePetModal = false;
  }

  savePet() {
    if (this.petForm.invalid) return;
    this.savingPet = true;

    setTimeout(() => {
      const formValue = this.petForm.value;
      const newPet: Pet = {
        id: Date.now().toString(),
        name: formValue.name,
        species: formValue.species,
        breed: formValue.breed,
        age: this.calculateAge(formValue.birthDate),
        emoji: this.getSpeciesEmoji(formValue.species),
        gender: formValue.gender,
        birthDate: formValue.birthDate,
        color: formValue.color,
        notes: formValue.notes
      };

      this.pets.push(newPet);
      this.savingPet = false;
      this.closeCreatePetModal();
      this.selectPet(newPet);
    }, 1000);
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  getSpeciesEmoji(species: string): string {
    const emojiMap: { [key: string]: string } = {
      'Perro': '🐕',
      'Gato': '🐈',
      'Conejo': '🐰',
      'Hamster': '🐹',
      'Ave': '🦜',
      'Otro': '🐾'
    };
    return emojiMap[species] || '🐾';
  }

  // ──────────────────────────────────────────────────────────────
  // CALENDAR
  // ──────────────────────────────────────────────────────────────

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    this.calendarDays = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      this.calendarDays.push({
        date: null,
        isToday: false,
        isSelected: false,
        isDisabled: true,
        hasAvailableSlots: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(this.currentYear, this.currentMonth, day);
      currentDate.setHours(0, 0, 0, 0);

      const isPast = currentDate < today;
      const isToday = currentDate.getTime() === today.getTime();
      const hasSlots = !isPast && Math.random() > 0.3;

      this.calendarDays.push({
        date: day,
        isToday,
        isSelected: false,
        isDisabled: isPast,
        hasAvailableSlots: hasSlots,
        fullDate: currentDate
      });
    }
  }

  updateMonthYearLabel() {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonthYear = `${months[this.currentMonth]} ${this.currentYear}`;
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.updateMonthYearLabel();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.updateMonthYearLabel();
  }

  selectDate(day: CalendarDay) {
    if (!day.date || day.isDisabled || !day.hasAvailableSlots) return;

    this.calendarDays.forEach(d => d.isSelected = false);
    day.isSelected = true;

    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.selectedDate = `${day.date} de ${months[this.currentMonth]} ${this.currentYear}`;
    this.selectedDateObj = day.fullDate || null;

    this.selectedTimeSlot = null;
    this.appointmentReason = '';
    this.appointmentNotes = '';

    this.loadTimeSlots();
  }

  // ──────────────────────────────────────────────────────────────
  // TIME SLOTS
  // ──────────────────────────────────────────────────────────────

  loadTimeSlots() {
    this.loadingSlots = true;

    setTimeout(() => {
      const hours = [
        '08:00', '08:30', '09:00', '09:30',
        '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
      ];

      this.timeSlots = hours.map(time => ({
        time,
        status: Math.random() > 0.6 ? 'taken' : 'available'
      }));

      this.loadingSlots = false;
    }, 800);
  }

  selectTimeSlot(slot: TimeSlot) {
    if (slot.status === 'taken') return;

    this.timeSlots.forEach(s => {
      if (s.status === 'selected') s.status = 'available';
    });

    slot.status = 'selected';
    this.selectedTimeSlot = slot;
  }

  // ──────────────────────────────────────────────────────────────
  // APPOINTMENT
  // ──────────────────────────────────────────────────────────────

  getReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'consulta': 'Consulta general',
      'vacunacion': 'Vacunación',
      'desparasitacion': 'Desparasitación',
      'control': 'Control de rutina',
      'emergencia': 'Emergencia',
      'cirugia': 'Cirugía programada',
      'otro': 'Otro'
    };
    return labels[reason] || reason;
  }

  confirmAppointment() {
    if (!this.selectedPet || !this.selectedTimeSlot || !this.appointmentReason) {
      return;
    }

    this.confirmingAppointment = true;

    setTimeout(() => {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        petName: this.selectedPet!.name,
        petEmoji: this.selectedPet!.emoji,
        date: this.selectedDate!,
        time: this.selectedTimeSlot!.time,
        reason: this.getReasonLabel(this.appointmentReason),
        status: 'upcoming',
        canCancel: true
      };

      this.myAppointments.unshift(newAppointment);

      this.confirmingAppointment = false;
      this.resetBookingState();
      this.selectedPet = null;

      console.log('Cita confirmada:', newAppointment);
      alert('¡Cita agendada exitosamente!');
    }, 1500);
  }
}
