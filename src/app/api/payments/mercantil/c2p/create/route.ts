import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMercantilC2PConfigured, createC2PCharge } from "@/lib/payments/mercantil-c2p";
import { getBcvRate } from "@/lib/payments/bcv-rate";
import { PUBLICATION_PRICE_USD } from "@/lib/constants";
import type { Vehicle } from "@/types";

type VehicleRow = Pick<Vehicle, "id" | "brand" | "model" | "year" | "status" | "user_id">;

export async function POST(request: Request) {
  if (!isMercantilC2PConfigured()) {
    return NextResponse.json(
      { error: "Pago Móvil no disponible por el momento" },
      { status: 503 }
    );
  }

  try {
    const { vehicleId, phone, bankCode, cedula } = await request.json();

    if (!vehicleId || !phone || !bankCode || !cedula) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, status, user_id")
      .eq("id", vehicleId)
      .single();

    const typedVehicle = vehicle as VehicleRow | null;

    if (!typedVehicle || typedVehicle.user_id !== user.id) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    if (typedVehicle.status !== "draft") {
      return NextResponse.json({ error: "Este vehículo ya fue publicado" }, { status: 400 });
    }

    const bcvRate = await getBcvRate();
    const amountVes = PUBLICATION_PRICE_USD * bcvRate;
    const vehicleTitle = `${typedVehicle.brand} ${typedVehicle.model} ${typedVehicle.year}`;

    // Create payment record
    const adminClient = createAdminClient();
    const { data: payment, error: paymentError } = await adminClient
      .from("payments")
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        amount: PUBLICATION_PRICE_USD,
        currency: "USD",
        method: "mercantil_c2p",
        status: "pending",
        bcv_rate: bcvRate,
        amount_ves: amountVes,
        description: `Publicación — ${vehicleTitle}`,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Payment insert error:", paymentError);
      return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
    }

    // Create C2P charge
    const result = await createC2PCharge({
      amountVes,
      phone,
      bankCode,
      cedula,
      paymentId: payment.id,
    });

    // Store transaction ID
    await adminClient
      .from("payments")
      .update({ mercantil_transaction_id: result.transactionId })
      .eq("id", payment.id);

    return NextResponse.json({
      paymentId: payment.id,
      transactionId: result.transactionId,
      status: result.status,
    });
  } catch (err) {
    console.error("Mercantil C2P create error:", err);
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}
