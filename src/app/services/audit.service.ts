import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentAdjustmentResponse {
  id: number;
  originalAmount: number;
  adjustedAmount: number;
  difference: number;
  reason: string;
  adjustedBy: string;
  adjustedByName: string;
  adjustedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${environment.apiUrl}/admin/payments`;

  constructor(private http: HttpClient) {}

  getAllAdjustments(): Observable<PaymentAdjustmentResponse[]> {
    return this.http.get<PaymentAdjustmentResponse[]>(`${this.apiUrl}/adjustments`);
  }
}
