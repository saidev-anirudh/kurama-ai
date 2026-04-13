import { BlogList } from "@/components/blog/blog-list";
import { SceneShell } from "@/components/scenes/scene-shell";

export default function BlogPage() {
  return (
    <SceneShell scene="blog_archive">
      <BlogList />
    </SceneShell>
  );
}
