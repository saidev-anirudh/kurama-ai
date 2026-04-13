export function sceneFromRoute(route: string): "home_hud" | "timeline_hud" | "blog_archive" | "contact_holo" {
  if (route.startsWith("/career-timeline")) return "timeline_hud";
  if (route.startsWith("/blog")) return "blog_archive";
  if (route.startsWith("/contact")) return "contact_holo";
  return "home_hud";
}
