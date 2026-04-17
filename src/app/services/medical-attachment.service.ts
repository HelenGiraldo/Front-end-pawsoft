import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MedicalAttachmentDTO } from '../models/hospitalization.model';

/**
 * Servicio para gestionar archivos adjuntos médicos.
 * 
 * Responsabilidades:
 * - Subir archivos médicos (imágenes y PDFs)
 * - Obtener archivos adjuntos por referencia
 * - Eliminar archivos adjuntos
 * - Gestionar permisos de acceso a archivos
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
export class MedicalAttachmentService {

  private readonly apiUrl = `${environment.apiUrl}/api/vet/attachments`;

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
   * Sube un archivo adjunto médico
   * @param file Archivo a subir (imagen JPG/PNG o PDF)
   * @param referenceType Tipo de referencia (MEDICAL_RECORD, HOSPITALIZATION, etc.)
   * @param referenceId ID de la referencia
   * @returns Observable con datos del archivo subido
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
   * Obtiene archivos adjuntos por referencia
   * @param referenceType Tipo de referencia
   * @param referenceId ID de la referencia
   * @returns Observable con lista de archivos adjuntos
   */
  getAttachments(referenceType: string, referenceId: number): Observable<MedicalAttachmentDTO[]> {
    return this.http.get<MedicalAttachmentDTO[]>(
      `${this.apiUrl}?referenceType=${referenceType}&referenceId=${referenceId}`, 
      { headers: this.headers() }
    );
  }

  /**
   * Elimina un archivo adjunto
   * @param id ID del archivo a eliminar
   * @returns Observable vacío
   */
  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`, 
      { headers: this.headers() }
    );
  }
}