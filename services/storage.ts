
import { Certificate, CertificateData, Attachment } from '../types';
import { supabase } from '../supabaseClient';

const BUCKET_NAME = 'app-files';
const LOCAL_STORAGE_KEY = 'dmed_certificates_v3';

export { supabase };

export const isCloudEnabled = () => !!supabase;

// --- Auth Helpers ---
export const signOut = async () => {
  // Auth removed
  return;
};

// --- Data Operations (Certificates) ---

export const getCertificates = async (): Promise<Certificate[]> => {
  if (!supabase) return getLocalCertificates();

  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const mapped: Certificate[] = data.map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at).toLocaleString('uz-UZ'),
      securityCode: row.security_code,
      data: row.data,
      pdfUrl: row.pdf_url
    }));

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
    return mapped;
  } catch (err: any) {
    console.error('Database Retrieval Error:', err);
    if (err.message === 'Failed to fetch') {
      console.warn('Network error: falling back to local storage');
    }
    return getLocalCertificates();
  }
};

export const saveCertificate = async (cert: Certificate) => {
  const existing = getLocalCertificates();
  const updated = [cert, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  if (supabase) {
    try {
      const { error } = await supabase
        .from('certificates')
        .insert([{ 
          id: cert.id, 
          data: cert.data, 
          security_code: cert.securityCode,
          pdf_url: cert.pdfUrl || null
        }]);
      
      if (error) {
        console.error('Cloud Metadata Storage Error:', error);
        // We don't throw here to allow local-only mode to continue if cloud fails
        // but we can log it. If the user specifically needs cloud, we might want to notify them.
      }
    } catch (err) {
      console.error('Cloud Connection Error (Save):', err);
      // Silently fail for cloud but keep local data
    }
  }
};

/**
 * Uploads a raw file or PDF blob to Supabase Storage.
 * Generic function used by both certificates (auto-sync) and attachments.
 */
export const uploadFile = async (itemId: string, file: Blob | File, featureName: string = 'attachments'): Promise<string | null> => {
  if (!supabase) return null;

  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'pdf';
    const uuid = crypto.randomUUID();
    const filePath = `public/${featureName}/${itemId}/${uuid}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { 
        contentType: file instanceof File ? file.type : 'application/pdf', 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Cloud File Storage Error:', err);
    return null;
  }
};

// --- Attachment Operations ---

export const uploadAttachment = async (file: File): Promise<Attachment | null> => {
  if (!supabase) return null;

  try {
    const ext = file.name.split(".").pop() || "pdf";
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;
    const filePath = `public/attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const { data, error: insertError } = await supabase
      .from('attachments')
      .insert([{
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  } catch (err: any) {
    console.error("Upload attachment error:", err);
    if (err.message === 'Failed to fetch') {
      alert("Bulutli xotira bilan bog'lanishda xatolik. Iltimos, internet aloqasini tekshiring.");
    }
    return null;
  }
};

export const listAttachments = async (): Promise<Attachment[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("List attachments error:", err);
    return [];
  }
};

export const deleteAttachment = async (id: string, filePath: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    // 1. Delete from storage
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    // 2. Delete from DB
    const { error } = await supabase.from('attachments').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Delete attachment error:", err);
    return false;
  }
};

export const updateCertificatePdfUrl = async (id: string, pdfUrl: string) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ pdf_url: pdfUrl })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Cloud PDF URL Update Error:', err);
    }
  }
};

export const getCertificateById = async (id: string): Promise<Certificate | undefined> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          timestamp: new Date(data.created_at).toLocaleString('uz-UZ'),
          securityCode: data.security_code,
          data: data.data,
          pdfUrl: data.pdf_url
        };
      }
    } catch (err: any) {
      console.error('Database Search Error:', err);
      if (err.message === 'Failed to fetch') {
        console.warn('Network error during ID search: falling back to local storage');
      }
    }
  }
  return getLocalCertificates().find(c => c.id === id);
};

export const deleteCertificate = async (id: string) => {
  if (supabase) {
    try {
      const { data: certData } = await supabase
        .from('certificates')
        .select('pdf_url')
        .eq('id', id)
        .maybeSingle();

      if (certData?.pdf_url) {
        const urlParts = certData.pdf_url.split(`${BUCKET_NAME}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        }
      }

      await supabase.from('certificates').delete().eq('id', id);
    } catch (err) {
      console.error('Cloud Deletion Error:', err);
    }
  }
  
  const existing = getLocalCertificates();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.filter(c => c.id !== id)));
};

const getLocalCertificates = (): Certificate[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
