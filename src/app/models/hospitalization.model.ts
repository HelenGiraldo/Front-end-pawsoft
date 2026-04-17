export interface HospitalizationDTO {
  id: number;
  petId: number;
  petName: string;
  vetId: number;
  vetName: string;
  appointmentId: number;
  status: string;
  admissionDate: string;
  dischargeDate: string;
  reason: string;
  initialObservations: string;
  hourlyRate: number;
  causeOfDeath: string;
  createdAt: string;
  totalHours: number;
  totalCost: number;
  notes: HospitalizationNoteDTO[];
  attachments: MedicalAttachmentDTO[];
}

export interface HospitalizationNoteDTO {
  id: number;
  hospitalizationId: number;
  vetId: number;
  vetName: string;
  note: string;
  createdAt: string;
}

export interface MedicalAttachmentDTO {
  id: number;
  referenceType: string;
  referenceId: number;
  fileUrl: string;
  fileType: string;
  fileName: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

export interface CreateHospitalizationRequest {
  petId: number;
  appointmentId?: number;
  reason: string;
  initialObservations?: string;
  hourlyRate: number;
}

export interface UpdateHospitalizationStatusRequest {
  status: string;
  causeOfDeath?: string;
}