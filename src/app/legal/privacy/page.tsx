// src/app/legal/privacy/page.tsx
import { SafeHydrate } from "@/components/shared/safe-hydrate";
import { getContent } from "@/lib/mock-db";
import { marked } from 'marked';

export default async function PrivacyPolicyPage() {
  const { privacy } = await getContent();
  const htmlContent = marked(privacy);
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p><em>Last updated: <SafeHydrate>{new Date().toLocaleDateString()}</SafeHydrate></em></p>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}
