import type { Metadata } from "next";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = {
  title: "Progress · Estudia Notes",
};

export default function ProgressPage() {
  return <ProgressView />;
}
