
import React, { useState } from 'react';
import { CertificateData, DayOffRange } from '../types';
import { DEFAULT_CERT_DATA, DMEDLogo } from '../constants';

interface Props {
  onSubmit: (data: CertificateData) => void;
}

const CertificateForm: React.FC<Props> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<CertificateData>(DEFAULT_CERT_DATA);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (index: number, field: keyof DayOffRange, value: string) => {
    const newRanges = [...formData.releasedDays];
    newRanges[index][field] = value;
    setFormData(prev => ({ ...prev, releasedDays: newRanges }));
  };

  const addDateRange = () => {
    setFormData(prev => ({
      ...prev,
      releasedDays: [...prev.releasedDays, { start: '', end: '' }]
    }));
  };

  const removeDateRange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      releasedDays: prev.releasedDays.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-4">
        <DMEDLogo />
      </div>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl max-w-5xl mx-auto border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section 1: Official Header Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Hujjat Sarlavhasi</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Poliklinika (Header)</label>
            <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Berilgan sana</label>
            <input type="text" name="registrationDate" value={formData.registrationDate} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hujjat raqami</label>
            <input type="text" name="certificateNumber" value={formData.certificateNumber} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Beruvchi muassasa nomi (Block)</label>
            <input type="text" name="tibbiyMuassasaNomi" value={formData.tibbiyMuassasaNomi} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" required />
          </div>
        </div>

        {/* Section 2: Patient Info (Block 1) */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Bemor (Block 1)</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">FISh</label>
            <input type="text" name="patientFullName" value={formData.patientFullName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jinsi</label>
              <input type="text" name="patientGender" value={formData.patientGender} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Yoshi</label>
              <input type="text" name="patientAge" value={formData.patientAge} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">JShShIR</label>
            <input type="text" name="patientPinfl" value={formData.patientPinfl} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qarindoshligi</label>
            <input type="text" name="relativesRelation" value={formData.relativesRelation} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
          </div>
        </div>

        {/* Section 3: Diagnosis & Doctors */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Tashxis & Shifokorlar</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dastlabki Tashxis (Kodi: Nomi)</label>
            <div className="flex gap-2">
              <input type="text" name="diagnosisInitialCode" placeholder="J20.9" value={formData.diagnosisInitialCode} onChange={handleChange} className="w-20 p-2 border rounded-lg bg-slate-50 outline-none" />
              <input type="text" name="diagnosisInitialName" placeholder="Nomi" value={formData.diagnosisInitialName} onChange={handleChange} className="flex-1 p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Yakuniy Tashxis (Kodi: Nomi)</label>
            <div className="flex gap-2">
              <input type="text" name="diagnosisFinalCode" placeholder="J20.9" value={formData.diagnosisFinalCode} onChange={handleChange} className="w-20 p-2 border rounded-lg bg-slate-50 outline-none" />
              <input type="text" name="diagnosisFinalName" placeholder="Nomi" value={formData.diagnosisFinalName} onChange={handleChange} className="flex-1 p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Davolovchi shifokor FISh</label>
            <input type="text" name="doctorFullName" value={formData.doctorFullName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bo'lim boshlig'i FISh</label>
            <input type="text" name="departmentHeadFullName" value={formData.departmentHeadFullName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">VMK raisi FISh</label>
            <input type="text" name="vmkChairFullName" value={formData.vmkChairFullName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Date Ranges */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-slate-800">Ishdan ozod etilgan kunlar (Block 13)</h3>
            <button type="button" onClick={addDateRange} className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline">+ Qo'shish</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {formData.releasedDays.map((range, index) => (
              <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input type="text" placeholder="25.11.2025" value={range.start} onChange={(e) => handleDateRangeChange(index, 'start', e.target.value)} className="flex-1 bg-transparent border-b border-slate-300 outline-none text-sm" />
                <span className="text-slate-300">-</span>
                <input type="text" placeholder="01.12.2025" value={range.end} onChange={(e) => handleDateRangeChange(index, 'end', e.target.value)} className="flex-1 bg-transparent border-b border-slate-300 outline-none text-sm" />
                <button type="button" onClick={() => removeDateRange(index)} className="text-red-400 p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Other Sections (2-17) */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Boshqa Ma'lumotlar</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manzil (2)</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ish/O'qish joyi (3)</label>
              <input type="text" name="workOrStudyPlace" value={formData.workOrStudyPlace} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Biriktirilgan poliklinika (4)</label>
              <input type="text" name="assignedClinic" value={formData.assignedClinic} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Layoqatsizlik sababi (5)</label>
              <input type="text" name="reason" value={formData.reason} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Berilgan muassasa turi (16)</label>
              <input type="text" name="certificateInstitutionType" value={formData.certificateInstitutionType} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Muassasa nomi (17)</label>
              <input type="text" name="certificateInstitutionName" value={formData.certificateInstitutionName} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-[#0066CC] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-700 transition active:scale-[0.98]">
        Ma'lumotnomani Shakllantirish (Pixel-Perfect PDF)
      </button>
      </form>
    </div>
  );
};

export default CertificateForm;
