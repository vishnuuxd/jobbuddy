// The five client tools from the PRD agent spec. Each must exist here, or the
// SDK reports an error for every call and tells Meera the tool failed.
// They only log until they're wired to the rig and the app.
function loggedTool(name: string) {
  return (parameters: Record<string, unknown>) => {
    console.debug(`client tool ${name}`, parameters);
    return "ok";
  };
}

export const clientTools = {
  react: loggedTool("react"),
  flag: loggedTool("flag"),
  setPhase: loggedTool("setPhase"),
  setSetup: loggedTool("setSetup"),
  nextQuestion: loggedTool("nextQuestion"),
};
