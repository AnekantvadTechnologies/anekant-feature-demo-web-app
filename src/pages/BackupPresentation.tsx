import { SlideDeck } from "@/pages/Presentation";
import { BACKUP_SLIDES } from "@/pages/slideDecks";

export function BackupPresentation() {
  return <SlideDeck slides={BACKUP_SLIDES} />;
}
