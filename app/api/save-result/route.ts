import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, ...resultData } = body;
    // Limit number of images stored (keep only last 10 best quality images)
    const MAX_IMAGES = 10;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir)
      .filter(file => file.startsWith("scan-") && file.endsWith(".jpg"))
      .map(file => ({
        name: file,
        path: path.join(uploadsDir, file),
        time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
      
      // Delete old images if exceeding limit
      if (files.length >= MAX_IMAGES) {
      files.slice(MAX_IMAGES - 1).forEach(file => {
        fs.unlinkSync(file.path);
      });
      }
    }
    // Define paths
    const dataDir = path.join(process.cwd(), "data");
    const resultsFile = path.join(dataDir, "results.json");

    // Ensure directories exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let imagePath = "";
    if (image) {
      // Save image (base64 to file)
      // Remove header data:image/jpeg;base64,
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `scan-${Date.now()}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);
      imagePath = `/uploads/${filename}`;
    }

    // Prepare record
    const newRecord = {
      ...resultData,
      imagePath,
      timestamp: new Date().toISOString(),
    };

    // Read existing data
    let results = [];
    if (fs.existsSync(resultsFile)) {
      const fileContent = fs.readFileSync(resultsFile, "utf-8");
      try {
        results = JSON.parse(fileContent);
      } catch (e) {
        console.error("Error parsing results.json", e);
        results = [];
      }
    }

    // Append new record
    results.push(newRecord);

    // Write back
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    return NextResponse.json({ success: true, imagePath });
  } catch (error) {
    console.error("Error saving result:", error);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}
