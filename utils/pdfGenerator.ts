import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ECF_FACTOR_DEFINITIONS,
  EstimationInput,
  EstimationResult,
  TCF_FACTOR_DEFINITIONS,
  VAF_FACTOR_DEFINITIONS,
} from "@/types/estimation";
import { formatCurrency, formatHours } from "@/utils/estimationEngine";

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(161, 161, 170);
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
  return y + 10;
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(63, 63, 70);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5 + 4;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

/**
 * Generates a professional PDF estimation report and triggers a browser download.
 */
export function generateEstimationReport(
  input: EstimationInput,
  results: EstimationResult
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sym = results.parameters.currencySymbol;
  const generated = new Date(results.generatedAt).toLocaleString();

  // Header band
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, PAGE_WIDTH, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Software Estimation Report", MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(results.projectName || "Untitled Project", MARGIN, 22);
  doc.text(`Generated: ${generated}`, MARGIN, 28);

  let y = 42;

  y = addSectionTitle(doc, "1. Project Overview", y);
  y = addParagraph(
    doc,
    `This report summarizes Function Point (IFPUG) and Use Case Point (UCP) estimates for "${results.projectName}". ` +
      `Productivity assumptions: ${results.parameters.hoursPerFP} h/FP and ${results.parameters.hoursPerUCP} h/UCP. ` +
      `Hourly rate: ${formatCurrency(results.parameters.hourlyRate, sym)}.`,
    y
  );

  y = ensureSpace(doc, y, 50);
  y = addSectionTitle(doc, "2. Final Results", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Metric", "Function Points", "Use Case Points", "Blended"]],
    body: [
      [
        "Size",
        results.functionPoints.adjustedFP.toFixed(1) + " FP",
        results.useCasePoints.adjustedUCP.toFixed(1) + " UCP",
        "—",
      ],
      [
        "Effort",
        formatHours(results.effort.fpHours),
        formatHours(results.effort.ucpHours),
        formatHours(results.effort.blendedHours),
      ],
      [
        "Person-Days (8h)",
        results.effort.fpPersonDays.toFixed(1),
        results.effort.ucpPersonDays.toFixed(1),
        results.effort.blendedPersonDays.toFixed(1),
      ],
      [
        "Cost",
        formatCurrency(results.cost.fpCost, sym),
        formatCurrency(results.cost.ucpCost, sym),
        formatCurrency(results.cost.blendedCost, sym),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [39, 39, 42], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 12;

  y = ensureSpace(doc, y, 40);
  y = addSectionTitle(doc, "3. Function Point Analysis", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Function Type", "Simple", "Average", "Complex", "Points"]],
    body: [
      fpRow("External Inputs (EI)", input.functionPoints.ei, results.functionPoints.byType.ei),
      fpRow("External Outputs (EO)", input.functionPoints.eo, results.functionPoints.byType.eo),
      fpRow("External Inquiries (EQ)", input.functionPoints.eq, results.functionPoints.byType.eq),
      fpRow("Internal Logical Files (ILF)", input.functionPoints.ilf, results.functionPoints.byType.ilf),
      fpRow("External Interface Files (EIF)", input.functionPoints.eif, results.functionPoints.byType.eif),
    ],
    foot: [
      [
        "Totals",
        "",
        "",
        "",
        `UFP: ${results.functionPoints.ufp} | VAF: ${results.functionPoints.vafMultiplier.toFixed(3)} | FP: ${results.functionPoints.adjustedFP.toFixed(1)}`,
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [63, 63, 70] },
    footStyles: { fillColor: [244, 244, 245], textColor: [24, 24, 27], fontStyle: "bold" },
    styles: { fontSize: 8 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  y = ensureSpace(doc, y, 60);
  y = addSectionTitle(doc, "4. Value Adjustment Factors (VAF)", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "General System Characteristic", "Rating (0–5)"]],
    body: VAF_FACTOR_DEFINITIONS.map((f, i) => [
      String(i + 1),
      f.label,
      String(input.vaf[f.id as keyof typeof input.vaf] ?? 0),
    ]),
    foot: [["", `Sum of ratings: ${results.functionPoints.vafSum}`, ""]],
    theme: "plain",
    headStyles: { fillColor: [82, 82, 91] },
    styles: { fontSize: 8 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  doc.addPage();
  y = MARGIN + 6;
  y = addSectionTitle(doc, "5. Use Case Point Analysis", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Category", "Simple", "Average", "Complex", "Points"]],
    body: [
      [
        "Actors",
        String(input.useCasePoints.actors.simple),
        String(input.useCasePoints.actors.average),
        String(input.useCasePoints.actors.complex),
        String(results.useCasePoints.actorPoints),
      ],
      [
        "Use Cases",
        String(input.useCasePoints.useCases.simple),
        String(input.useCasePoints.useCases.average),
        String(input.useCasePoints.useCases.complex),
        String(results.useCasePoints.useCasePoints),
      ],
    ],
    foot: [
      [
        "Adjusted UCP",
        "",
        "",
        "",
        `UUCP: ${results.useCasePoints.uucp} × TCF: ${results.useCasePoints.tcf.toFixed(3)} × ECF: ${results.useCasePoints.ecf.toFixed(3)} = ${results.useCasePoints.adjustedUCP.toFixed(1)}`,
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [63, 63, 70] },
    footStyles: { fillColor: [244, 244, 245], fontStyle: "bold" },
    styles: { fontSize: 8 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  y = addSectionTitle(doc, "6. Technical Complexity Factors (TCF)", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Factor", "Rating (0–5)"]],
    body: TCF_FACTOR_DEFINITIONS.map((f) => [
      f.label,
      String(input.useCasePoints.tcf[f.id as keyof typeof input.useCasePoints.tcf] ?? 0),
    ]),
    foot: [[`TCF = 0.6 + 0.01 × ${results.useCasePoints.tcfSum}`, results.useCasePoints.tcf.toFixed(3)]],
    theme: "plain",
    styles: { fontSize: 8 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  y = ensureSpace(doc, y, 50);
  y = addSectionTitle(doc, "7. Environmental Complexity Factors (ECF)", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Factor", "Rating (0–5)"]],
    body: ECF_FACTOR_DEFINITIONS.map((f) => [
      f.label,
      String(input.useCasePoints.ecf[f.id as keyof typeof input.useCasePoints.ecf] ?? 0),
    ]),
    foot: [[`ECF = 1.4 − 0.03 × ${results.useCasePoints.ecfSum}`, results.useCasePoints.ecf.toFixed(3)]],
    theme: "plain",
    styles: { fontSize: 8 },
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(
      `Vibe Code Estimation · Page ${i} of ${pageCount}`,
      PAGE_WIDTH / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const safeName = (results.projectName || "estimation")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .toLowerCase();
  doc.save(`${safeName}_estimation_report.pdf`);
}

function fpRow(
  label: string,
  counts: { simple: number; average: number; complex: number },
  points: number
): string[] {
  return [
    label,
    String(counts.simple),
    String(counts.average),
    String(counts.complex),
    String(points),
  ];
}
