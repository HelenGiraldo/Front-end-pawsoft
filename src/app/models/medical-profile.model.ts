export interface PetMedicalProfileDTO {
  id: number;
  petId: number;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: number;
  knownAllergies: string;
  chronicConditions: string;
  surgicalHistory: string;
  currentMedications: string;
  bloodType: string;
  lastUpdatedByName: string;
  lastUpdatedByRole: string | null;
  lastUpdatedAt: string;
}

export interface CreateMedicalProfileInitialRequest {
  bloodType?: string;
  knownAllergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  additionalNotes?: string;
}

export interface UpdateMedicalProfileRequest {
  allergiesFound?: string;
  conditionsFound?: string;
  surgicalNote?: string;
  currentMeds?: string;
  bloodType?: string;
}