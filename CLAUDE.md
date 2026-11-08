# JobBuddy

- PRD.md is the source of truth. If something in the code disagrees with it, ask me.
- v2 is built in one run, in the order of the v2 build plan in PRD.md. After each part: typecheck, tests and Playwright screenshots at 390 px, then one commit per part, pushed. Stop only if something is truly blocked, or a choice changes behaviour in the PRD.
- Every live reaction threshold lives in lib/live/config.ts. Never hardcode one elsewhere.
- The app never animates Meera directly. It only sets InterviewVM values.
- No API keys in the browser.
- Build Meera's rig from scratch. Never use or copy another Rive file.
- After any UI change, take a mobile width screenshot and show me.
- Design: PRD.md decides behaviour. design/DESIGN.md and design/screens decide look and feel. Inside those, you own the UI and UX details: fix problems you find instead of copying them.
- Log every departure from a reference screen in design/DECISIONS.md.
- Never change the lib/live rules or thresholds.
- Paper (file "JobBuddy screens", page "v2 key flows · Tropical") is read only. Use it to check exact styles. Never create, edit or delete anything in Paper.
