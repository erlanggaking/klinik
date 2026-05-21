/**
 * ICD-10 subset relevant untuk klinik kecantikan / dermatology.
 * Sumber: WHO ICD-10 (kategori L = Diseases of skin and subcutaneous tissue),
 * plus beberapa Z (factors influencing health) yang sering dipakai untuk
 * konsultasi estetik.
 *
 * Ini bukan kamus medis lengkap. Untuk klinik umum, pakai database lengkap
 * (CSV publik dari Kemkes RI atau WHO).
 */

export type Icd10Entry = { code: string; label: string };

export const ICD10_DERMATOLOGY: Icd10Entry[] = [
  // L00–L08 Infections of the skin and subcutaneous tissue
  { code: "L00", label: "Sindrom kulit terkelupas (staphylococcal scalded skin)" },
  { code: "L01.0", label: "Impetigo" },
  { code: "L02.0", label: "Abses, furunkel & carbuncle pada wajah" },
  { code: "L02.2", label: "Abses, furunkel & carbuncle pada badan" },
  { code: "L03.0", label: "Selulitis pada jari tangan/kaki" },
  { code: "L03.1", label: "Selulitis pada bagian lain ekstremitas" },
  { code: "L08.0", label: "Pioderma" },
  { code: "L08.9", label: "Infeksi kulit lokal, tidak dirinci" },

  // L20–L30 Dermatitis and eczema
  { code: "L20.9", label: "Dermatitis atopik, tidak dirinci" },
  { code: "L21.0", label: "Seborrhea capitis" },
  { code: "L21.9", label: "Dermatitis seboroik, tidak dirinci" },
  { code: "L23.9", label: "Dermatitis kontak alergi, tidak dirinci" },
  { code: "L24.9", label: "Dermatitis kontak iritan, tidak dirinci" },
  { code: "L25.9", label: "Dermatitis kontak tidak dirinci" },
  { code: "L29.9", label: "Pruritus, tidak dirinci" },
  { code: "L30.9", label: "Dermatitis, tidak dirinci" },

  // L40–L45 Papulosquamous disorders
  { code: "L40.0", label: "Psoriasis vulgaris" },
  { code: "L40.9", label: "Psoriasis, tidak dirinci" },
  { code: "L43.9", label: "Liken planus, tidak dirinci" },

  // L50–L54 Urticaria and erythema
  { code: "L50.0", label: "Urtikaria alergi" },
  { code: "L50.9", label: "Urtikaria, tidak dirinci" },
  { code: "L53.9", label: "Erythematous condition, tidak dirinci" },

  // L55–L59 Radiation-related disorders of the skin
  { code: "L55.9", label: "Sunburn, tidak dirinci" },
  { code: "L56.9", label: "Akut perubahan kulit akibat sinar ultraviolet, tidak dirinci" },
  { code: "L57.0", label: "Keratosis aktinik" },

  // L60–L75 Disorders of skin appendages
  { code: "L60.0", label: "Ingrown nail" },
  { code: "L63.9", label: "Alopecia areata, tidak dirinci" },
  { code: "L64.9", label: "Alopecia androgenik, tidak dirinci" },
  { code: "L65.9", label: "Kerontokan rambut non-cicatricial, tidak dirinci" },
  { code: "L70.0", label: "Acne vulgaris" },
  { code: "L70.1", label: "Acne conglobata" },
  { code: "L70.5", label: "Acne excoriée des jeunes filles" },
  { code: "L70.8", label: "Acne, jenis lain" },
  { code: "L70.9", label: "Acne, tidak dirinci" },
  { code: "L71.0", label: "Rosacea" },
  { code: "L71.8", label: "Rinofima" },
  { code: "L72.0", label: "Kista epidermal" },
  { code: "L72.1", label: "Kista trichilemmal/sebaceous" },
  { code: "L73.0", label: "Acne keloid" },

  // L80–L99 Other disorders
  { code: "L80", label: "Vitiligo" },
  { code: "L81.0", label: "Hiperpigmentasi pasca-inflamasi" },
  { code: "L81.1", label: "Kloasma / melasma" },
  { code: "L81.4", label: "Hiperpigmentasi melanin lainnya" },
  { code: "L81.6", label: "Gangguan lain melibatkan penurunan formasi melanin" },
  { code: "L81.9", label: "Gangguan pigmentasi, tidak dirinci" },
  { code: "L82", label: "Keratosis seboroik" },
  { code: "L85.3", label: "Xerosis cutis" },
  { code: "L87.0", label: "Keratosis follicular" },
  { code: "L90.5", label: "Cicatrix / scar / fibrosis kulit" },
  { code: "L91.0", label: "Keloid" },
  { code: "L98.8", label: "Gangguan kulit & subkutan lainnya, dirinci" },
  { code: "L98.9", label: "Gangguan kulit & subkutan, tidak dirinci" },

  // B-codes (skin infections)
  { code: "B00.1", label: "Herpes simplex vesikular dermatitis" },
  { code: "B02.9", label: "Herpes zoster, tidak dirinci" },
  { code: "B07", label: "Veruka virus (kutil)" },
  { code: "B08.1", label: "Moluskum kontagiosum" },
  { code: "B35.0", label: "Tinea barbae & tinea capitis" },
  { code: "B35.4", label: "Tinea corporis" },
  { code: "B36.0", label: "Pityriasis versicolor" },

  // T-codes (cosmetic-related)
  { code: "T78.4", label: "Alergi, tidak dirinci" },
  { code: "T81.4", label: "Infeksi pasca prosedur, tidak dirinci" },
  { code: "T88.7", label: "Reaksi merugikan terhadap obat/medikasi, tidak dirinci" },

  // Z-codes (encounter for...)
  { code: "Z41.1", label: "Konsultasi prosedur kosmetik / bedah plastik" },
  { code: "Z42.8", label: "Tindak lanjut perawatan setelah bedah plastik" },
  { code: "Z48.8", label: "Tindak lanjut perawatan post-prosedur" },
];

export function searchIcd10(q: string, limit = 20): Icd10Entry[] {
  const query = q.trim().toLowerCase();
  if (!query) return ICD10_DERMATOLOGY.slice(0, limit);
  return ICD10_DERMATOLOGY.filter(
    (e) =>
      e.code.toLowerCase().includes(query) ||
      e.label.toLowerCase().includes(query)
  ).slice(0, limit);
}
