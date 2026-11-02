import type { CallSession, Setup } from "../call/session";

type Parameters = Record<string, unknown>;

const isYes = (value: unknown) => value === true || value === "true";
const answer = (accepted: boolean) => (accepted ? "ok" : "ignored");

function parseSetup(parameters: Parameters): Setup | null {
  const { role, seniority, mode, hasJd, hasCv } = parameters;
  if (typeof role !== "string" || typeof seniority !== "string") return null;
  if (mode !== "full" && mode !== "short") return null;
  return { role, seniority, mode, hasJd: isYes(hasJd), hasCv: isYes(hasCv) };
}

// The five client tools from the PRD agent spec. Each must exist here, or the
// SDK reports an error for every call and tells Meera the tool failed.
// Each one always returns right away, so none of them hold up the conversation.
export function createClientTools(session: CallSession) {
  function logged(name: string, run: (parameters: Parameters) => boolean) {
    return (parameters: Parameters) => {
      const result = answer(run(parameters));
      console.debug(`client tool ${name}: ${result}`, parameters);
      return result;
    };
  }

  return {
    react: logged("react", ({ name }) => session.react(String(name))),
    // Wired in the Day 2 interview block.
    flag: logged("flag", () => true),
    setPhase: logged("setPhase", ({ name }) => session.setPhase(String(name))),
    setSetup: logged("setSetup", (parameters) => {
      const setup = parseSetup(parameters);
      if (setup) session.setSetup(setup);
      return setup !== null;
    }),
    nextQuestion: logged("nextQuestion", () => session.nextQuestion()),
  };
}
