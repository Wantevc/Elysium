import { redirect } from "next/navigation";

export default function OldPlannerRedirect() {
  redirect("/app/planner");
}