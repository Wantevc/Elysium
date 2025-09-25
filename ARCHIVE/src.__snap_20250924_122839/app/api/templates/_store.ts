import { promises as fs } from "fs";
import path from "path";

export type TPlatform = "fb" | "ig" | "any";
export type TType = "text" | "photo";

export interface Template {
  id: string;
  name: string;           // bv. "Motivation Monday"
  platform: TPlatform;    // fb | ig | any
  type: TType;            // text | photo
  message?: string;       // FB teksttemplate
  caption?: string;       // IG captiontemplate
  imageUrl?: string;      // default image (optioneel)
  hashtags?: string[];    // ["#marketing", "#brand"]
  createdAt: string;
  updatedAt: string;
}

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "templates.json");

const defaultTemplates: Template[] = [
  {
    id: "tmpl-monday-motivation",
    name: "Motivation Monday",
    platform: "ig",
    type: "photo",
    caption: "Nieuwe week, nieuwe doelen 💪 {brand} pakt uit met {offer}. {cta}",
    hashtags: ["#mondaymotivation", "#entrepreneur", "#growth", "#goals", "#socialmedia"],
    imageUrl: "https://via.placeholder.com/1080.jpg",
    message: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-tip-tuesday",
    name: "Tip Tuesday",
    platform: "fb",
    type: "text",
    message: "🎯 Tip Tuesday: {tip}\n\nWaarom dit werkt: {reason}\n\nMeer weten? {url}",
    hashtags: ["#tiptuesday", "#marketingtips", "#smm"],
    caption: undefined,
    imageUrl: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-wed-qa",
    name: "Q&A Wednesday",
    platform: "any",
    type: "text",
    message: "❓ Vraag van de week: {question}\n💡 Antwoord: {answer}\n\nWat wil jij nog weten? Laat het hieronder weten 👇",
    hashtags: ["#qawednesday", "#askmeanything", "#community"],
    caption: undefined,
    imageUrl: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-thu-testimonial",
    name: "Testimonial Thursday",
    platform: "ig",
    type: "photo",
    caption: "⭐⭐⭐⭐⭐ \"{testimonial}\" — {customer}\n\nDankjewel voor het vertrouwen! {cta}",
    hashtags: ["#testimonialthursday", "#reviews", "#socialproof"],
    imageUrl: "https://via.placeholder.com/1080.jpg",
    message: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-fri-feature",
    name: "Feature Friday",
    platform: "fb",
    type: "text",
    message: "✨ Feature Friday: {product} — {benefit}\n\nWaarom jij dit wil: {why}\nBestel nu: {url}",
    hashtags: ["#featurefriday", "#new", "#update"],
    caption: undefined,
    imageUrl: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-bts",
    name: "Behind the Scenes",
    platform: "ig",
    type: "photo",
    caption: "Achter de schermen bij {brand} 🎥 Vandaag werken we aan {project}. {cta}",
    hashtags: ["#behindthescenes", "#bts", "#team"],
    imageUrl: "https://via.placeholder.com/1080.jpg",
    message: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-announce",
    name: "Announcement",
    platform: "any",
    type: "text",
    message: "📣 Announcement: {headline}\n\n{details}\n\nMeer info: {url}",
    hashtags: ["#announcement", "#news"],
    caption: undefined,
    imageUrl: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-weekend-promo",
    name: "Weekend Promo",
    platform: "ig",
    type: "photo",
    caption: "Weekend deal! 🎉 {offer} alleen dit weekend. Gebruik code {code}. {cta}",
    hashtags: ["#weekendsale", "#promo", "#deal"],
    imageUrl: "https://via.placeholder.com/1080.jpg",
    message: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function ensureFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    // eerste keer: seed defaults
    await fs.writeFile(dataFile, JSON.stringify(defaultTemplates, null, 2), "utf8");
  }
}

export async function readTemplates(): Promise<Template[]> {
  await ensureFile();
  const txt = await fs.readFile(dataFile, "utf8");
  try {
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? (arr as Template[]) : [];
  } catch {
    return [];
  }
}

export async function writeTemplates(templates: Template[]) {
  await ensureFile();
  await fs.writeFile(dataFile, JSON.stringify(templates, null, 2), "utf8");
}

export async function upsertTemplate(t: Partial<Template>): Promise<Template> {
  const all = await readTemplates();
  const now = new Date().toISOString();
  if (t.id) {
    const i = all.findIndex(x => x.id === t.id);
    if (i >= 0) {
      const updated: Template = { ...all[i], ...t, updatedAt: now } as Template;
      all[i] = updated;
      await writeTemplates(all);
      return updated;
    }
  }
  const created: Template = {
    id: t.id || crypto.randomUUID(),
    name: t.name || "Untitled",
    platform: (t.platform as TPlatform) || "any",
    type: (t.type as TType) || "text",
    message: t.message || "",
    caption: t.caption || "",
    imageUrl: t.imageUrl || "",
    hashtags: t.hashtags || [],
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await writeTemplates(all);
  return created;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const all = await readTemplates();
  const next = all.filter(t => t.id !== id);
  await writeTemplates(next);
  return next.length < all.length;
}