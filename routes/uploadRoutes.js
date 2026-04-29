import { Router } from "express";
import multer from "multer";
import { getSupabaseAdmin } from "../lib/supabase.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/screenshot", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const supabase = getSupabaseAdmin();
    const ext = req.file.originalname.split(".").pop() || "png";
    const fileName = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("trade-screenshots")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) return res.status(500).json({ error: error.message });

    const { data: publicData } = supabase.storage
      .from("trade-screenshots")
      .getPublicUrl(data.path);

    res.json({ file_url: publicData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
