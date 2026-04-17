import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PetMedicalProfileDTO, UpdateMedicalProfileRequest } from '../models/medical-profile.model';

@Injectable({ providedIn: 'root' })
export class MedicalProfileService {

  private readonly apiUrl = `${environment.apiUrl}/api/vet/pets`;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Obtiene la hoja médica maestra de una mascota
   */
  getMedicalProfile(petId: number): Observable<PetMedicalProfileDTO> {
    return this.http.get<PetMedicalProfileDTO>(
      `${this.apiUrl}/${petId}/medical-profile`, 
      { headers: this.headers() }
    );
  }

  /**
   * Actualiza la hoja médica maestra después de una consulta
   */
  updateMedicalProfile(petId: number, data: UpdateMedicalProfileRequest): Observable<PetMedicalProfileDTO> {
    return this.http.put<PetMedicalProfileDTO>(
      `${this.apiUrl}/${petId}/medical-profile`, 
      data,
      { headers: this.headers() }
    );
  }
}