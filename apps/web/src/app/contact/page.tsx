import { ContactCard } from "@/components/contact/contact-card";
import { SceneShell } from "@/components/scenes/scene-shell";

export default function ContactPage() {
  return (
    <SceneShell scene="contact_holo">
      <ContactCard />
    </SceneShell>
  );
}
