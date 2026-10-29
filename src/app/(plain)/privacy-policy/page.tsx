import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Privacy Policy" };

// Placeholder so the solid header variant has a page; content comes with PR 12.
export default function PrivacyPolicy() {
  return (
    <Container className="py-16">
      <div className="prose-rotta">
        <h1>Privacy Policy</h1>
        <p>Content will be migrated from the current site.</p>
      </div>
    </Container>
  );
}
