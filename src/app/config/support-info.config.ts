export interface WhatsAppInfo {
  number: string;
  countryCode: string;
  displayFormat: string;
}

export interface ScheduleInfo {
  days: string;
  hours: string;
}

export interface SupportInfo {
  whatsapp: WhatsAppInfo;
  schedule: ScheduleInfo;
  email: string;
}

export const SUPPORT_INFO: SupportInfo = {
  whatsapp: {
    number: '3004040743',
    countryCode: '57',
    displayFormat: '300 404 0743'
  },
  schedule: {
    days: 'Lunes a Viernes',
    hours: '8:00 AM - 6:00 PM'
  },
  email: 'pawsoft.vet@gmail.com'
};
