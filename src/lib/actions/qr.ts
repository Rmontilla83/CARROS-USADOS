"use server";

import { createClient } from "@/lib/supabase/server";
import { generateVinylPng } from "@/lib/qr/vinyl-template";
import { APP_URL } from "@/lib/constants";
import type { Vehicle, QrOrder } from "@/types";

interface GenerateVinylResult {
  success: boolean;
  vinylUrl?: string;
  qrOrderId?: string;
  error?: string;
}

/**
 * Generate a vinyl sticker image for a vehicle, upload to Supabase Storage,
 * and create a qr_orders record.
 */
export async function generateVinyl(
  vehicleId: string
): Promise<GenerateVinylResult> {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Fetch the vehicle (must belong to the user)
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (vehicleError || !vehicle) {
    return { success: false, error: "Vehículo no encontrado" };
  }

  const typedVehicle = vehicle as Vehicle;

  // Check if a QR order already exists for this vehicle
  const { data: existingOrder } = await supabase
    .from("qr_orders")
    .select("id, qr_image_url")
    .eq("vehicle_id", vehicleId)
    .single();

  if (existingOrder) {
    const typedOrder = existingOrder as Pick<QrOrder, "id" | "qr_image_url">;
    return {
      success: true,
      vinylUrl: typedOrder.qr_image_url || undefined,
      qrOrderId: typedOrder.id,
    };
  }

  // Generate the vinyl PNG
  const vinylBuffer = await generateVinylPng({
    slug: typedVehicle.slug,
  });

  // Upload to Supabase Storage
  const storagePath = `vinyl/${vehicleId}/${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("qr-codes")
    .upload(storagePath, vinylBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    console.error("Vinyl upload error:", uploadError);
    return { success: false, error: "Error al subir el vinil. Intenta de nuevo." };
  }

  // Build public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const vinylUrl = `${supabaseUrl}/storage/v1/object/public/qr-codes/${storagePath}`;
  const qrUrl = `${APP_URL}/${typedVehicle.slug}`;

  // Create qr_orders record
  const { data: qrOrder, error: orderError } = await supabase
    .from("qr_orders")
    .insert({
      vehicle_id: vehicleId,
      qr_url: qrUrl,
      qr_image_url: vinylUrl,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("QR order creation error:", orderError);
    return { success: false, error: "Error al crear la orden de QR." };
  }

  return {
    success: true,
    vinylUrl,
    qrOrderId: (qrOrder as { id: string }).id,
  };
}

/**
 * Get the vinyl URL for a vehicle (if already generated).
 */
export async function getVinylUrl(
  vehicleId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("qr_orders")
    .select("qr_image_url")
    .eq("vehicle_id", vehicleId)
    .single();

  if (!data) return null;
  return (data as Pick<QrOrder, "qr_image_url">).qr_image_url;
}
