import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MedicationCatalogResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export interface VaccineCatalogResponse {
  id: number;
  name: string;
  description: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = `${environment.apiUrl}/recepcionista/payments`;

  constructor(private http: HttpClient) {}

  getMedications(): Observable<MedicationCatalogResponse[]> {
    return this.http.get<MedicationCatalogResponse[]>(`${this.apiUrl}/medications`);
  }

  getVaccines(): Observable<VaccineCatalogResponse[]> {
    return this.http.get<VaccineCatalogResponse[]>(`${this.apiUrl}/vaccines`);
  }
}
