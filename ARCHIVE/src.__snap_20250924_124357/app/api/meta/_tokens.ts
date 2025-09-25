import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "page_tokens.json");

async function readMap(): Promise<Record<string, string>> {
  try {
    const s = await fs.readFile(FILE, "utf8");
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

export async function getPageToken(pageId: string): Promise<string | null> {
  const map = await readMap();
  return map[pageId] || null;
}

export async function setPageToken(pageId: string, token: string) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const map = await readMap();
  map[pageId] = token;
  await fs.writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
  return true;
}
