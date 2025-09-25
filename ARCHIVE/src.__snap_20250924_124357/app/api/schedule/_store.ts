import { promises as fs } from "fs";
import path from "path";

export type Platform = "fb" | "ig";
export type TaskType = "text" | "photo";
export type TaskStatus = "queued" | "scheduled" | "posted" | "failed";

type TaskBase = {
  id: string;
  platform: Platform;
  type: TaskType;
  pageId: string;
  scheduledAt: string;
  status: TaskStatus;
  createdAt: string;
  result?: any;
  // ⬇️ Nieuw: token optioneel op elke taak
  pageToken?: string;
};

export type TextTask = TaskBase & {
  type: "text";
  message: string;
  caption?: string;
};

export type PhotoTask = TaskBase & {
  type: "photo";
  imageUrl: string;
  caption?: string;
  // optioneel message bij photo+text scenario
  message?: string;
};

export type Task = TextTask | PhotoTask;
// ---- Einde types ----
const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "schedules.json");

async function ensureFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(dataFile).catch(async () => {
      await fs.writeFile(dataFile, "[]", "utf8");
    });
  } catch {}
}

export async function readTasks(): Promise<Task[]> {
  await ensureFile();
  const buf = await fs.readFile(dataFile, "utf8");
  try {
    const arr = JSON.parse(buf);
    return Array.isArray(arr) ? (arr as Task[]) : [];
  } catch {
    return [];
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2), "utf8");
}

export async function addTask(task: Task): Promise<Task> {
  const tasks = await readTasks();
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const tasks = await readTasks();
  const i = tasks.findIndex(t => t.id === id);
  if (i === -1) return null;
  const updated = { ...tasks[i], ...patch } as Task;
  tasks[i] = updated;
  await writeTasks(tasks);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await readTasks();
  const before = tasks.length;
  const next = tasks.filter(t => t.id !== id);
  await writeTasks(next);
  return next.length < before;
}
