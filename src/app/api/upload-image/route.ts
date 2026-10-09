import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "fiborge/logos";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    // 1. 如果有設定 Cloudinary 環境變數，使用原生 REST API 上傳 (免安裝 cloudinary 套件)
    if (cloudName && apiKey) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", folder);
        uploadFormData.append("upload_preset", "ml_default"); // 或未簽名預設值

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            return NextResponse.json({ url: data.secure_url });
          }
        }
      } catch (cloudErr) {
        console.warn("Cloudinary REST upload skipped, falling back to Base64:", cloudErr);
      }
    }

    // 2. 🟢 零設定備援 (Base64 Data URL)：無需任何雲端帳號，100% 成功處理 Logo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/png";
    const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64Url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
