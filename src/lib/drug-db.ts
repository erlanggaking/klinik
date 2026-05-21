/**
 * Built-in drug knowledge base (subset) untuk klinik kecantikan.
 * Mendukung:
 *  - Drug interaction warning antar obat dalam resep.
 *  - Allergy cross-check (dengan keyword di Patient.knownAllergies).
 *  - Kontraindikasi umum (kehamilan, fotosensitif, dsb).
 *
 * Ini built-in untuk top obat dermatology. Untuk produksi yang lebih lengkap,
 * pakai database komersial (Lexicomp, MIMS, BNF).
 */

export type DrugInfo = {
  /** Match by lowercased substring of the drug name. */
  match: string[];
  /** Active ingredient(s) — also used for allergy match. */
  ingredients: string[];
  /** Class for interaction grouping. */
  classes: string[];
  /** Severe contraindications (kehamilan, anak-anak, dll). */
  contraindications: string[];
  /** Free-form warning lines. */
  warnings: string[];
};

export const DRUG_DB: DrugInfo[] = [
  {
    match: ["tretinoin", "retin-a", "retin a"],
    ingredients: ["tretinoin", "vitamin a acid"],
    classes: ["retinoid", "topical"],
    contraindications: ["kehamilan", "menyusui"],
    warnings: [
      "Hindari paparan matahari langsung. Wajib pakai sunscreen.",
      "Tidak boleh bersamaan dengan benzoyl peroxide pada waktu yang sama (dapat menonaktifkan).",
      "Kontraindikasi pada kehamilan & menyusui.",
    ],
  },
  {
    match: ["isotretinoin", "roaccutane", "acnetane"],
    ingredients: ["isotretinoin"],
    classes: ["retinoid", "systemic"],
    contraindications: ["kehamilan", "menyusui"],
    warnings: [
      "TERATOGENIK BERAT — wajib kontrasepsi 1 bulan sebelum, selama, dan 1 bulan setelah terapi.",
      "Monitor fungsi hati & profil lipid.",
      "Hindari donor darah selama terapi & 1 bulan sesudahnya.",
    ],
  },
  {
    match: ["adapalene", "differin"],
    ingredients: ["adapalene"],
    classes: ["retinoid", "topical"],
    contraindications: ["kehamilan"],
    warnings: ["Hindari paparan matahari. Iritasi & kemerahan ringan adalah normal."],
  },
  {
    match: ["hydroquinone", "hidrokuinon"],
    ingredients: ["hydroquinone"],
    classes: ["depigmenting"],
    contraindications: [],
    warnings: [
      "Pemakaian jangka panjang (>3 bulan) berisiko ochronosis.",
      "Wajib sunscreen ketat.",
    ],
  },
  {
    match: ["benzoyl peroxide", "bp"],
    ingredients: ["benzoyl peroxide"],
    classes: ["antibacterial", "topical"],
    contraindications: [],
    warnings: [
      "Dapat memutihkan handuk, baju, & rambut.",
      "Tidak boleh bersamaan dengan tretinoin di waktu yang sama.",
    ],
  },
  {
    match: ["clindamycin", "klindamisin"],
    ingredients: ["clindamycin"],
    classes: ["antibiotic", "lincosamide", "topical"],
    contraindications: ["alergi clindamycin", "alergi lincomycin"],
    warnings: ["Resistance risk — gunakan kombinasi dengan benzoyl peroxide untuk hindari resistensi."],
  },
  {
    match: ["erythromycin", "eritromisin"],
    ingredients: ["erythromycin"],
    classes: ["antibiotic", "macrolide"],
    contraindications: ["alergi makrolida"],
    warnings: ["Resistance risk pada acne — pertimbangkan kombinasi BP."],
  },
  {
    match: ["doxycycline", "doksisiklin"],
    ingredients: ["doxycycline"],
    classes: ["antibiotic", "tetracycline", "systemic"],
    contraindications: ["kehamilan", "menyusui", "anak <8 tahun"],
    warnings: [
      "Fotosensitif — wajib hindari matahari & pakai sunscreen.",
      "Hindari konsumsi bersama susu/produk kalsium (mengurangi penyerapan).",
    ],
  },
  {
    match: ["minocycline", "minosiklin"],
    ingredients: ["minocycline"],
    classes: ["antibiotic", "tetracycline", "systemic"],
    contraindications: ["kehamilan", "menyusui", "anak <8 tahun"],
    warnings: ["Risiko hiperpigmentasi pada penggunaan jangka panjang."],
  },
  {
    match: ["azelaic acid", "azelaic"],
    ingredients: ["azelaic acid"],
    classes: ["antibacterial", "depigmenting", "topical"],
    contraindications: [],
    warnings: ["Aman untuk kehamilan. Iritasi ringan & rasa terbakar adalah normal."],
  },
  {
    match: ["niacinamide"],
    ingredients: ["niacinamide", "nicotinamide"],
    classes: ["antioxidant"],
    contraindications: [],
    warnings: ["Umumnya aman. Hindari kombinasi dengan vitamin C konsentrasi tinggi pada waktu sama."],
  },
  {
    match: ["vitamin c", "ascorbic acid", "asam askorbat"],
    ingredients: ["ascorbic acid"],
    classes: ["antioxidant"],
    contraindications: [],
    warnings: ["Stabilitas rendah — simpan terlindung dari cahaya."],
  },
  {
    match: ["hydrocortisone", "betamethasone", "mometasone", "desoximetasone", "fluocinonide"],
    ingredients: ["corticosteroid"],
    classes: ["corticosteroid", "topical"],
    contraindications: [],
    warnings: [
      "Pemakaian wajah jangka panjang berisiko atrofi kulit & telangiektasia.",
      "Tidak untuk infeksi jamur/virus.",
    ],
  },
  {
    match: ["fluconazole"],
    ingredients: ["fluconazole"],
    classes: ["antifungal", "azole", "systemic"],
    contraindications: ["kehamilan"],
    warnings: ["Banyak interaksi obat — cek riwayat obat pasien."],
  },
  {
    match: ["ketoconazole", "ketokonazol"],
    ingredients: ["ketoconazole"],
    classes: ["antifungal", "azole"],
    contraindications: [],
    warnings: ["Topikal: aman. Sistemik: monitor fungsi hati."],
  },
  {
    match: ["acyclovir", "asiklovir"],
    ingredients: ["acyclovir"],
    classes: ["antiviral"],
    contraindications: [],
    warnings: ["Sesuaikan dosis pada gangguan ginjal."],
  },
  {
    match: ["botox", "botulinum"],
    ingredients: ["botulinum toxin"],
    classes: ["neurotoxin", "injection"],
    contraindications: ["kehamilan", "menyusui", "myasthenia gravis"],
    warnings: ["Tidak digabung dengan aminoglikosida (perpanjang efek)."],
  },
  {
    match: ["filler", "hyaluronic acid", "ha"],
    ingredients: ["hyaluronic acid"],
    classes: ["filler", "injection"],
    contraindications: ["alergi lidocaine (kalau filler dengan lidocaine)"],
    warnings: ["Risiko vascular occlusion — pastikan kompetensi injektor."],
  },
];

export type RxLine = { name: string; itemId?: string | null };

export type DrugWarning = {
  level: "info" | "warning" | "danger";
  message: string;
  source?: string;
};

/** Lookup informasi obat berdasarkan nama. */
export function lookupDrug(name: string): DrugInfo | null {
  const lc = (name ?? "").toLowerCase();
  if (!lc) return null;
  for (const d of DRUG_DB) {
    if (d.match.some((m) => lc.includes(m))) return d;
  }
  return null;
}

/**
 * Cek warning untuk satu resep:
 *  - Contraindication match dengan kondisi pasien (kehamilan, alergi).
 *  - Class duplication / antagonism antar item.
 *  - Allergy cross-match dengan Patient.knownAllergies.
 */
export function checkPrescriptionWarnings(args: {
  lines: RxLine[];
  patient?: { knownAllergies?: string | null; gender?: string | null };
  pregnant?: boolean;
}): DrugWarning[] {
  const warnings: DrugWarning[] = [];
  const drugs = args.lines
    .map((l) => ({ line: l, info: lookupDrug(l.name) }))
    .filter((x) => x.info) as { line: RxLine; info: DrugInfo }[];

  // 1) Allergy cross-check
  const allergyText = (args.patient?.knownAllergies ?? "").toLowerCase();
  if (allergyText) {
    for (const d of drugs) {
      for (const ing of d.info.ingredients) {
        if (allergyText.includes(ing.toLowerCase())) {
          warnings.push({
            level: "danger",
            message: `Pasien tercatat alergi terhadap "${ing}", obat "${d.line.name}" mengandung bahan tersebut.`,
            source: "allergy",
          });
        }
      }
    }
  }

  // 2) Pregnancy contraindication
  if (args.pregnant || allergyText.includes("hamil")) {
    for (const d of drugs) {
      if (d.info.contraindications.some((c) => c.includes("kehamilan"))) {
        warnings.push({
          level: "danger",
          message: `"${d.line.name}" kontraindikasi pada kehamilan.`,
          source: "pregnancy",
        });
      }
    }
  }

  // 3) Class antagonism
  const hasRetinoid = drugs.some((d) => d.info.classes.includes("retinoid") && d.info.classes.includes("topical"));
  const hasBP = drugs.some((d) => d.info.match.some((m) => m.includes("benzoyl peroxide")));
  if (hasRetinoid && hasBP) {
    warnings.push({
      level: "warning",
      message: "Kombinasi retinoid topikal + benzoyl peroxide — gunakan di waktu berbeda (BP pagi, retinoid malam).",
      source: "interaction",
    });
  }

  // 4) Multiple antibiotics same class
  const antibioticClasses = new Map<string, string[]>();
  for (const d of drugs) {
    if (d.info.classes.includes("antibiotic")) {
      for (const c of d.info.classes) {
        if (c !== "antibiotic" && c !== "topical" && c !== "systemic") {
          antibioticClasses.set(c, [...(antibioticClasses.get(c) ?? []), d.line.name]);
        }
      }
    }
  }
  for (const [c, names] of antibioticClasses.entries()) {
    if (names.length > 1) {
      warnings.push({
        level: "warning",
        message: `Beberapa antibiotik dari kelas ${c}: ${names.join(", ")}. Cek perlunya kombinasi.`,
        source: "interaction",
      });
    }
  }

  // 5) Each drug's general warning (info)
  for (const d of drugs) {
    for (const w of d.info.warnings) {
      warnings.push({ level: "info", message: `${d.line.name}: ${w}`, source: "info" });
    }
  }

  return warnings;
}
