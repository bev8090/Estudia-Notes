import { AttemptView } from "./attempt-view";

export default async function AttemptPage({ params }: PageProps<"/attempts/[id]">) {
  const { id } = await params;
  return <AttemptView id={id} />;
}
