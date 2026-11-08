"use client";

import { useEffect, useState } from "react";
import { Meera, type MeeraStill } from "@/components/meera/Meera";
import { Button } from "@/components/ui/Button";
import { CallControl, CallPill, ProgressSegments, QuestionCard } from "@/components/ui/CallParts";
import { Card, Eyebrow } from "@/components/ui/Card";
import { SelectChip, StatusPill, Sticker } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader, HeroMeta } from "@/components/ui/HeroHeader";
import { ArrowIcon, CameraIcon, CheckIcon, FlameIcon, MicIcon, StarIcon } from "@/components/ui/icons";
import { InterviewerPlaceholder } from "@/components/ui/InterviewerPlaceholder";
import { Sheet } from "@/components/ui/Sheet";
import { SkillBar } from "@/components/ui/SkillBar";
import { StatTile } from "@/components/ui/StatTile";
import { TabBar } from "@/components/ui/TabBar";
import { createInterviewVM, moods, triggers, type Mood } from "@/lib/avatar/interviewVM";
import { contrast, passes } from "@/lib/ui/contrast";
import styles from "./kit.module.css";

const colours: [string, string][] = [
  ["pink", "#FF3D7F"], ["pink-deep", "#D61F5E"], ["pink-tint", "#FFE8EF"], ["sun", "#FFB800"],
  ["cream", "#FFF4D6"], ["cream-ink", "#B07F00"], ["cream-chip", "#8A6400"], ["ink", "#1A1530"],
  ["body", "#3B3552"], ["muted", "#6B6580"], ["line", "#F1EEF6"], ["border", "#E4E1EC"],
  ["dashed", "#C9C4D6"], ["mint", "#00A86B"], ["mint-deep", "#00764B"], ["mint-tint", "#E6F7F0"],
  ["white", "#FFFFFF"], ["tile", "#F7F5FA"], ["ink-raised", "#2A2442"], ["ink-line", "#3A3352"],
  ["ink-muted", "#B9B3CC"], ["ink-dim", "#5A5272"],
];

// Text and background pairs the screens use, with the smallest size each appears at.
const pairs: { text: string; on: string; where: string; large: boolean }[] = [
  { text: "#FFFFFF", on: "#FF3D7F", where: "Hero 34, titles 26, header greeting 19 bold", large: true },
  { text: "#FFFFFF", on: "#FF3D7F", where: "Pink button labels, all 19 bold", large: true },
  { text: "#1A1530", on: "#FF3D7F", where: "Meta lines in pink headers (B)", large: false },
  { text: "#D61F5E", on: "#FFFFFF", where: "Small pink text on white: links, Meera asked (C)", large: false },
  { text: "#8A6400", on: "#FFF4D6", where: "Eyebrow and chip text on cream (D)", large: false },
  { text: "#1A1530", on: "#FFE8EF", where: "You said label on pink tint (E)", large: false },
  { text: "#1A1530", on: "#00A86B", where: "Text on the mint sticker (F)", large: false },
  { text: "#00764B", on: "#E6F7F0", where: "Text on mint tint", large: false },
  { text: "#6B6580", on: "#FFFFFF", where: "Muted text", large: false },
  { text: "#6B6580", on: "#F1EEF6", where: "Muted on line (grey pill)", large: false },
  { text: "#1A1530", on: "#FFB800", where: "Ink on sun (stickers)", large: false },
  { text: "#B9B3CC", on: "#1A1530", where: "Sublines on ink", large: false },
  { text: "#FFFFFF", on: "#2A2442", where: "Pills and controls on ink", large: false },
  { text: "#FF3D7F", on: "#1A1530", where: "Pink on ink", large: false },
];

const stills: { label: string; still: MeeraStill }[] = [
  { label: "listening", still: { mood: "listening" } },
  { label: "intake (hi)", still: { mood: "intake", posture: "soft" } },
  { label: "talking", still: { mood: "talking", mouthOpen: 70 } },
  { label: "skeptical", still: { mood: "skeptical" } },
  { label: "writing", still: { mood: "writing" } },
  { label: "reading", still: { mood: "reading" } },
  { label: "checkWatch", still: { mood: "listening", trigger: "checkWatch" } },
  { label: "browRaise", still: { mood: "listening", trigger: "browRaise" } },
  { label: "expectant", still: { mood: "listening", trigger: "expectant" } },
  { label: "smile", still: { mood: "listening", trigger: "smile" } },
  { label: "leanIn", still: { mood: "listening", trigger: "leanIn" } },
  { label: "handUp", still: { mood: "listening", trigger: "handUp" } },
];

function Section({ id, title, children, tone }: { id: string; title: string; children: React.ReactNode; tone?: "ink" | "pink" }) {
  return (
    <section id={id} className={`${styles.section} ${tone ? styles[tone] : ""}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Ratio({ text, on, large }: { text: string; on: string; large: boolean }) {
  const ratio = contrast(text, on);
  const ok = passes(ratio, large);
  return (
    <span className={ok ? styles.pass : styles.fail}>
      {ratio.toFixed(2)} {ok ? "passes" : "fails"} {large ? "large" : "AA"}
    </span>
  );
}

function ButtonStates({ onDark }: { onDark?: boolean }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className={styles.stack}>
      <Button variant="primary" onDark={onDark} block>
        Call Meera
      </Button>
      <Button variant="primary" onDark={onDark} block data-pressed="">
        Pressed
      </Button>
      <Button
        variant="primary"
        onDark={onDark}
        block
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        Tap for loading
      </Button>
      <Button variant="primary" onDark={onDark} block disabled>
        Disabled
      </Button>
      <div className={styles.row}>
        <Button variant="secondary" size="small" onDark={onDark} className={styles.grow}>
          Secondary
        </Button>
        <Button variant="quiet" size="small" onDark={onDark} className={styles.grow}>
          Quiet
        </Button>
      </div>
      <Button variant="primary" size="small" block>
        Retry this answer
      </Button>
      <div className={styles.row}>
        <Button variant="ink" size="compact">
          Practice this
        </Button>
        <Button variant="text" onDark={onDark}>
          End here
        </Button>
      </div>
    </div>
  );
}

export function Kit() {
  const [liveVm] = useState(createInterviewVM);
  const [mood, setMood] = useState<Mood>("listening");
  const [mouth, setMouth] = useState(0);
  const [offline, setOffline] = useState(false);
  const [role, setRole] = useState("Product designer");
  const [level, setLevel] = useState("Senior");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("/");

  useEffect(() => liveVm.set({ mood, mouthOpen: mouth }), [liveVm, mood, mouth]);

  return (
    <main className={styles.kit}>
      <HeroHeader>
        <div className={styles.heroTop}>
          <HeroGreeting>Foundation</HeroGreeting>
          <Sticker tilt={3}>Phase 1</Sticker>
        </div>
        <h1 className="t-hero">Kit</h1>
        <HeroMeta>Every v2 component and state. Nothing here is wired to a call.</HeroMeta>
      </HeroHeader>

      <nav className={styles.toc} aria-label="Sections">
        {["colour", "type", "headers", "buttons", "chips", "cards", "data", "meera", "call", "sheet", "contrast"].map((id) => (
          <a key={id} href={`#${id}`}>
            {id}
          </a>
        ))}
      </nav>

      <Section id="colour" title="Colour">
        <div className={styles.swatches}>
          {colours.map(([name, hex]) => (
            <div key={name} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(--${name})` }} />
              <span className="t-small">{name}</span>
              <span className={styles.hex}>{hex}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Type">
        <p className="t-hero">Hero 34</p>
        <p className="t-title">Screen title 26</p>
        <p className="t-card">Card title 20</p>
        <p className="t-button">Button 17</p>
        <p className="t-body">Body 15. Meera sounds like a person, not a product.</p>
        <p className="t-small">Small 13</p>
        <p className="t-eyebrow">Eyebrow 13</p>
        <p className="t-label">Label in a list 15</p>
      </Section>

      <Section id="headers" title="Pink headers">
        <p className="t-body">White only where it counts as large text. Small meta lines are ink.</p>
        <div className={styles.headerDemo}>
          <HeroHeader>
            <div className={styles.heroTop}>
              <HeroGreeting>Good evening, Vishnu</HeroGreeting>
              <Sticker tilt={3}>Day 4 streak</Sticker>
            </div>
            <p className="t-hero">Who are you practising with?</p>
          </HeroHeader>
        </div>
        <div className={styles.headerDemo}>
          <HeroHeader>
            <div className={styles.profileRow}>
              <span className={styles.avatar}>V</span>
              <div>
                <p className="t-title">Vishnu</p>
                <HeroMeta>Day 4 streak · 7 of 9 completed</HeroMeta>
              </div>
            </div>
          </HeroHeader>
        </div>
        <div className={styles.headerDemo}>
          <HeroHeader>
            <div className={styles.saysRow}>
              <Meera still={{ mood: "listening" }} size={40} tone="light" />
              <HeroGreeting>Meera says</HeroGreeting>
            </div>
            <p className={styles.verdict}>Good energy! Your stories stop right before the payoff.</p>
          </HeroHeader>
        </div>
      </Section>

      <Section id="buttons" title="Buttons on white">
        <ButtonStates />
      </Section>
      <Section id="buttons-pink" title="Buttons on pink" tone="pink">
        <div className={styles.stack}>
          <Button variant="secondary" block>
            See you tomorrow
          </Button>
          <Button variant="secondary" block data-pressed="">
            Pressed
          </Button>
        </div>
      </Section>
      <Section id="buttons-ink" title="Buttons on ink" tone="ink">
        <ButtonStates onDark />
      </Section>

      <Section id="chips" title="Chips, pills, stickers">
        <p className="t-label">Role</p>
        <div className={styles.wrap} role="radiogroup" aria-label="Role">
          {["Product designer", "UX researcher", "PM", "Engineer"].map((name) => (
            <SelectChip key={name} selected={role === name} onClick={() => setRole(name)}>
              {name}
            </SelectChip>
          ))}
          <SelectChip selected={role === "Other"} dashed onClick={() => setRole("Other")}>
            + Other
          </SelectChip>
        </div>
        <p className="t-label">Level</p>
        <div className={styles.row} role="radiogroup" aria-label="Level">
          {["Junior", "Mid", "Senior", "Lead"].map((name) => (
            <SelectChip key={name} shape="tile" selected={level === name} onClick={() => setLevel(name)}>
              {name}
            </SelectChip>
          ))}
        </div>
        <SelectChip selected={false} disabled>
          Disabled
        </SelectChip>
        <div className={styles.wrap}>
          <StatusPill tone="mint">Improved</StatusPill>
          <StatusPill tone="cream">Evidence 3</StatusPill>
          <StatusPill tone="pink">Hedging</StatusPill>
          <StatusPill tone="grey">Incomplete</StatusPill>
        </div>
        <div className={styles.wrap}>
          <Sticker tilt={-3}>No ramble</Sticker>
          <Sticker tone="white" tilt={2}>
            Day 4 streak
          </Sticker>
          <Sticker tilt={-2} icon={<ArrowIcon />}>
            No ramble
          </Sticker>
          <Sticker tone="white" tilt={2} icon={<span className={styles.flame}><FlameIcon /></span>}>
            Day 4 streak
          </Sticker>
          <Sticker tone="pink" tilt={-2}>
            Comeback ×2
          </Sticker>
          <Sticker tone="mint" tilt={2}>
            Filler free
          </Sticker>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <Card kind="hero" className={styles.meeraCard}>
          <Meera still={{ mood: "listening" }} size={92} />
          <div>
            <p className="t-title">Meera</p>
            <p className={styles.mutedSmall}>HR screen · direct, fair</p>
            <p className={styles.live}>
              <span className={styles.dot} /> Taking calls
            </p>
          </div>
        </Card>
        <div className={styles.row}>
          <InterviewerPlaceholder name="Arjun" />
          <InterviewerPlaceholder name="Lena" variant={1} />
        </div>
        <Card kind="cream" outlined raised>
          <Eyebrow>Your one thing</Eyebrow>
          <p className="t-card">End with the result</p>
          <p className="t-body">2 of 3 answers stopped before the outcome. Say what changed, with a number.</p>
        </Card>
        <Card kind="cream" outlined>
          <Eyebrow>From your last call</Eyebrow>
          <div className={styles.row}>
            <div className={styles.grow}>
              <p className="t-card">End with the result</p>
              <p className={styles.bodySmall}>5 min call, focused on this</p>
            </div>
            <Button variant="ink" size="compact">
              Practice this
            </Button>
          </div>
        </Card>
        <Card kind="calm">
          <p className={styles.mutedLabel}>Question 2 · Stakeholder pushback</p>
          <div className={styles.saidBubble}>
            <p className={styles.saidLabel}>You said</p>
            <p className="t-body">“…so I aligned everyone and we moved on to the next sprint.”</p>
          </div>
          <div className={styles.tryBubble}>
            <p className={styles.tryLabel}>Try this</p>
            <p className="t-body">“…vendors now log their own requests, and the ops queue dropped by [your number].”</p>
          </div>
        </Card>
        <Card kind="mint" className={styles.wellCard}>
          <StarIcon />
          <div>
            <Eyebrow tone="mint">What went well</Eyebrow>
            <p className="t-body">Clear, calm openers. You named the problem before the solution every time.</p>
          </div>
        </Card>
        <Card kind="placeholder">
          <p className="t-label">+ Job post</p>
          <p className={styles.mutedSmall}>Optional</p>
        </Card>
      </Section>

      <Section id="data" title="Skills and stats">
        <p className="t-label">
          Skills <span className={styles.mutedInline}>· the dark tick is your best</span>
        </p>
        <div className={styles.stack}>
          <SkillBar label="Structure" score={2} best={3} />
          <SkillBar label="Clarity" score={4} best={4} />
          <SkillBar label="Evidence" score={3} best={4} />
          <SkillBar label="Relevance" score={5} />
          <SkillBar label="Delivery" score={1} best={3} />
        </div>
        <div className={styles.row}>
          <StatTile value="142" label="words / min" />
          <StatTile value="2.1" label="fillers each" />
          <StatTile value="1:36" label="avg answer" />
        </div>
      </Section>

      <Section id="meera" title="Meera">
        <div className={styles.stage}>
          <Meera vm={liveVm} offline={offline} />
        </div>
        <p className="t-label">Mood</p>
        <div className={styles.wrap} role="radiogroup" aria-label="Mood">
          {moods.map((name) => (
            <SelectChip key={name} selected={mood === name} onClick={() => setMood(name)}>
              {name}
            </SelectChip>
          ))}
        </div>
        <label className={styles.slider}>
          <span className="t-label">mouthOpen {mouth}</span>
          <input type="range" min={0} max={100} value={mouth} onChange={(event) => setMouth(Number(event.target.value))} />
        </label>
        <p className="t-label">Triggers</p>
        <div className={styles.wrap}>
          {triggers.map((name) => (
            <Button key={name} variant="quiet" size="small" onClick={() => liveVm.fire(name)}>
              {name}
            </Button>
          ))}
        </div>
        <SelectChip selected={offline} role="switch" onClick={() => setOffline(!offline)}>
          Offline
        </SelectChip>
        <p className="t-label">Every expression</p>
        <div className={styles.stills}>
          {stills.map(({ label, still }) => (
            <figure key={label}>
              <Meera still={still} size={96} />
              <figcaption className="t-small">{label}</figcaption>
            </figure>
          ))}
          <figure>
            <Meera offline size={96} />
            <figcaption className="t-small">offline</figcaption>
          </figure>
        </div>
        <p className="t-label">Sizes</p>
        <div className={styles.sizes}>
          {[120, 92, 40, 30].map((size) => (
            <Meera key={size} still={{ mood: "listening" }} size={size} />
          ))}
        </div>
      </Section>

      <Section id="call" title="Call parts" tone="ink">
        <div className={styles.callTop}>
          <ProgressSegments total={3} current={2} />
          <CallPill>Question 2 of 3</CallPill>
        </div>
        <div className={styles.stageSmall}>
          <Meera still={{ mood: "listening", trigger: "checkWatch" }} size={200} />
          <Sticker tilt={-5} onDark className={styles.reaction}>
            Getting long
          </Sticker>
        </div>
        <p className={styles.callTitle}>Meera checks the time</p>
        <p className={styles.callSub}>Question 2 of 3 · land the result</p>
        <QuestionCard label="Meera asked">Tell me about a time a stakeholder pushed back on your design. How did it end?</QuestionCard>
        <div className={styles.controls}>
          <CallControl label="Mute">
            <MicIcon />
          </CallControl>
          <CallControl label="Turn camera on" pressed>
            <CameraIcon />
          </CallControl>
          <CallControl label="End" end />
        </div>
        <div className={styles.steps}>
          <p>
            <span className={styles.stepDone}>
              <CheckIcon />
            </span>
            Reading back your answers
          </p>
          <p className={styles.stepNow}>
            <span className={styles.stepRing} />
            Rewriting your weakest answers
          </p>
        </div>
      </Section>

      <Section id="sheet" title="Sheet">
        <Button variant="primary" block onClick={() => setSheetOpen(true)}>
          Open the sheet
        </Button>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Let's get you interview ready" showTitle>
          <div className={styles.stack}>
            <label className={styles.field}>
              <span className="t-label">Your name</span>
              <input placeholder="Optional" autoComplete="given-name" />
            </label>
            <label className={styles.field}>
              <span className="t-label">Job post</span>
              <textarea rows={4} placeholder="Paste it here" />
            </label>
            <div className={styles.wrap} role="radiogroup" aria-label="Level">
              {["Junior", "Mid", "Senior", "Lead"].map((name) => (
                <SelectChip key={name} selected={level === name} onClick={() => setLevel(name)}>
                  {name}
                </SelectChip>
              ))}
            </div>
            <Button variant="primary" block onClick={() => setSheetOpen(false)}>
              Close
            </Button>
          </div>
        </Sheet>
      </Section>

      <Section id="contrast" title="Contrast">
        <p className="t-body">Every text and background pair the components use, after the 8 Nov decisions. Each one passes.</p>
        <ul className={styles.pairs}>
          {pairs.map((pair) => (
            <li key={pair.where}>
              <span className={styles.pairSample} style={{ color: pair.text, background: pair.on }}>
                Aa
              </span>
              <span className={styles.pairText}>
                <span className="t-small">{pair.where}</span>
                <Ratio {...pair} />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tabs" title="Tab bar">
        <p className="t-body">Docked at the bottom. Tap to see the active state: these links go to routes built in phase 2.</p>
        <div className={styles.row} role="radiogroup" aria-label="Active tab">
          {[["/", "Home"], ["/history", "History"], ["/profile", "Profile"]].map(([href, label]) => (
            <SelectChip key={href} selected={tab === href} onClick={() => setTab(href)}>
              {label}
            </SelectChip>
          ))}
        </div>
      </Section>

      <TabBar current={tab} />
    </main>
  );
}
