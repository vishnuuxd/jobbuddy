import { Orb } from "@/components/Orb";
import type { InterviewVM } from "@/lib/avatar/interviewVM";

// The avatar slot. The Rive rig replaces Orb here and reads the same InterviewVM.
export function MeeraStage({ vm }: { vm: InterviewVM }) {
  return (
    <div className="stage" aria-hidden="true">
      <Orb vm={vm} />
    </div>
  );
}
