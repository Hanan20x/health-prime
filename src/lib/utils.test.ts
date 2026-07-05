import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges multiple plain class name strings", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("drops falsy values (undefined, null, false, empty string)", () => {
    expect(cn("px-2", undefined, null, false, "", "py-4")).toBe("px-2 py-4");
  });

  it("resolves conflicting Tailwind classes, keeping the last one (tailwind-merge)", () => {
    // p-2 and p-4 both set padding; twMerge should keep only the later class.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("applies conditional classes via object syntax (clsx)", () => {
    expect(cn("base", { "text-red-500": true, "text-blue-500": false })).toBe(
      "base text-red-500"
    );
  });

  it("returns an empty string when given no usable classes", () => {
    expect(cn(undefined, null, false)).toBe("");
  });
});
