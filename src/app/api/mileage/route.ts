import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fromMode, listMileage, toMode, decimalToNumber } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { format } from "date-fns";

const createSchema = z.object({
  mode: z.enum(["personal", "business"]),
  date: z.string().min(4),
  miles: z.number().positive(),
  purpose: z.string().min(1),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  gasCost: z.number().nonnegative().optional(),
  ratePerMile: z.number().positive().default(0.7),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const mode = toMode(new URL(request.url).searchParams.get("mode"));
    const logs = await listMileage(user.id, mode);
    return jsonOk({ logs });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = createSchema.parse(await request.json());
    const log = await prisma.mileageLog.create({
      data: {
        userId: user.id,
        mode: toMode(body.mode),
        date: new Date(body.date),
        miles: body.miles,
        purpose: body.purpose,
        fromLocation: body.fromLocation,
        toLocation: body.toLocation,
        gasCost: body.gasCost,
        ratePerMile: body.ratePerMile,
      },
    });

    return jsonOk(
      {
        log: {
          id: log.id,
          mode: fromMode(log.mode),
          date: format(log.date, "yyyy-MM-dd"),
          miles: log.miles,
          purpose: log.purpose,
          fromLocation: log.fromLocation ?? undefined,
          toLocation: log.toLocation ?? undefined,
          gasCost: log.gasCost != null ? decimalToNumber(log.gasCost) : undefined,
          ratePerMile: decimalToNumber(log.ratePerMile),
          createdAt: log.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
