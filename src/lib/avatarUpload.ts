import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 800; // Max width/height for avatar

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
const resizeImage = (file: File, maxDimension: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Upload avatar to Supabase Storage
 */
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Por favor, selecione uma imagem válida",
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "A imagem deve ter no máximo 2MB",
      };
    }

    // Resize image
    const resizedBlob = await resizeImage(file, MAX_DIMENSION);

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, resizedBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return {
        success: false,
        error: "Erro ao fazer upload da imagem",
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return {
        success: false,
        error: "Erro ao atualizar perfil",
      };
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      success: false,
      error: "Erro inesperado ao processar a imagem",
    };
  }
};

/**
 * Delete avatar from Supabase Storage
 */
export const deleteAvatar = async (userId: string): Promise<boolean> => {
  try {
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `${userId}/${f.name}`);
      const { error } = await supabase.storage
        .from("avatars")
        .remove(filesToDelete);

      if (error) {
        console.error("Delete error:", error);
        return false;
      }
    }

    // Update profile to remove avatar URL
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", userId);

    return true;
  } catch (error) {
    console.error("Avatar delete error:", error);
    return false;
  }
};
