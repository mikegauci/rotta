// The "vehicle details" icons on a marketplace page, in display order.
// Icons are in public/marketplace/icons/ (copied from the old theme).

export const VEHICLE_FEATURES = [
  { key: "transmission", label: "Transmission" },
  { key: "engine_size", label: "Engine size" },
  { key: "owners", label: "Owners" },
  { key: "doors", label: "Doors" },
  { key: "mileage", label: "Mileage" },
  { key: "local", label: "Local / import" },
  { key: "mpg", label: "MPG" },
  { key: "seats", label: "Seats" },
  { key: "fuel", label: "Fuel" },
  { key: "body_type", label: "Body type" },
  { key: "engine_number", label: "Engine number" },
  { key: "chassis_number", label: "Chassis number" },
  { key: "vehicle_financing", label: "Financing" },
  { key: "interior_colour", label: "Interior colour" },
  { key: "body_colour", label: "Body colour" },
  { key: "insurance", label: "Insurance" },
  { key: "license", label: "Licence" },
  { key: "warranty", label: "Warranty" },
] as const;

export const TRANSMISSIONS = ["automatic", "manual"] as const;

export const BODY_TYPES = [
  { value: "convertible", label: "Convertible" },
  { value: "coupe", label: "Coupe" },
  { value: "crossover", label: "Crossover" },
  { value: "minivan", label: "Minivan" },
  { value: "pickup", label: "Pickup" },
  { value: "saloon", label: "Saloon" },
  { value: "sportscar", label: "Sportscar" },
  { value: "suv", label: "SUV" },
  { value: "wagon", label: "Wagon" },
] as const;

// Icon file and text for one shown feature.
export function featureDisplay(key: string, value: string) {
  if (key === "transmission") {
    const manual = value === "manual";
    return {
      icon: manual ? "manual" : "automatic",
      text: manual ? "Manual" : "Automatic",
    };
  }
  if (key === "body_type") {
    const body =
      BODY_TYPES.find((b) => b.value === value) ?? BODY_TYPES.at(-1)!;
    return { icon: body.value, text: body.label };
  }
  return { icon: key, text: value };
}
