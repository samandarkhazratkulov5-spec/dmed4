import React, { useState, useEffect } from 'react';
import { AppTab, Certificate, CertificateData, Attachment } from './types';
import { DMEDLogo, DMED_LOGO_URL } from './constants';
import CertificateForm from './components/CertificateForm';
import CertificatePreview from './components/CertificatePreview';
import { 
  saveCertificate, 
  getCertificates, 
  deleteCertificate, 
  getCertificateById, 
  isCloudEnabled,
  supabase,
  signOut,
  uploadAttachment,
  listAttachments,
  deleteAttachment,
  updateCertificatePdfUrl
} from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [history, setHistory] = useState<Certificate[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [verifyId, setVerifyId] = useState('');
  const [verificationResult, setVerificationResult] = useState<Certificate | null | 'error'>(null);
  
  const [externalVerifyId, setExternalVerifyId] = useState<string | null>(null);
  const [securityInput, setSecurityInput] = useState('');
  const [securityError, setSecurityError] = useState(false);

  // States for Attachment Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/verify/')) {
      const idFromPath = path.split('/verify/')[1];
      if (idFromPath) {
        setExternalVerifyId(idFromPath);
      }
    } else {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify');
      if (verifyParam) {
        setExternalVerifyId(verifyParam);
      }
    }
    loadHistory();
    loadAttachments();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getCertificates();
      setHistory(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttachments = async () => {
    try {
      const data = await listAttachments();
      setAttachments(data);
    } catch (err) {
      console.error("Failed to load attachments", err);
    }
  };

  const handleCreate = async (data: CertificateData) => {
    setIsLoading(true);
    try {
      const newCert: Certificate = {
        id: `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleString('uz-UZ'),
        securityCode: Math.floor(1000 + Math.random() * 9000).toString(),
        data
      };
      await saveCertificate(newCert);
      alert("Muvaffaqiyatli: Hujjat bazaga saqlandi!");
      setSelectedCert(newCert);
      setIsCreating(false);
      loadHistory();
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Xatolik: Ma'lumotni bazaga saqlashda muammo yuz berdi. " + (err.message || "Tarmoq xatosi."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (updatedCert: Certificate) => {
    setHistory(prev => prev.map(c => c.id === updatedCert.id ? updatedCert : c));
    if (selectedCert?.id === updatedCert.id) setSelectedCert(updatedCert);
    
    // If PDF URL was just added, sync it to the database
    if (updatedCert.pdfUrl) {
      await updateCertificatePdfUrl(updatedCert.id, updatedCert.pdfUrl);
    }
  };

  const handleVerify = async () => {
    if (!verifyId.trim()) return;
    setIsLoading(true);
    try {
      const found = await getCertificateById(verifyId);
      setVerificationResult(found || 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalSecurityCheck = async () => {
    if (!externalVerifyId) return;
    setIsLoading(true);
    try {
      const cert = await getCertificateById(externalVerifyId);
      if (!cert) {
        setVerificationResult('error');
        setExternalVerifyId(null);
        setActiveTab(AppTab.VERIFY);
        return;
      }
      if (cert.securityCode === securityInput) {
        setSelectedCert(cert);
        setExternalVerifyId(null);
        window.history.replaceState({}, document.title, '/');
      } else {
        setSecurityError(true);
        setTimeout(() => setSecurityError(false), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Ushbu ma\'lumotnomani ma\'lumotlar bazasidan o\'chirib tashlamoqchimisiz?')) {
      await deleteCertificate(id);
      loadHistory();
    }
  };

  const handleDeleteAttachment = async (id: string, filePath: string) => {
    if (confirm('Ushbu faylni o\'chirib tashlamoqchimisiz?')) {
      const success = await deleteAttachment(id, filePath);
      if (success) {
        setAttachments(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleAttachmentSubmit = async () => {
    if (!selectedFile) {
      setUploadError("Iltimos, faylni tanlang.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newAttachment = await uploadAttachment(selectedFile);
      if (newAttachment) {
        setAttachments(prev => [newAttachment, ...prev]);
        setShowUploadModal(false);
        setSelectedFile(null);
      } else {
        setUploadError("Yuklashda xatolik yuz berdi.");
      }
    } catch (err) {
      setUploadError("Server bilan bog'lanishda xatolik.");
    } finally {
      setIsUploading(false);
    }
  };

  if (externalVerifyId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden p-4">
            <img src={DMED_LOGO_URL} alt="DMED" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Hujjatni tasdiqlash</h1>
          <p className="text-slate-500 mb-8">SQL bazasidan hujjatni olish uchun xavfsizlik kodini kiriting</p>
          <div className="space-y-4">
            <input
              type="text"
              maxLength={4}
              placeholder="0000"
              value={securityInput}
              onChange={(e) => setSecurityInput(e.target.value.replace(/\D/g, ''))}
              className={`w-full text-center text-4xl tracking-[12px] font-bold p-5 border-2 rounded-2xl outline-none transition ${
                securityError ? 'border-red-500 animate-shake' : 'border-slate-100 focus:border-blue-500'
              }`}
            />
            {securityError && <p className="text-red-500 text-sm font-bold">Kod noto'g'ri!</p>}
            <button
              onClick={handleExternalSecurityCheck}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-xl hover:bg-blue-700 transition flex items-center justify-center gap-3 shadow-lg"
            >
              {isLoading && <div className="spinner border-white/30 border-l-white w-5 h-5"></div>}
              Bazadan ochish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCert) {
    return <CertificatePreview certificate={selectedCert} onClose={() => setSelectedCert(null)} onUpdate={handleUpdate} />;
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <button onClick={() => setIsCreating(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Orqaga
          </button>
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-widest">Hujjat Yaratish Rejimi</span>
          </div>
        </div>
        <CertificateForm onSubmit={handleCreate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 no-print">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <DMEDLogo />
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isCloudEnabled() ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isCloudEnabled() ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              {isCloudEnabled() ? 'Cloud SQL Active' : 'Local Only'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {Object.values(AppTab).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setVerificationResult(null); }}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab ? 'bg-white text-blue-600 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {activeTab === AppTab.HOME && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0035AD] to-[#0066CC] p-12 md:p-20 text-white shadow-2xl mb-12">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[2px] mb-8 border border-white/10">
                  <img src={DMED_LOGO_URL} alt="DMED" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                  <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse"></span>
                  Tizim yangilandi — v3.0
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6">
                  Tibbiy hujjatlarning <br/><span className="text-cyan-300">yagona raqamli</span> ekotizimi
                </h1>
                <p className="text-blue-100 text-lg md:text-xl font-medium mb-10 leading-relaxed opacity-90">
                  DMED tizimi orqali mehnatga layoqatsizlik ma'lumotnomalarini yaratish, saqlash va tekshirish endi yanada tezkor hamda xavfsiz.
                </p>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="bg-white text-blue-700 px-10 py-5 rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-cyan-50 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Xujjat qo'shish
                  </button>
                  <button 
                    onClick={() => setActiveTab(AppTab.VERIFY)}
                    className="bg-blue-800/40 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Tekshirish
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl group hover:border-blue-200 transition-colors">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Hujjatlar</p>
                <p className="text-4xl font-black text-slate-800">{history.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl group hover:border-green-200 transition-colors">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Bulutli xotira</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-black text-green-600 uppercase">Online</p>
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl group hover:border-cyan-200 transition-colors">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                <p className="text-2xl font-black text-slate-800 uppercase">Muvaffaqiyatli</p>
              </div>
            </div>

            {/* User Account Info */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Tizim Ma'muri</h3>
                  <p className="text-slate-400 text-sm font-medium">Barcha huquqlar himoyalangan</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider">Shifokor</span>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  Tasdiqlangan
                </button>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ilova qilingan hujjatlar</h2>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {attachments.length} ta fayl
                </span>
              </div>
              
              {attachments.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
                  <p className="text-slate-400 font-bold">Hech qanday fayl ilova qilinmagan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {attachments.map(att => (
                    <div key={att.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 truncate" title={att.file_name}>{att.file_name}</p>
                          <p className="text-[10px] text-slate-400">{(att.file_size / 1024).toFixed(1)} KB • PDF</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>
                        <button onClick={() => handleDeleteAttachment(att.id, att.file_path)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.VERIFY && (
          <div className="max-w-xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <DMEDLogo className="scale-125" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">Hujjatni tekshirish</h2>
              <p className="text-slate-400 mb-10 font-medium">Hujjat ID kodini kiriting</p>
              
              <div className="space-y-4 mb-10">
                <input 
                  type="text" 
                  value={verifyId}
                  onChange={(e) => setVerifyId(e.target.value)}
                  placeholder="Hujjat ID..." 
                  className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all shadow-inner text-center font-bold text-xl"
                />
                <button 
                  onClick={handleVerify} 
                  disabled={isLoading} 
                  className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-3"
                >
                  {isLoading && <div className="spinner border-white/30 border-l-white w-5 h-5"></div>}
                  Qidirish
                </button>
              </div>

              {verificationResult && verificationResult !== 'error' && (
                <div className="p-8 bg-green-50/50 border border-green-100 rounded-3xl text-left animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                    <span className="bg-green-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black tracking-tighter">Haqqoniy Hujjat</span>
                    <button onClick={() => setSelectedCert(verificationResult)} className="text-green-700 font-black text-sm uppercase">Ko'rish</button>
                  </div>
                  {/* Fixed: Replaced patientName with patientFullName and diagnosis with diagnosisInitialName */}
                  <h4 className="text-xl font-black text-slate-800">{verificationResult.data.patientFullName}</h4>
                  <p className="text-slate-500 text-sm mt-1">{verificationResult.data.diagnosisInitialName}</p>
                </div>
              )}
              
              {verificationResult === 'error' && (
                <div className="p-6 bg-red-50 text-red-600 rounded-2xl font-bold animate-shake">Hujjat topilmadi!</div>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.HISTORY && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-slate-800">Doimiy Arxiv</h2>
                <p className="text-slate-500 mt-2 font-medium">Bazadagi barcha hujjatlar ({history.length})</p>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="bg-white p-32 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                   <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <p className="text-slate-300 font-black uppercase tracking-[5px]">Arxiv bo'sh</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.map((cert) => (
                  <div key={cert.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex justify-between items-start mb-6 relative">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-[2px]">{cert.data.certificateNumber}</div>
                      <div className="flex gap-3">
                        {cert.pdfUrl && (
                          <a href={cert.pdfUrl} target="_blank" className="text-green-500 hover:text-green-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                          </a>
                        )}
                        <button onClick={() => handleDelete(cert.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    {/* Fixed: Replaced patientName with patientFullName and diagnosis with diagnosisInitialName */}
                    <h3 className="font-black text-slate-800 text-xl leading-snug mb-2 relative">{cert.data.patientFullName}</h3>
                    <p className="text-slate-400 text-sm font-medium line-clamp-1 mb-6 italic relative">{cert.data.diagnosisInitialName}</p>
                    <div className="flex justify-between items-center pt-6 border-t border-slate-50 relative">
                      <span className="text-[11px] font-black text-slate-300 uppercase">{cert.timestamp}</span>
                      <button 
                        onClick={() => setSelectedCert(cert)} 
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-all shadow-md active:scale-95"
                      >
                        Ochish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Attachment Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUploading && setShowUploadModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <DMEDLogo className="scale-110" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Fayl biriktirish</h2>
              <p className="text-slate-400 font-medium">Iltimos, PDF yoki boshqa hujjatni tanlang</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label className={`block w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        setUploadError(null);
                      }
                    }}
                  />
                  <div className="text-center">
                    <p className={`font-bold ${selectedFile ? 'text-blue-700' : 'text-slate-400'}`}>
                      {selectedFile ? selectedFile.name : "Faylni bosing yoki bu yerga tashlang"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Maksimal 10MB • PDF tavsiya etiladi</p>
                  </div>
                </label>
              </div>

              {uploadError && (
                <div className="p-4 bg-red-50 text-red-500 rounded-xl text-xs font-bold animate-shake text-center border border-red-100">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs text-slate-400 border border-slate-100 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleAttachmentSubmit}
                  disabled={isUploading}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {isUploading ? <div className="spinner border-white/30 border-l-white w-4 h-4"></div> : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <footer className="fixed bottom-0 w-full bg-white/60 backdrop-blur-md py-4 border-t text-center text-[10px] text-slate-400 font-black uppercase tracking-[3px]">
        DMED RAQAMLI EKOTIZIMI — 2025. {isCloudEnabled() ? 'Cloud SQL Active' : 'Offline Mode'}
      </footer>
    </div>
  );
};

export default App;