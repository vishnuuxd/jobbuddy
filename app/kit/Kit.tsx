"use client";

import { useEffect, useState } from "react";
import { Meera, type MeeraStill } from "@/components/meera/Meera";
import { Button } from "@/components/ui/Button";
import { CallControl, CallPill, ProgressSegments, QuestionCard } from "@/components/ui/CallParts";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Badge, SelectChip, StatusPill, Tag } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader, HeroMeta } from "@/components/ui/HeroHeader";
import { CameraIcon, CloseIcon, FlameIcon, MedalIcon, MicIcon, TrashIcon } from "@/components/ui/icons";
import { InterviewerPlaceholder } from "@/components/ui/InterviewerPlaceholder";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Sheet } from "@/components/ui/Sheet";
import { SkillBar } from "@/components/ui/SkillBar";
import { StatTile } from "@/components/ui/StatTile";
import { TabBar } from "@/components/ui/TabBar";
import { createInterviewVM, moods, triggers, type Mood } from "@/lib/avatar/interviewVM";
import { contrast, passes } from "@/lib/ui/contrast";
import styles from "./kit.module.css";

const colours: [string, string][] = [
  ["plum", "#0B051D"], ["plum-raised", "#2C2242"], ["plum-line", "#373544"], ["lavender", "#AA89F2"],
  ["lime", "#E6FFA9"], ["lime-tint", "#F2FFD2"], ["pink", "#FFA8CD"], ["pink-tint", "#FFE4EF"],
  ["bone", "#F9F8F5"], ["white", "#FFFFFF"], ["line", "#E2E2E7"], ["muted", "#615F6D"],
  ["soft", "#75727F"], ["on-plum-muted", "#B3AFC2"], ["on-plum-soft", "#D9D5E6"], ["danger", "#B3192F"],
  ["danger-tint", "#FDECEE"],
];

// Text and background pairs the screens use, with the smallest size each appears at.
const pairs: { text: string; on: string; where: string; large: boolean }[] = [
  { text: "#0B051D", on: "#F9F8F5", where: "Text on bone", large: false },
  { text: "#0B051D", on: "#FFA8CD", where: "Plum on pink buttons", large: false },
  { text: "#0B051D", on: "#E6FFA9", where: "Plum on lime cards and tags", large: false },
  { text: "#373544", on: "#E6FFA9", where: "Eyebrows and body on lime", large: false },
  { text: "#0B051D", on: "#AA89F2", where: "Plum on lavender", large: false },
  { text: "#FFFFFF", on: "#0B051D", where: "White on plum", large: false },
  { text: "#D9D5E6", on: "#0B051D", where: "Greetings on plum", large: false },
  { text: "#B3AFC2", on: "#0B051D", where: "Meta lines on plum", large: false },
  { text: "#B3AFC2", on: "#2C2242", where: "Text on plum-raised", large: false },
  { text: "#AA89F2", on: "#0B051D", where: "Lavender on plum (streak number, /5)", large: true },
  { text: "#615F6D", on: "#FFFFFF", where: "Muted on white", large: false },
  { text: "#75727F", on: "#F9F8F5", where: "Soft meta on bone", large: false },
  { text: "#75727F", on: "#FFFFFF", where: "Soft meta on white", large: false },
  { text: "#B3192F", on: "#FDECEE", where: "Danger on danger tint", large: false },
  { text: "#0B051D", on: "#E2E2E7", where: "Grey pills", large: false },
];

const stills: { label: string; still: MeeraStill }[] = [
  { label: "listening", still: { mood: "listening" } },
  { label: "intake (hi)", still: { mood: "intake", posture: "soft" } },
  { label: "talking", still: { mood: "talking", mouthOpen: 70 } },
  { label: "skeptical", still: { mood: "skeptical" } },
  { label: "writing", still: { mood: "writing" } },
  { label: "checkWatch", still: { mood: "listening", trigger: "checkWatch" } },
  { label: "browRaise", still: { mood: "listening", trigger: "browRaise" } },
  { label: "expectant", still: { mood: "listening", trigger: "expectant" } },
  { label: "smile", still: { mood: "listening", trigger: "smile" } },
];

function Section({ id, title, children, tone }: { id: string; title: string; children: React.ReactNode; tone?: "plum" }) {
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

export function Kit() {
  const [liveVm] = useState(createInterviewVM);
  const [mood, setMood] = useState<Mood>("listening");
  const [mouth, setMouth] = useState(0);
  const [offline, setOffline] = useState(false);
  const [role, setRole] = useState("Product designer");
  const [level, setLevel] = useState("Senior");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("/");

  useEffect(() => liveVm.set({ mood, mouthOpen: mouth }), [liveVm, mood, mouth]);

  return (
    <main className={styles.kit}>
      <HeroHeader>
        <div className={styles.heroTop}>
          <HeroGreeting>Plum</HeroGreeting>
          <Tag icon={<FlameIcon />}>4 day streak</Tag>
        </div>
        <h1 className="t-hero">Kit</h1>
        <HeroMeta>Every v2 component and state, in Plum. Nothing here is wired to a call.</HeroMeta>
      </HeroHeader>

      <nav className={styles.toc} aria-label="Sections">
        {["colour", "type", "buttons", "chips", "cards", "data", "meera", "call", "sheet", "contrast"].map((id) => (
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
        <p className="t-hero">Hero 44</p>
        <p className="t-title">Section 30</p>
        <p className="t-card">Card title 22</p>
        <p className="t-body">Body 15. Meera sounds like a person, not a product.</p>
        <p className="t-small">Small 13</p>
        <p className="t-eyebrow">Eyebrow 12</p>
        <p className="t-label">Label 14</p>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className={styles.stack}>
          <Button variant="primary" size="big" block>
            Call Meera · 10 min
          </Button>
          <Button variant="primary" size="big" block data-pressed="">
            Pressed
          </Button>
          <Button
            variant="primary"
            size="big"
            block
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          >
            Tap for loading
          </Button>
          <Button variant="primary" size="big" block disabled>
            Disabled
          </Button>
          <Button variant="ink" size="small" block>
            New interview
          </Button>
          <div className={styles.pair}>
            <Button variant="quiet" size="small">
              Option
            </Button>
            <Button variant="danger" size="small">
              <TrashIcon />
              Remove
            </Button>
          </div>
          <div className={styles.row}>
            <Button variant="ink" size="compact">
              Practice this
            </Button>
            <Button variant="text">Save as PDF →</Button>
          </div>
        </div>
      </Section>
      <Section id="buttons-plum" title="Buttons on plum" tone="plum">
        <div className={styles.stack}>
          <Button variant="primary" size="big" onDark block>
            Reconnect
          </Button>
          <Button variant="secondary" size="small" onDark block>
            See your scorecard
          </Button>
          <Button variant="text" onDark>
            Back home
          </Button>
        </div>
      </Section>

      <Section id="chips" title="Chips, tags, badges, pills">
        <div className={styles.wrap} role="radiogroup" aria-label="Role">
          {["Product designer", "UX researcher", "Product manager"].map((name) => (
            <SelectChip key={name} selected={role === name} onClick={() => setRole(name)}>
              {name}
            </SelectChip>
          ))}
          <SelectChip selected={role === "Other"} dashed onClick={() => setRole("Other")}>
            + Other
          </SelectChip>
        </div>
        <div className={styles.row} role="radiogroup" aria-label="Level">
          {["Junior", "Mid", "Senior", "Lead"].map((name) => (
            <SelectChip key={name} shape="tile" selected={level === name} onClick={() => setLevel(name)}>
              {name}
            </SelectChip>
          ))}
        </div>
        <div className={styles.wrap}>
          <Tag icon={<FlameIcon />}>4 day streak</Tag>
          <Tag tone="white">Hi there!</Tag>
          <Tag tone="pink">Getting long</Tag>
          <Tag tone="plum">Focus · End with the result</Tag>
        </div>
        <div className={styles.wrap}>
          <Badge icon={<MedalIcon />}>No ramble</Badge>
          <Badge icon={<MedalIcon />}>Comeback ×2</Badge>
          <Badge icon={<FlameIcon size={18} />}>4 day streak</Badge>
        </div>
        <div className={styles.wrap}>
          <StatusPill tone="plum">+2</StatusPill>
          <StatusPill tone="lime">+1 Structure</StatusPill>
          <StatusPill tone="grey">Incomplete</StatusPill>
          <StatusPill tone="pink">No scorecard yet</StatusPill>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <Card kind="lime">
          <Eyebrow>Your one thing</Eyebrow>
          <p className="t-card">End with the result</p>
          <p className="t-body">2 of 3 answers stopped before the outcome. Say what changed, with a number.</p>
        </Card>
        <Card kind="lavender">
          <Eyebrow>What went well</Eyebrow>
          <p className="t-body">Clear, calm openers. You named the problem before the solution every time.</p>
        </Card>
        <Card kind="white">
          <p className={styles.mutedLabel}>Question 2 · Stakeholder pushback</p>
          <div className={styles.saidBubble}>
            <p className={styles.bubbleLabel}>You said</p>
            <p className="t-body">“…so I aligned everyone and we moved on to the next sprint.”</p>
          </div>
          <div className={styles.tryBubble}>
            <p className={styles.bubbleLabel}>Try this</p>
            <p className="t-body">“…vendors now log their own requests, and the ops queue dropped by [your number].”</p>
          </div>
        </Card>
        <Card kind="dashed">
          <p className="t-label">+ Job post</p>
          <p className={styles.mutedSmall}>Optional, paste it</p>
        </Card>
      </Section>

      <Section id="data" title="Skills, stats and the score">
        <Card kind="white" className={styles.skills}>
          <SkillBar label="Structure" score={2} best={3} />
          <SkillBar label="Clarity" score={4} best={4} />
          <SkillBar label="Evidence" score={3} best={4} />
          <SkillBar label="Delivery" score={5} />
        </Card>
        <div className={styles.tiles}>
          <StatTile value="142" label="words / min" />
          <StatTile value="2.1" label="fillers each" />
          <StatTile value="1:36" label="avg answer" />
        </div>
        <div className={styles.gaugeBox}>
          <ScoreGauge score={3.4} word="Getting there" />
          <p className={styles.gaugeWord}>Getting there</p>
        </div>
      </Section>

      <Section id="meera" title="Meera" tone="plum">
        <div className={styles.stage}>
          <Meera vm={liveVm} offline={offline} />
        </div>
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
        <div className={styles.wrap}>
          {triggers.map((name) => (
            <Button key={name} variant="secondary" size="small" onDark onClick={() => liveVm.fire(name)}>
              {name}
            </Button>
          ))}
        </div>
        <SelectChip selected={offline} role="switch" onClick={() => setOffline(!offline)}>
          Offline
        </SelectChip>
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
        <div className={styles.placeholders}>
          <InterviewerPlaceholder name="Arjun" />
          <InterviewerPlaceholder name="Lena" />
        </div>
      </Section>

      <Section id="call" title="Call parts" tone="plum">
        <div className={styles.callTop}>
          <ProgressSegments total={3} current={2} />
          <CallPill>Question 2 of 3</CallPill>
        </div>
        <QuestionCard label="Meera asked">Tell me about a time a stakeholder pushed back on your design. How did it end?</QuestionCard>
        <div className={styles.controls}>
          <div className={styles.row}>
            <CallControl label="Mute">
              <MicIcon />
            </CallControl>
            <CallControl label="Turn camera on" pressed>
              <CameraIcon />
            </CallControl>
          </div>
          <CallControl label="End call" end>
            <CloseIcon />
          </CallControl>
        </div>
      </Section>

      <Section id="sheet" title="Sheet">
        <Button variant="primary" size="big" block onClick={() => setSheetOpen(true)}>
          Open the sheet
        </Button>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Let's get you interview ready" showTitle largeTitle>
          <div className={styles.stack}>
            <label className={styles.field}>
              <span className="t-label">Job post</span>
              <textarea rows={4} placeholder="Paste it here" />
            </label>
            <Button variant="primary" size="big" block onClick={() => setSheetOpen(false)}>
              Close
            </Button>
          </div>
        </Sheet>
      </Section>

      <Section id="contrast" title="Contrast">
        <p className="t-body">Every text and background pair the components use.</p>
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
