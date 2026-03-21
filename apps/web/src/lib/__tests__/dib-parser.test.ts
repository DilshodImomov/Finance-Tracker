import { describe, expect, it } from "vitest";
import { parseDibEmailText } from "../dib-parser";

describe("parseDibEmailText", () => {
  it("extracts amount, merchant and posted_at", () => {
    const text =
      "Dear Customer, This is to notify you that a Purchase transaction has been initiated on 23-FEB-2026 03:07 with the following details. From ... Saving Account Amount AED 44.50 To SMILES FOOD If you have not initiated";

    const result = parseDibEmailText(text, new Date("2026-02-23T00:00:00Z"));

    expect(result).not.toBeNull();
    expect(result?.amountAed).toBe(44.5);
    expect(result?.merchant).toBe("SMILES FOOD");
    expect(result?.postedAt.toISOString()).toBe("2026-02-22T23:07:00.000Z");
  });

  it("falls back to message date when no embedded date", () => {
    const fallback = new Date("2026-02-20T10:00:00Z");
    const text = "Amount AED 12.00 To CAFE";

    const result = parseDibEmailText(text, fallback);
    expect(result?.postedAt.toISOString()).toBe(fallback.toISOString());
  });

  it("returns null when required fields are missing", () => {
    const text = "This is not a purchase notification";
    const result = parseDibEmailText(text, new Date());
    expect(result).toBeNull();
  });
});
