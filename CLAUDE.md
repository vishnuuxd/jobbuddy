# JobBuddy

- PRD.md is the source of truth. If something in the code disagrees with it, ask me.
- Work one build plan block at a time. Stop at the block's checks and tell me how to verify them.
- Every live reaction threshold lives in lib/live/config.ts. Never hardcode one elsewhere.
- The app never animates Meera directly. It only sets InterviewVM values.
- No API keys in the browser.
- Build Meera's rig from scratch. Never use or copy another Rive file.
- After any UI change, take a mobile width screenshot and show me.
