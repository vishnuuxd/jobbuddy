import { RetryResult } from "./RetryResult";

export default async function RetryResultPage({ params }: { params: Promise<{ id: string; q: string }> }) {
  const { id, q } = await params;
  return <RetryResult id={id} questionIndex={Number(q)} />;
}
