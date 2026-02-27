"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  vehicleDataSchema,
  type VehicleDataFormData,
} from "@/lib/validations/vehicle";
import { VEHICLE_BRANDS } from "@/lib/constants";
import type { WizardData } from "@/types/wizard";

interface Props {
  data: WizardData;
  onNext: (values: Partial<WizardData>) => void;
}

export function WizardStepData({ data, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VehicleDataFormData>({
    resolver: zodResolver(vehicleDataSchema),
    defaultValues: {
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      color: data.color,
      transmission: data.transmission,
      fuel: data.fuel,
      plate: data.plate,
      engine: data.engine,
      doors: data.doors,
    },
  });

  function onSubmit(values: VehicleDataFormData) {
    onNext(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Datos del Vehículo
      </h2>

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand">Marca</Label>
        <Select
          defaultValue={data.brand}
          onValueChange={(v) => setValue("brand", v)}
        >
          <SelectTrigger className="w-full" aria-invalid={!!errors.brand}>
            <SelectValue placeholder="Selecciona la marca" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_BRANDS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.brand && (
          <p className="text-sm text-destructive">{errors.brand.message}</p>
        )}
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Input
          id="model"
          placeholder="Ej: Corolla, Spark, Explorer"
          {...register("model")}
          aria-invalid={!!errors.model}
        />
        {errors.model && (
          <p className="text-sm text-destructive">{errors.model.message}</p>
        )}
      </div>

      {/* Year + Mileage row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <Input
            id="year"
            type="number"
            {...register("year", { valueAsNumber: true })}
            aria-invalid={!!errors.year}
          />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Kilometraje</Label>
          <Input
            id="mileage"
            type="number"
            placeholder="Ej: 85000"
            {...register("mileage", { valueAsNumber: true })}
            aria-invalid={!!errors.mileage}
          />
          {errors.mileage && (
            <p className="text-sm text-destructive">{errors.mileage.message}</p>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          placeholder="Ej: Blanco, Negro, Rojo"
          {...register("color")}
          aria-invalid={!!errors.color}
        />
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
      </div>

      {/* Transmission + Fuel row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Transmisión</Label>
          <Select
            defaultValue={data.transmission}
            onValueChange={(v) =>
              setValue("transmission", v as VehicleDataFormData["transmission"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automática</SelectItem>
              <SelectItem value="cvt">CVT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Combustible</Label>
          <Select
            defaultValue={data.fuel}
            onValueChange={(v) =>
              setValue("fuel", v as VehicleDataFormData["fuel"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gasoline">Gasolina</SelectItem>
              <SelectItem value="diesel">Diésel</SelectItem>
              <SelectItem value="electric">Eléctrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
              <SelectItem value="gas">Gas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plate + Engine + Doors row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plate">Placa</Label>
          <Input
            id="plate"
            placeholder="Opcional"
            {...register("plate")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="engine">Motor</Label>
          <Input
            id="engine"
            placeholder="Ej: 2.0L"
            {...register("engine")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doors">Puertas</Label>
          <Input
            id="doors"
            type="number"
            min={2}
            max={6}
            {...register("doors", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          Siguiente
        </Button>
      </div>
    </form>
  );
}
