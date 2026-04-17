import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interfaz para medicamentos del catálogo
 * 
 * Proyecto: Pawsoft
 * Universidad del Quindío
 * Materia: Software III
 * 
 * Autoras:
 * - Valentina Porras Salazar
 * - Helen Xiomara Giraldo Libreros
 * 
 * Profesor:
 * Raúl Yulbraynner Rivera Gálvez
 */
export interface MedicationCatalogResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

/**
 * Interfaz para vacunas del catálogo
 * 
 * Proyecto: Pawsoft
 * Universidad del Quindío
 * Materia: Software III
 * 
 * Autoras:
 * - Valentina Porras Salazar
 * - Helen Xiomara Giraldo Libreros
 * 
 * Profesor:
 * Raúl Yulbraynner Rivera Gálvez
 */
export interface VaccineCatalogResponse {
  id: number;
  name: string;
  description: string;
  price: number;
}

/**
 * Servicio para gestionar catálogos de medicamentos y vacunas.
 * 
 * Responsabilidades:
 * - Obtener lista de medicamentos disponibles
 * - Obtener lista de vacunas disponibles
 * - Proporcionar información de precios para facturación
 * 
 * Proyecto: Pawsoft
 * Universidad del Quindío
 * Materia: Software III
 * 
 * Autoras:
 * - Valentina Porras Salazar
 * - Helen Xiomara Giraldo Libreros
 * 
 * Profesor:
 * Raúl Yulbraynner Rivera Gálvez
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = `${environment.apiUrl}/recepcionista/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los medicamentos activos del catálogo
   * @returns Observable con lista de medicamentos
   */
  getMedications(): Observable<MedicationCatalogResponse[]> {
    return this.http.get<MedicationCatalogResponse[]>(`${this.apiUrl}/medications`);
  }

  /**
   * Obtiene todas las vacunas activas del catálogo
   * @returns Observable con lista de vacunas
   */
  getVaccines(): Observable<VaccineCatalogResponse[]> {
    return this.http.get<VaccineCatalogResponse[]>(`${this.apiUrl}/vaccines`);
  }
}
