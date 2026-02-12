import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  workspaceCreateSchema,
  inviteListSchema,
  resendVerificationSchema,
} from "../validation/auth";

// ---------------------------------------------------------------------------
// emailSchema
// ---------------------------------------------------------------------------
describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.parse("user@example.com")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(emailSchema.parse("  user@example.com  ")).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => emailSchema.parse("")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// passwordSchema
// ---------------------------------------------------------------------------
describe("passwordSchema", () => {
  const validPassword = "MyP@ss1234";

  it("accepts strong password", () => {
    expect(passwordSchema.parse(validPassword)).toBe(validPassword);
  });

  it("rejects too short (< 8 chars)", () => {
    expect(() => passwordSchema.parse("Ab1!")).toThrow("8 characters");
  });

  it("rejects too long (> 72 chars)", () => {
    expect(() => passwordSchema.parse("A1!" + "a".repeat(70))).toThrow("72 characters");
  });

  it("rejects missing lowercase", () => {
    expect(() => passwordSchema.parse("ALLCAPS1!")).toThrow("lowercase");
  });

  it("rejects missing uppercase", () => {
    expect(() => passwordSchema.parse("alllower1!")).toThrow("uppercase");
  });

  it("rejects missing digit", () => {
    expect(() => passwordSchema.parse("NoDigits!!")).toThrow("number");
  });

  it("rejects missing symbol", () => {
    expect(() => passwordSchema.parse("NoSymbol1a")).toThrow("symbol");
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  it("accepts valid login", () => {
    const data = loginSchema.parse({
      email: "user@example.com",
      password: "anything",
    });
    expect(data.email).toBe("user@example.com");
    expect(data.password).toBe("anything");
  });

  it("rejects empty password", () => {
    expect(() =>
      loginSchema.parse({ email: "user@example.com", password: "" })
    ).toThrow("required");
  });

  it("rejects invalid email", () => {
    expect(() =>
      loginSchema.parse({ email: "invalid", password: "password" })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe("registerSchema", () => {
  const validRegister = {
    email: "user@example.com",
    password: "MyP@ss1234",
    confirmPassword: "MyP@ss1234",
    fullName: "John Doe",
  };

  it("accepts valid registration", () => {
    const data = registerSchema.parse(validRegister);
    expect(data.email).toBe("user@example.com");
  });

  it("rejects mismatched passwords", () => {
    expect(() =>
      registerSchema.parse({ ...validRegister, confirmPassword: "Different1!" })
    ).toThrow("do not match");
  });

  it("allows optional fullName", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fullName: _fullName, ...noName } = validRegister;
    const data = registerSchema.parse(noName);
    expect(data.fullName).toBeUndefined();
  });

  it("rejects fullName longer than 120 chars", () => {
    expect(() =>
      registerSchema.parse({ ...validRegister, fullName: "A".repeat(121) })
    ).toThrow("too long");
  });

  it("trims email whitespace", () => {
    const data = registerSchema.parse({
      ...validRegister,
      email: "  user@example.com  ",
    });
    expect(data.email).toBe("user@example.com");
  });
});

// ---------------------------------------------------------------------------
// forgotPasswordSchema
// ---------------------------------------------------------------------------
describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const data = forgotPasswordSchema.parse({ email: "user@example.com" });
    expect(data.email).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    expect(() =>
      forgotPasswordSchema.parse({ email: "not-valid" })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------
describe("resetPasswordSchema", () => {
  it("accepts matching strong passwords", () => {
    const data = resetPasswordSchema.parse({
      password: "MyP@ss1234",
      confirmPassword: "MyP@ss1234",
    });
    expect(data.password).toBe("MyP@ss1234");
  });

  it("rejects mismatched passwords", () => {
    expect(() =>
      resetPasswordSchema.parse({
        password: "MyP@ss1234",
        confirmPassword: "Different1!",
      })
    ).toThrow("do not match");
  });

  it("validates password strength", () => {
    expect(() =>
      resetPasswordSchema.parse({
        password: "weak",
        confirmPassword: "weak",
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// resendVerificationSchema
// ---------------------------------------------------------------------------
describe("resendVerificationSchema", () => {
  it("accepts valid email + password", () => {
    const data = resendVerificationSchema.parse({
      email: "user@example.com",
      password: "anything",
    });
    expect(data.email).toBe("user@example.com");
  });

  it("rejects empty password", () => {
    expect(() =>
      resendVerificationSchema.parse({
        email: "user@example.com",
        password: "",
      })
    ).toThrow("required");
  });
});

// ---------------------------------------------------------------------------
// workspaceCreateSchema
// ---------------------------------------------------------------------------
describe("workspaceCreateSchema", () => {
  it("accepts valid workspace", () => {
    const data = workspaceCreateSchema.parse({
      name: "My Workspace",
      slug: "my-workspace",
      workspaceType: "team",
    });
    expect(data.name).toBe("My Workspace");
    expect(data.slug).toBe("my-workspace");
    expect(data.workspaceType).toBe("team");
  });

  it("lowercases slug", () => {
    const data = workspaceCreateSchema.parse({
      name: "Test",
      slug: "MY-SLUG",
      workspaceType: "individual",
    });
    expect(data.slug).toBe("my-slug");
  });

  it("rejects slug too short", () => {
    expect(() =>
      workspaceCreateSchema.parse({
        name: "Test",
        slug: "ab",
        workspaceType: "individual",
      })
    ).toThrow();
  });

  it("rejects slug too long (> 32 chars)", () => {
    expect(() =>
      workspaceCreateSchema.parse({
        name: "Test",
        slug: "a".repeat(33),
        workspaceType: "individual",
      })
    ).toThrow();
  });

  it("rejects slug with spaces or special chars", () => {
    expect(() =>
      workspaceCreateSchema.parse({
        name: "Test",
        slug: "my slug!",
        workspaceType: "individual",
      })
    ).toThrow();
  });

  it("rejects invalid workspaceType", () => {
    expect(() =>
      workspaceCreateSchema.parse({
        name: "Test",
        slug: "my-slug",
        workspaceType: "enterprise",
      })
    ).toThrow();
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() =>
      workspaceCreateSchema.parse({
        name: "A",
        slug: "my-slug",
        workspaceType: "individual",
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// inviteListSchema
// ---------------------------------------------------------------------------
describe("inviteListSchema", () => {
  it("accepts valid email list", () => {
    const data = inviteListSchema.parse({
      emails: ["a@b.com", "c@d.com"],
    });
    expect(data.emails).toHaveLength(2);
  });

  it("defaults to empty array when emails omitted", () => {
    const data = inviteListSchema.parse({});
    expect(data.emails).toEqual([]);
  });

  it("rejects more than 10 emails", () => {
    const emails = Array.from({ length: 11 }, (_, i) => `user${i}@test.com`);
    expect(() => inviteListSchema.parse({ emails })).toThrow("10");
  });

  it("validates individual emails in the array", () => {
    expect(() =>
      inviteListSchema.parse({ emails: ["valid@email.com", "not-valid"] })
    ).toThrow();
  });
});
