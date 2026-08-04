import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fromMode } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Tax-ready CSV export of ledger activity.
 * IRS Pub. 583: keep supporting records for the period of limitations
 * (generally 3 years; longer in special cases). Digital records are acceptable
 * when accurate, complete, and accessible.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const modeParam = searchParams.get("mode");
    const mode =
      modeParam === "business" || modeParam === "personal"
        ? modeParam
        : undefined;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(mode
          ? {
              mode:
                mode === "business"
                  ? "BUSINESS"
                  : "PERSONAL",
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    const mileage = await prisma.mileageLog.findMany({
      where: {
        userId: user.id,
        ...(mode
          ? {
              mode:
                mode === "business"
                  ? "BUSINESS"
                  : "PERSONAL",
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    const txnHeader =
      "type,date,mode,merchant,category,amount,notes,reconciled";
    const txnRows = transactions.map((t) =>
      [
        "transaction",
        t.date.toISOString().slice(0, 10),
        fromMode(t.mode),
        escapeCsv(t.merchant),
        t.category,
        t.amount.toString(),
        escapeCsv(t.notes ?? ""),
        t.reconciled ? "yes" : "no",
      ].join(",")
    );

    const mileHeader =
      "type,date,mode,miles,purpose,from,to,gasCost,ratePerMile";
    const mileRows = mileage.map((m) =>
      [
        "mileage",
        m.date.toISOString().slice(0, 10),
        fromMode(m.mode),
        m.miles,
        escapeCsv(m.purpose),
        escapeCsv(m.fromLocation ?? ""),
        escapeCsv(m.toLocation ?? ""),
        m.gasCost?.toString() ?? "",
        m.ratePerMile.toString(),
      ].join(",")
    );

    const meta =
      mode === "business"
        ? [
            `# workspace,business`,
            `# businessName,${escapeCsv(user.businessName ?? "")}`,
            `# businessEmail,${escapeCsv(user.businessEmail ?? "")}`,
            `# EIN,${escapeCsv(user.businessEin ?? "")}`,
          ]
        : mode === "personal"
          ? [`# workspace,personal`, `# email,${escapeCsv(user.email)}`]
          : [`# workspace,all`];

    const csv = [
      "# Centsy export — retain per IRS recordkeeping guidance (Pub. 583)",
      "# Generally keep supporting records at least 3 years after filing",
      ...meta,
      "",
      txnHeader,
      ...txnRows,
      "",
      mileHeader,
      ...mileRows,
      "",
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="centsy-export-${mode ?? "all"}.csv"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
