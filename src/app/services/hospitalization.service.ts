import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HospitalizationNote {
  id: number;
  hospitalizationId: number;
  vetId: number;
  vetName: string;
  note: string;
  createdAt: string;
}

export interface HospitalizationDTO {
  id: number;
  petId: number;
  petName: string;
  vetId: number;
  vetName: string;
  appointmentId: number | null;
  status: 'ACTIVE' | 'DISCHARGED' | 'DECEASED';
  admissionDate: string;
  dischargeDate: string | null;
  reason: string;
  initialObservations: string | null;
  hourlyRate: number;
  causeOfDeath: string | null;
  createdAt: string;
  totalHours: number | null;
  totalCost: number | null;
  notes: HospitalizationNote[];
}

export interface CreateHospitalizationRequest {
  petId: number;
  appointmentId?: number | null;
  reason: string;
  initialObservations?: string;
  hourlyRate: number;
}

export interface PetResult {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  ownerEmail: string;
  photoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class HospitalizationService {

  private readonly baseUrl = `${environment.apiUrl}/api/vet/hospitalizations`;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getActive(): Observable<HospitalizationDTO[]> {
    return this.http.get<HospitalizationDTO[]>(`${this.baseUrl}/active`, { headers: this.headers() });
  }

  getAll(): Observable<HospitalizationDTO[]> {
    return this.http.get<HospitalizationDTO[]>(this.baseUrl, { headers: this.headers() });
  }

  getById(id: number): Observable<HospitalizationDTO> {
    return this.http.get<HospitalizationDTO>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  create(data: CreateHospitalizationRequest): Observable<HospitalizationDTO> {
    return this.http.post<HospitalizationDTO>(this.baseUrl, data, { headers: this.headers() });
  }

  discharge(id: number): Observable<HospitalizationDTO> {
    return this.http.put<HospitalizationDTO>(`${this.baseUrl}/${id}/discharge`, {}, { headers: this.headers() });
  }

  recordDeceased(id: number, causeOfDeath: string): Observable<HospitalizationDTO> {
    return this.http.put<HospitalizationDTO>(`${this.baseUrl}/${id}/deceased`, { causeOfDeath }, { headers: this.headers() });
  }

  addNote(id: number, note: string): Observable<HospitalizationNote> {
    return this.http.post<HospitalizationNote>(`${this.baseUrl}/${id}/notes`, { note }, { headers: this.headers() });
  }

  searchPets(name: string): Observable<PetResult[]> {
    return this.http.get<PetResult[]>(
      `${environment.apiUrl}/api/vet/appointments/pets/search?name=${encodeURIComponent(name)}`,
      { headers: this.headers() }
    );
  }
}
