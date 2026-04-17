import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MedicalAttachmentDTO } from '../models/hospitalization.model';

@Injectable({ providedIn: 'root' })
export class MedicalAttachmentService {

  private readonly apiUrl = `${environment.apiUrl}/api/vet/attachments`;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Subir archivo adjunto médico
   */
  uploadAttachment(file: File, referenceType: string, referenceId: number): Observable<MedicalAttachmentDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('referenceType', referenceType);
    formData.append('referenceId', referenceId.toString());

    return this.http.post<MedicalAttachmentDTO>(
      `${this.apiUrl}/upload`, 
      formData,
      { headers: this.headers() }
    );
  }

  /**
   * Obtener archivos adjuntos por referencia
   */
  getAttachments(referenceType: string, referenceId: number): Observable<MedicalAttachmentDTO[]> {
    return this.http.get<MedicalAttachmentDTO[]>(
      `${this.apiUrl}?referenceType=${referenceType}&referenceId=${referenceId}`, 
      { headers: this.headers() }
    );
  }

  /**
   * Eliminar archivo adjunto
   */
  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`, 
      { headers: this.headers() }
    );
  }
}