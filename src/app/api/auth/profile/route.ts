import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toMode, fromMode } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

const einField = z
  .union([
    z.literal(""),
    z.null(),
    z
      .string()
      .trim()
      .refine(
        (v) => /^\d{2}-?\d{7}$/.test(v),
        "EIN must be 9 digits (XX-XXXXXXX)"
      ),
  ])
  .optional();

const patchSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().optional(),
  defaultMode: z.enum(["personal", "business"]).optional(),
  businessName: z.string().trim().max(160).nullable().optional(),
  businessEmail: z.string().email().nullable().optional().or(z.literal("")),
  businessEin: einField,
  receiptCloudBackup: z.boolean().optional(),
  expoPushToken: z.string().min(1).max(512).nullable().optional(),
});

function normalizeEin(raw: string | null): string | null {
  if (raw === null || raw === "") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = patchSchema.parse(await request.json());

    if (body.email) {
      const email = body.email.toLowerCase().trim();
      const clash = await prisma.user.findFirst({
        where: { email, NOT: { id: user.id } },
        select: { id: true },
      });
      if (clash) {
        return jsonError(new Error("Email already in use"), 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.email !== undefined
          ? { email: body.email.toLowerCase().trim() }
          : {}),
        ...(body.defaultMode !== undefined
          ? { defaultMode: toMode(body.defaultMode) }
          : {}),
        ...(body.businessName !== undefined
          ? { businessName: body.businessName || null }
          : {}),
        ...(body.businessEmail !== undefined
          ? {
              businessEmail:
                body.businessEmail === "" || body.businessEmail === null
                  ? null
                  : body.businessEmail.toLowerCase().trim(),
            }
          : {}),
        ...(body.businessEin !== undefined
          ? { businessEin: normalizeEin(body.businessEin) }
          : {}),
        ...(body.receiptCloudBackup !== undefined
          ? { receiptCloudBackup: body.receiptCloudBackup }
          : {}),
        ...(body.expoPushToken !== undefined
          ? { expoPushToken: body.expoPushToken }
          : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        defaultMode: true,
        aiProfile: true,
        businessName: true,
        businessEmail: true,
        businessEin: true,
        stripeAccountId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        expoPushToken: true,
        receiptCloudBackup: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return jsonOk({
      user: { ...updated, defaultMode: fromMode(updated.defaultMode) },
    });
  } catch (error) {
    return jsonError(error);
  }
}
