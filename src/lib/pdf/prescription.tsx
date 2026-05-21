import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { pdfStyles as s, clinicMeta, fmtDate } from "./common";

export type PrescriptionPDFProps = {
  prescription: {
    code: string;
    issuedAt: Date | string;
    notes?: string | null;
    signatureUrl?: string | null;
    items: Array<{
      name: string;
      qty: number | string;
      unit: string;
      dosage?: string | null;
      duration?: string | null;
      notes?: string | null;
    }>;
  };
  patient: {
    fullName: string;
    mrn: string;
    birthDate?: Date | string | null;
    gender?: string | null;
    knownAllergies?: string | null;
  };
  doctor: { name: string; licenseNumber?: string | null; specialty?: string | null };
};

export function PrescriptionPDF({ prescription, patient, doctor }: PrescriptionPDFProps) {
  const c = clinicMeta();
  const age = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <Document>
      <Page size="A5" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Text style={s.brandName}>{c.name}</Text>
            <Text style={s.brandSub}>{c.address}</Text>
            <Text style={s.brandSub}>{c.phone}</Text>
          </View>
          <View style={s.meta}>
            <Text style={s.metaTitle}>RESEP / Rx</Text>
            <Text style={s.metaCode}>{prescription.code}</Text>
            <Text>{fmtDate(prescription.issuedAt)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Pasien</Text>
            <Text style={s.rowValue}>{patient.fullName} ({patient.mrn})</Text>
          </View>
          {age !== null && (
            <View style={s.row}>
              <Text style={s.rowLabel}>Usia / JK</Text>
              <Text style={s.rowValue}>{age} thn / {patient.gender ?? "-"}</Text>
            </View>
          )}
          {patient.knownAllergies ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Alergi</Text>
              <Text style={[s.rowValue, { color: "#dc2626" }]}>{patient.knownAllergies}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.section}>
          <Text style={[s.brandName, { fontSize: 28, marginBottom: 8 }]}>℞</Text>
          {prescription.items.map((it, idx) => (
            <View key={idx} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 700, fontSize: 11 }}>
                {idx + 1}. {it.name}  —  {Number(it.qty)} {it.unit}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 10 }}>
                S. {it.dosage ?? "—"}{it.duration ? `  ·  Selama ${it.duration}` : ""}
              </Text>
              {it.notes ? (
                <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{it.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {prescription.notes ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Catatan</Text>
            <Text>{prescription.notes}</Text>
          </View>
        ) : null}

        <View style={s.signatureBox}>
          <Text style={s.signatureLabel}>Dokter</Text>
          {prescription.signatureUrl ? (
            <Image src={prescription.signatureUrl} style={{ width: 120, height: 50, marginTop: 6 }} />
          ) : (
            <View style={{ height: 50 }} />
          )}
          <Text style={s.signatureName}>{doctor.name}</Text>
          {doctor.specialty ? (
            <Text style={{ fontSize: 9, color: "#6b7280" }}>{doctor.specialty}</Text>
          ) : null}
          {doctor.licenseNumber ? (
            <Text style={{ fontSize: 9, color: "#6b7280" }}>STR: {doctor.licenseNumber}</Text>
          ) : null}
        </View>

        <Text style={s.footer} fixed>
          {c.name} · {c.phone} · Resep ini sah dengan tanda tangan dokter.
        </Text>
      </Page>
    </Document>
  );
}
