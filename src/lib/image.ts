import sharp from "sharp";

/**
 * Watermark gambar dengan teks (nama klinik + tanggal) di kanan bawah.
 * Output JPEG quality 85, max width 1920.
 */
export async function watermarkImage(
  input: Buffer,
  opts: { line1: string; line2?: string; opacity?: number } = { line1: "Klinik Cantik" }
): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const width = Math.min(meta.width ?? 1920, 1920);

  const svg = buildWatermarkSvg(width, opts.line1, opts.line2 ?? new Date().toLocaleString("id-ID"), opts.opacity ?? 0.55);

  return sharp(input)
    .resize({ width, withoutEnlargement: true })
    .composite([{ input: Buffer.from(svg), gravity: "southeast" }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export async function makeThumbnail(input: Buffer, size = 360): Promise<Buffer> {
  return sharp(input)
    .resize({ width: size, height: size, fit: "cover" })
    .jpeg({ quality: 75 })
    .toBuffer();
}

function buildWatermarkSvg(canvasWidth: number, line1: string, line2: string, opacity: number) {
  const fontSize = Math.max(14, Math.round(canvasWidth / 60));
  const padding = Math.round(fontSize * 0.8);
  const svgWidth = Math.max(280, fontSize * Math.max(line1.length, line2.length) * 0.55);
  const svgHeight = fontSize * 2 + padding * 2;
  return `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="rgba(0,0,0,${opacity * 0.55})" rx="${padding / 2}" ry="${padding / 2}"/>
      <text x="${padding}" y="${padding + fontSize}" fill="white" font-family="sans-serif" font-size="${fontSize}" font-weight="700">${escapeXml(line1)}</text>
      <text x="${padding}" y="${padding + fontSize * 2 + 4}" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="${Math.round(fontSize * 0.75)}">${escapeXml(line2)}</text>
    </svg>
  `;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
