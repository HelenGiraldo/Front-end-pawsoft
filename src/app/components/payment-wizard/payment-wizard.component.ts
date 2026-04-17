import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CatalogService, MedicationCatalogResponse, VaccineCatalogResponse } from 'src/app/services/catalog.service';
import { PaymentService, PaymentItemRequest } from 'src/app/services/payment.service';

interface CatalogItem {
  id: number;
  name: string;
  description: string;
  price: number;
  unit?: string;
  type: 'MEDICATION' | 'VACCINE';
}

interface SelectedItem extends CatalogItem {
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-payment-wizard',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-wizard.component.html',
  styleUrls: ['./payment-wizard.component.scss']
})
export class PaymentWizardComponent implements OnInit {
  currentStep = 1;
  
  // Step 1: Appointment info
  appointmentForm: FormGroup;
  
  // Step 2: Items selection
  catalogItems: CatalogItem[] = [];
  selectedItems: SelectedItem[] = [];
  loadingCatalog = false;
  searchText = '';
  
  // Step 3: Review
  totalAmount = 0;
  
  saving = false;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private paymentService: PaymentService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    this.appointmentForm = this.fb.group({
      appointmentId: ['', [Validators.required, Validators.min(1)]],
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      petName: ['', Validators.required],
      vetName: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      concept: ['', Validators.required],
      baseAmount: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loadingCatalog = true;
    const medications$ = this.catalogService.getMedications();
    const vaccines$ = this.catalogService.getVaccines();

    Promise.all([
      medications$.toPromise(),
      vaccines$.toPromise()
    ]).then(([meds, vacs]) => {
      this.catalogItems = [
        ...(meds || []).map(m => ({ ...m, type: 'MEDICATION' as const })),
        ...(vacs || []).map(v => ({ ...v, type: 'VACCINE' as const, unit: 'dosis' }))
      ];
      this.loadingCatalog = false;
    }).catch(() => {
      this.loadingCatalog = false;
    });
  }

  get filteredCatalog(): CatalogItem[] {
    const search = this.searchText.toLowerCase();
    if (!search) return this.catalogItems;
    return this.catalogItems.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search)
    );
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.appointmentForm.invalid) {
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    if (this.currentStep === 2) {
      this.calculateTotal();
    }
    
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addItem(item: CatalogItem): void {
    const existing = this.selectedItems.find(i => i.id === item.id && i.type === item.type);
    if (existing) {
      existing.quantity++;
      existing.subtotal = existing.quantity * existing.price;
    } else {
      this.selectedItems.push({
        ...item,
        quantity: 1,
        subtotal: item.price
      });
    }
  }

  removeItem(item: SelectedItem): void {
    const index = this.selectedItems.findIndex(i => i.id === item.id && i.type === item.type);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    }
  }

  updateQuantity(item: SelectedItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(item);
    } else {
      item.quantity = quantity;
      item.subtotal = item.quantity * item.price;
    }
  }

  calculateTotal(): void {
    const itemsTotal = this.selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const baseAmount = this.appointmentForm.get('baseAmount')?.value || 0;
    this.totalAmount = baseAmount + itemsTotal;
  }

  async confirm(): Promise<void> {
    if (this.appointmentForm.invalid) return;
    
    this.saving = true;
    
    const formValue = this.appointmentForm.value;
    const items: PaymentItemRequest[] = this.selectedItems.map(item => ({
      itemType: item.type,
      itemName: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.price
    }));

    this.paymentService.createPaymentWithItems({
      ...formValue,
      amount: this.totalAmount,
      items
    }).subscribe({
      next: () => {
        this.saving = false;
        this.modalCtrl.dismiss({ success: true }, 'confirm');
      },
      error: (err) => {
        console.error('Error creating payment:', err);
        this.saving = false;
        alert('Error al crear el pago. Por favor intente nuevamente.');
      }
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getItemTypeLabel(type: string): string {
    return type === 'MEDICATION' ? 'Medicamento' : 'Vacuna';
  }

  getItemTypeIcon(type: string): string {
    return type === 'MEDICATION' ? 'medical' : 'shield-checkmark';
  }
}
