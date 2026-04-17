import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PetMedicalProfileDTO, UpdateMedicalProfileRequest } from '../models/medical-profile.model';

/**
 * Servicio para gestionar perfiles médicos de mascotas.
 * 
 * Responsabilidades:
 * - Obtener la hoja médica maestra de una mascota
 * - Actualizar información médica después de consultas
 * - Mantener historial de alergias, condiciones crónicas y medicamentos
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
@Injectable({ providedIn: 'root' })
export class MedicalProfileService {

  private readonly apiUrl = `${environment.apiUrl}/api/vet/pets`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene headers con token de autenticación
   * @returns HttpHeaders con Authorization
   */
  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Obtiene la hoja médica maestra de una mascota
   * @param petId ID de la mascota
   * @returns Observable con datos del perfil médico
   */
  getMedicalProfile(petId: number): Observable<PetMedicalProfileDTO> {
    return this.http.get<PetMedicalProfileDTO>(
      `${this.apiUrl}/${petId}/medical-profile`, 
      { headers: this.headers() }
    );
  }

  /**
   * Actualiza la hoja médica maestra después de una consulta
   * @param petId ID de la mascota
   * @param data Datos actualizados del perfil médico
   * @returns Observable con el perfil médico actualizado
   */
  updateMedicalProfile(petId: number, data: UpdateMedicalProfileRequest): Observable<PetMedicalProfileDTO> {
    return this.http.put<PetMedicalProfileDTO>(
      `${this.apiUrl}/${petId}/medical-profile`, 
      data,
      { headers: this.headers() }
    );
  }
}