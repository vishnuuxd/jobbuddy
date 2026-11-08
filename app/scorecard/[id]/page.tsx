import { ScorecardScreen } from "./ScorecardScreen";

export default async function ScorecardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScorecardScreen id={id} />;
}
