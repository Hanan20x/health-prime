import { describe, it, expect } from "vitest";
import { tx, txGender, txStatus, txSpecialty, txRole, txRelativeTime } from "./i18n";

describe("tx", () => {
  it("returns the English string for lang='en'", () => {
    expect(tx("appTitle", "en")).toBe("Health Prime");
  });

  it("returns the Arabic string for lang='ar'", () => {
    expect(tx("appTitle", "ar")).toBe("مركز الرعاية الصحية الأولية بمحافظة الريث");
  });

  it("falls back to the raw key when the key isn't in the dictionary", () => {
    // @ts-expect-error - intentionally passing a key that doesn't exist
    expect(tx("thisKeyDoesNotExist", "en")).toBe("thisKeyDoesNotExist");
  });
});

describe("txGender", () => {
  it("returns an em dash for null/undefined input", () => {
    expect(txGender(null, "en")).toBe("—");
    expect(txGender(undefined, "en")).toBe("—");
  });

  it("translates 'male' and 'female' regardless of case", () => {
    expect(txGender("male", "en")).toBe("Male");
    expect(txGender("MALE", "ar")).toBe("ذكر");
    expect(txGender("Female", "en")).toBe("Female");
    expect(txGender("female", "ar")).toBe("أنثى");
  });

  it("falls back to the lowercased raw value for an unrecognised gender", () => {
    expect(txGender("Other", "en")).toBe("other");
  });
});

describe("txStatus", () => {
  it("returns an em dash for a null/undefined status", () => {
    expect(txStatus(null, "en")).toBe("—");
  });

  it("maps known EMR/patient statuses to their translated label", () => {
    expect(txStatus("Registered", "en")).toBe("Registered");
    expect(txStatus("Registered", "ar")).toBe("مسجل");
    expect(txStatus("In Progress", "ar")).toBe("قيد المعالجة");
    expect(txStatus("Active", "ar")).toBe("نشط");
  });

  it("returns the raw value unchanged for an unmapped status", () => {
    expect(txStatus("SomeUnknownStatus", "en")).toBe("SomeUnknownStatus");
  });
});

describe("txSpecialty", () => {
  it("returns an em dash for a null/undefined specialty", () => {
    expect(txSpecialty(undefined, "en")).toBe("—");
  });

  it("maps known specialties case-insensitively", () => {
    expect(txSpecialty("family", "en")).toBe("Family Medicine");
    expect(txSpecialty("Family", "ar")).toBe("طب الأسرة");
  });

  it("returns the raw value unchanged for an unmapped specialty", () => {
    expect(txSpecialty("Cardiology", "en")).toBe("Cardiology");
  });
});

describe("txRole", () => {
  it("maps the four known roles to their translated label", () => {
    expect(txRole("Doctor", "ar")).toBe("طبيب");
    expect(txRole("Nurse", "ar")).toBe("ممرض/ة");
    expect(txRole("E-Health Admin", "en")).toBe("E-Health Admin");
    expect(txRole("Staff", "en")).toBe("Staff");
  });

  it("returns the raw value unchanged for an unmapped role", () => {
    expect(txRole("SomeOtherRole", "en")).toBe("SomeOtherRole");
  });
});

describe("txRelativeTime", () => {
  it("returns the string unchanged for lang='en'", () => {
    expect(txRelativeTime("5 mins ago", "en")).toBe("5 mins ago");
  });

  it("translates a minutes string into Arabic for lang='ar'", () => {
    expect(txRelativeTime("5 mins ago", "ar")).toBe("منذ 5 دقيقة");
  });

  it("translates an hours string into Arabic, mapping 'hr' to the hrRelative key", () => {
    expect(txRelativeTime("1 hr ago", "ar")).toBe("منذ 1 ساعة");
  });

  it("translates a days string into Arabic", () => {
    expect(txRelativeTime("3 days ago", "ar")).toBe("منذ 3 يوم");
  });

  it("returns the input unchanged if it doesn't match the expected 3-part format", () => {
    expect(txRelativeTime("just now", "ar")).toBe("just now");
  });
});
