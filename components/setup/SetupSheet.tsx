"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectChip, Tag } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { AttachError, extractText } from "@/lib/attach/extract";
import { trimWords } from "@/lib/call/context";
import { setPendingCall } from "@/lib/call/pending";
import { getProfile, saveProfile, setSavedCv } from "@/lib/store/db";
import type { SavedCv, Setup, Skill } from "@/lib/store/types";
import { focusTitle, questionsFor, roles, seniorities, sheetTitle } from "./setupOptions";
import styles from "./SetupSheet.module.css";

export type SheetStart =
  | { kind: "new" }
  /** Run this again: the same setup and job post as an earlier call. */
  | { kind: "again"; setup: Setup; jdText?: string }
  /** Practice this: a 5 minute call on one skill. */
  | { kind: "focus"; skill: Skill; label: string; setup?: Setup };

type Props = { open: boolean; start: SheetStart; onClose: () => void };

const lengths = [
  { minutes: 5, note: "quick" },
  { minutes: 10, note: "usual" },
  { minutes: 20, note: "full" },
] as const;

export function SetupSheet({ open, start, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [otherRole, setOtherRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [minutes, setMinutes] = useState<5 | 10 | 20>(10);
  const [jdOpen, setJdOpen] = useState(false);
  const [jdText, setJdText] = useState("");
  const [savedCv, setSaved] = useState<SavedCv | undefined>();
  const [newCv, setNewCv] = useState<{ fileName: string; text: string } | null>(null);
  const [useCv, setUseCv] = useState(true);
  const [rememberCv, setRememberCv] = useState(true);
  const [cvError, setCvError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Fill the sheet each time it opens: remembered choices, then whatever the entry point brings.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getProfile().then((profile) => {
      if (cancelled) return;
      const last = profile.lastSetup ?? {};
      const from = start.kind === "new" ? undefined : start.setup;
      const chosenRole = from?.role ?? last.role ?? "";
      const known = roles.includes(chosenRole);
      setName(from?.name ?? last.name ?? "");
      setRole(chosenRole ? (known ? chosenRole : "Other") : "");
      setOtherRole(known ? "" : chosenRole);
      setSeniority(from?.seniority ?? last.seniority ?? "");
      setMinutes(start.kind === "focus" ? 5 : (from?.durationMin ?? last.durationMin ?? 10));
      const jd = start.kind === "again" ? (start.jdText ?? "") : "";
      setJdText(jd);
      setJdOpen(false);
      setSaved(profile.cv);
      setNewCv(null);
      setUseCv(true);
      setRememberCv(!profile.cv);
      setCvError(null);
      setStarting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, start]);

  const roleText = role === "Other" ? otherRole.trim() : role;
  const ready = Boolean(roleText && seniority);
  const cv = newCv ?? (useCv ? savedCv : undefined);
  const hasJd = jdText.trim().length > 0;
  const focus = start.kind === "focus" ? start : null;
  const title = useMemo(() => sheetTitle({ focus: focus?.skill, hasJd, minutes }), [focus, hasJd, minutes]);

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    try {
      setNewCv({ fileName: file.name, text: await extractText(file) });
      setCvError(null);
    } catch (error) {
      setCvError(error instanceof AttachError ? error.message : "I can't read that one. A PDF or plain text works.");
    }
  }

  async function startCall() {
    if (!ready || starting) return;
    setStarting(true);
    const setup: Setup = {
      role: roleText,
      seniority,
      name: name.trim() || undefined,
      durationMin: minutes,
      questionCount: questionsFor(minutes),
      focusSkill: focus?.skill,
      hasCv: Boolean(cv),
      hasJd,
    };
    await saveProfile({ lastSetup: { name: setup.name, role: roleText, seniority, durationMin: focus ? undefined : minutes } });
    if (newCv && rememberCv) await setSavedCv({ ...newCv, addedAt: new Date().toISOString() });
    setPendingCall({ setup, cvText: cv?.text, jdText: hasJd ? trimWords(jdText) : undefined });
    router.push("/call");
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={focus ? focusTitle(focus.skill) : title.heading}
      showTitle
      largeTitle
      eyebrow={
        focus ? (
          <Tag tone="lime">Focus · {focus.label}</Tag>
        ) : title.sticker ? (
          <Tag tone="lime">{title.sticker}</Tag>
        ) : null
      }
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void startCall();
        }}
      >

        <fieldset className={styles.group}>
          <legend className={styles.label}>I'm interviewing for</legend>
          <div className={styles.wrap} role="radiogroup" aria-label="Role">
            {roles.map((name) => (
              <SelectChip key={name} selected={role === name} onClick={() => setRole(name)}>
                {name}
              </SelectChip>
            ))}
            <SelectChip selected={role === "Other"} dashed onClick={() => setRole("Other")}>
              {role === "Other" ? "Other" : "+ Other"}
            </SelectChip>
          </div>
          {role === "Other" && (
            <input
              className={styles.input}
              value={otherRole}
              onChange={(event) => setOtherRole(event.target.value)}
              placeholder="Which role?"
              aria-label="Which role?"
              autoFocus
            />
          )}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.label}>At what level</legend>
          <div className={styles.row} role="radiogroup" aria-label="Level">
            {seniorities.map((level) => (
              <SelectChip key={level} shape="tile" selected={seniority === level} onClick={() => setSeniority(level)}>
                {level}
              </SelectChip>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.label}>How long</legend>
          <div className={styles.row} role="radiogroup" aria-label="Length">
            {lengths.map(({ minutes: value, note }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={minutes === value}
                className={styles.length}
                onClick={() => setMinutes(value)}
              >
                <span className={styles.lengthNumber}>{value}</span>
                <span className={styles.lengthNote}>
                  min · {focus && value === 5 ? "focus" : note}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className={styles.field}>
          <span className={styles.label}>
            Your name <span className={styles.optional}>· optional</span>
          </span>
          <input
            className={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="given-name"
            placeholder="So Meera can say hi"
          />
        </label>

        <div className={styles.row}>
          <div className={styles.half}>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={(event) => void onFileChosen(event.target.files?.[0])}
            />
            {cv ? (
              <div className={styles.cvOn}>
                <span className={styles.attachTitle}>{newCv ? "CV attached" : "Using your CV"}</span>
                <span className={styles.attachMeta}>
                  <span className={styles.fileName}>{cv.fileName}</span>
                  <button type="button" className={styles.inlineButton} onClick={() => fileInput.current?.click()}>
                    Change
                  </button>
                </span>
                <button
                  type="button"
                  className={styles.inlineButton}
                  onClick={() => {
                    setNewCv(null);
                    setUseCv(false);
                  }}
                >
                  Don't use a CV
                </button>
              </div>
            ) : (
              <button type="button" className={styles.attachEmpty} onClick={() => fileInput.current?.click()}>
                <span className={styles.attachTitle}>+ CV</span>
                <span className={styles.attachMeta}>{savedCv ? "Not using your saved one" : "Optional"}</span>
              </button>
            )}
          </div>
          <div className={styles.half}>
            {hasJd && !jdOpen ? (
              <button type="button" className={styles.jdOn} onClick={() => setJdOpen(true)}>
                <span className={styles.attachTitle}>Job post added</span>
                <span className={styles.attachMeta}>Tap to edit</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.attachEmpty}
                aria-expanded={jdOpen}
                onClick={() => setJdOpen(!jdOpen)}
              >
                <span className={styles.attachTitle}>+ Job post</span>
                <span className={styles.attachMeta}>Optional, paste it</span>
              </button>
            )}
          </div>
        </div>

        {newCv && savedCv?.fileName !== newCv.fileName && (
          <label className={styles.check}>
            <input type="checkbox" checked={rememberCv} onChange={(event) => setRememberCv(event.target.checked)} />
            Remember this CV for next time
          </label>
        )}
        {!cv && savedCv && (
          <button type="button" className={styles.inlineButton} onClick={() => setUseCv(true)}>
            Use my saved CV, {savedCv.fileName}
          </button>
        )}
        {cvError && (
          <p className={styles.error} role="alert">
            {cvError}
          </p>
        )}

        {jdOpen && (
          <label className={styles.field}>
            <span className={styles.label}>Job post</span>
            <textarea
              className={styles.input}
              rows={6}
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder="Paste the job post. Meera bases her questions on it."
              autoFocus
            />
            <span className={styles.jdActions}>
              <button type="button" className={styles.inlineButton} onClick={() => setJdOpen(false)}>
                Done
              </button>
              {hasJd && (
                <button
                  type="button"
                  className={styles.inlineButton}
                  onClick={() => {
                    setJdText("");
                    setJdOpen(false);
                  }}
                >
                  Remove
                </button>
              )}
            </span>
          </label>
        )}

        <Button type="submit" variant="primary" size="big" block disabled={!ready} loading={starting}>
          Call Meera · {minutes} min
        </Button>
        {!ready && <p className={styles.hint}>Pick a role and a level to start.</p>}
      </form>
    </Sheet>
  );
}
