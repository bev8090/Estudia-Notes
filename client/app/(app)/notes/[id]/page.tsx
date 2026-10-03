import { NoteView } from "./note-view";

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  return <NoteView id={id} />;
}
