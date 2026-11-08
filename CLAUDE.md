# JobBuddy

- PRD.md is the source of truth. If something in the code disagrees with it, ask me.
- Work one build plan block at a time. Stop at the block's checks and tell me how to verify them.
- Every live reaction threshold lives in lib/live/config.ts. Never hardcode one elsewhere.
- The app never animates Meera directly. It only sets InterviewVM values.
- No API keys in the browser.
- Build Meera's rig from scratch. Never use or copy another Rive file.
- After any UI change, take a mobile width screenshot and show me.
- Design: PRD.md decides behaviour. design/DESIGN.md and design/screens decide look and feel. Inside those, you own the UI and UX details: fix problems you find instead of copying them.
- Log every departure from a reference screen in design/DECISIONS.md.
- During UI phases, never change lib/live or the ElevenLabs wiring.
- Paper (file "JobBuddy screens", page "v2 key flows · Tropical") is read only. Use it to check exact styles. Never create, edit or delete anything in Paper.
