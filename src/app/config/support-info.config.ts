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
    number: '3219806868',
    countryCode: '57',
    displayFormat: '321 980 6868'
  },
  schedule: {
    days: 'Lunes a Viernes',
    hours: '8:00 AM - 6:00 PM'
  },
  email: 'pawsoft.vet@gmail.com'
};
