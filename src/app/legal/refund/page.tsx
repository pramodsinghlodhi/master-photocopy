// src/app/legal/refund/page.tsx
import { SafeHydrate } from "@/components/shared/safe-hydrate";
import { getContent } from "@/lib/mock-db";
import { marked } from 'marked';

export default async function RefundPolicyPage() {
  const { refund } = await getContent();
  const htmlContent = marked(refund);

  return (
    <div>
      <h1>Refund Policy</h1>
      <p><em>Last updated: <SafeHydrate>{new Date().toLocaleDateString()}</SafeHydrate></em></p>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}
