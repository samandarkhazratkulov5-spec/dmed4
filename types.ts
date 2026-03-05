
export interface DayOffRange {
  start: string;
  end: string;
}

export interface CertificateData {
  clinicName: string;
  registrationDate: string;
  certificateNumber: string;
  tibbiyMuassasaNomi: string;
  
  // Block 1 & 1a
  patientFullName: string;
  patientGender: string;
  patientPinfl: string;
  patientAge: string;
  relativesRelation: string;
  
  childFullName: string;
  childGender: string;
  childPinfl: string;
  childAge: string;

  // Blocks 2-17
  address: string;
  workOrStudyPlace: string;
  assignedClinic: string;
  reason: string;
  diagnosisInitialCode: string;
  diagnosisInitialName: string;
  doctorFullName: string;
  departmentHeadFullName: string;
  diagnosisFinalCode: string;
  diagnosisFinalName: string;
  vmkChairFullName: string;
  contactInfectious: string;
  tiekCheckDate: string;
  tiekConclusion: string;
  tiekChairFullName: string;
  tartib: string;
  tartibNotes: string;
  releasedDays: DayOffRange[];
  temporaryOtherJob: string;
  otherCityPermission: string;
  certificateInstitutionType: string;
  certificateInstitutionName: string;
}

export interface Certificate {
  id: string;
  timestamp: string;
  securityCode: string;
  data: CertificateData;
  pdfUrl?: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  created_at: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export enum AppTab {
  HOME = 'Asosiy',
  VERIFY = 'Tekshirish',
  HISTORY = 'Arxiv'
}
