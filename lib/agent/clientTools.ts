import type { CallSession } from "../call/session";

type Parameters = Record<string, unknown>;

const answer = (accepted: boolean) => (accepted ? "ok" : "ignored");

// The client tools from the PRD agent spec. setSetup is gone: the setup comes from the sheet.
// Each must exist here, or the
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
    flag: logged("flag", ({ type, quote }) => session.flag(String(type), String(quote ?? ""))),
    setPhase: logged("setPhase", ({ name }) => session.setPhase(String(name))),
    nextQuestion: logged("nextQuestion", () => session.nextQuestion()),
  };
}
