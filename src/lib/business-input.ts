// Shared by the My Business form and the admin listing editor.
import type { Day, OpeningHours } from "@/lib/directory";

export type BusinessInput = {
  name: string;
  location: string;
  shortDescription: string;
  description: string;
  address: string;
  logoMediaId: string | null;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  openingHours: OpeningHours;
  termIds: string[];
};

const LIMITS: Partial<Record<keyof BusinessInput, number>> = {
  name: 120,
  location: 120,
  shortDescription: 200,
  description: 5000,
  address: 250,
  phone: 40,
  phone2: 40,
  email: 200,
  website: 300,
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Trims and checks the input; returns the columns to write or an error.
export function cleanBusiness(input: BusinessInput):
  | {
      error: string;
    }
  | {
      row: {
        name: string;
        location: string;
        short_description: string;
        description: string;
        address: string;
        logo_media_id: string | null;
        phone: string;
        phone_2: string;
        email: string;
        website: string;
        opening_hours: OpeningHours;
      };
      termIds: string[];
    } {
  const text = (key: keyof BusinessInput) =>
    String(input[key] ?? "")
      .trim()
      .replace(/\r\n/g, "\n");
  for (const [key, max] of Object.entries(LIMITS))
    if (text(key as keyof BusinessInput).length > max!)
      return { error: `That ${key} is too long.` };

  const name = text("name");
  if (!name) return { error: "Add your business name." };
  const shortDescription = text("shortDescription");
  if (!shortDescription)
    return { error: "Add a short description of your business." };
  const email = text("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "That email address doesn’t look right." };
  let website = text("website");
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website) {
    try {
      new URL(website);
    } catch {
      return { error: "That website address doesn’t look right." };
    }
  }

  const hours: OpeningHours = {};
  for (const [day, value] of Object.entries(input.openingHours ?? {})) {
    if (!value) {
      hours[day as Day] = null;
      continue;
    }
    if (!TIME.test(value.open) || !TIME.test(value.close))
      return { error: "Opening hours need both an open and a close time." };
    hours[day as Day] = { open: value.open, close: value.close };
  }

  return {
    row: {
      name,
      location: text("location"),
      short_description: shortDescription,
      description: text("description"),
      address: text("address"),
      logo_media_id: input.logoMediaId,
      phone: text("phone"),
      phone_2: text("phone2"),
      email,
      website,
      opening_hours: hours,
    },
    termIds: [...new Set(input.termIds)],
  };
}
