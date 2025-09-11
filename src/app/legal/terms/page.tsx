// src/app/legal/terms/page.tsx
import { SafeHydrate } from "@/components/shared/safe-hydrate";
import { getContent } from "@/lib/mock-db";
import { marked } from 'marked';

export default async function TermsOfServicePage() {
  const { terms } = await getContent();
  const htmlContent = marked(terms);
  return (
    <div>
      <h1>Terms of Service</h1>
      <p><em>Last updated: <SafeHydrate>{new Date().toLocaleDateString()}</SafeHydrate></em></p>
       <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}
