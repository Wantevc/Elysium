// src/lib/taskStore.ts
export type Task = {
  id: string;
  platform: "fb" | "ig";
  type: "text" | "photo";
  pageId: string;
  scheduledAt: string;
  status: "queued" | "scheduled" | "posted" | "failed";
  message?: string;
  caption?: string;
  imageUrl?: string;
  pageToken?: string;
  result?: any;
  createdAt?: string;
};

type Store = { tasks: Task[] };

const g = globalThis as any;
if (!g.__TASK_STORE__) g.__TASK_STORE__ = { tasks: [] } as Store;
const store: Store = g.__TASK_STORE__;

const byCreatedDesc = (a: Task, b: Task) =>
  +new Date(b.createdAt || b.scheduledAt || 0) -
  +new Date(a.createdAt || a.scheduledAt || 0);

export function getTasks(): Task[] { return [...store.tasks].sort(byCreatedDesc); }
export function addTask(t: Omit<Task, "id" | "createdAt">): Task {
  const task: Task = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  store.tasks.push(task);
  return task;
}
export function updateTask(id: string, patch: Partial<Task>): Task | null {
  const i = store.tasks.findIndex(x => x.id === id);
  if (i < 0) return null;
  store.tasks[i] = { ...store.tasks[i], ...patch };
  return store.tasks[i];
}
export function deleteTask(id: string): boolean {
  const before = store.tasks.length;
  store.tasks = store.tasks.filter(x => x.id !== id);
  return store.tasks.length < before;
}
export function listDue(now = Date.now()): Task[] {
  return store.tasks.filter(t => {
    const ts = +new Date(t.scheduledAt || 0);
    return (t.status === "queued" || t.status === "scheduled") && ts && ts <= now;
  });
}
export function markPosted(id: string, result: any): Task | null {
  return updateTask(id, { status: "posted", result });
}
export function resetAll() { store.tasks = []; }
