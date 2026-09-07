import { supabase } from "@/integrations/supabase/client";

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "nutriguard-uploads";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      const fallbackUrl = await readFileAsDataUrl(file);
      return { url: fallbackUrl, error: null };
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    try {
      const fallbackUrl = await readFileAsDataUrl(file);
      return { url: fallbackUrl, error: null };
    } catch {
      return { url: null, error: error.message || "Failed to upload image" };
    }
  }
}
