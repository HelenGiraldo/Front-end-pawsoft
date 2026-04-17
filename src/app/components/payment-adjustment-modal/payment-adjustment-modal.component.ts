import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-payment-adjustment-modal',
  templateUrl: './payment-adjustment-modal.component.html',
  styleUrls: ['./payment-adjustment-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class PaymentAdjustmentModalComponent {
  @Input() currentAmount: number = 0;
  @Input() paymentId: number = 0;

  adjustmentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {
    this.adjustmentForm = this.fb.group({
      adjustedAmount: ['', [Validators.required, Validators.min(0)]],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.adjustmentForm.patchValue({
      adjustedAmount: this.currentAmount
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    if (this.adjustmentForm.valid) {
      this.modalCtrl.dismiss(this.adjustmentForm.value, 'confirm');
    }
  }

  get reasonError(): string {
    const control = this.adjustmentForm.get('reason');
    if (control?.hasError('required') && control?.touched) {
      return 'El motivo es obligatorio';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'El motivo debe tener al menos 10 caracteres';
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
