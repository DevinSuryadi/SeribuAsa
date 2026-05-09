import { supabase } from "@/integrations/supabase/client";

export async function uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("nutriguard-uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from("nutriguard-uploads").getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    return { url: null, error: error.message || "Failed to upload image" };
  }
}
