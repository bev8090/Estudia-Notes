import { ExamView } from "./exam-view";

export default async function ExamPage({ params }: PageProps<"/exams/[id]">) {
  const { id } = await params;
  return <ExamView id={id} />;
}
