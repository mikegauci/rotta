import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanBusiness } from "../src/lib/business-input.ts";

const listing = {
  name: "Test Garage",
  shortDescription: "Servicing classic cars in Malta",
  description: "",
  location: "",
  address: "",
  logoMediaId: null,
  phone: "",
  phone2: "",
  email: "",
  website: "",
  openingHours: {},
  termIds: [],
};

test("business name and short description reject empty and whitespace-only submissions", () => {
  for (const key of ["name", "shortDescription"]) {
    for (const value of ["", " \n\t "]) {
      assert.ok("error" in cleanBusiness({ ...listing, [key]: value }));
    }
  }
});

test("a business can use its default logo and leave optional fields empty", () => {
  const result = cleanBusiness({
    ...listing,
    name: "  Test Garage  ",
    shortDescription: "  Servicing classic cars in Malta  ",
  });
  assert.ok(!("error" in result));
  assert.equal(result.row.name, listing.name);
  assert.equal(result.row.short_description, listing.shortDescription);
  assert.equal(result.row.logo_media_id, null);
});

test("short description accepts the maximum length and rejects longer descriptions", () => {
  assert.ok(
    !(
      "error" in
      cleanBusiness({ ...listing, shortDescription: "x".repeat(200) })
    ),
  );
  assert.ok(
    "error" in cleanBusiness({ ...listing, shortDescription: "x".repeat(201) }),
  );
});
