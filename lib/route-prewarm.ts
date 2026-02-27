const routeWarmTasks = new Map<string, Promise<void>>();

function toRouteWarmKey(href: string) {
  if (href.startsWith("/mega-evolutions/stones")) {
    return "/mega-evolutions/stones";
  }
  if (href.startsWith("/mega-evolutions")) {
    return "/mega-evolutions";
  }
  if (href.startsWith("/characters")) {
    return "/characters";
  }
  return href;
}

function buildWarmTask(routeKey: string): Promise<unknown> | null {
  if (routeKey === "/characters") {
    return import("@/components/characters/CharacterIndexSection");
  }

  if (routeKey === "/mega-evolutions") {
    return Promise.all([
      import("@/components/mega/MegaEvolutionGrid"),
      import("@/components/mega/MegaEvolutionDrawer")
    ]);
  }

  if (routeKey === "/mega-evolutions/stones") {
    return import("@/components/mega/MegaStoneArchive");
  }

  return null;
}

export function prewarmRouteModules(href: string): Promise<void> {
  const normalizedHref = href.split("#")[0].split("?")[0];
  if (!normalizedHref) {
    return Promise.resolve();
  }

  const routeKey = toRouteWarmKey(normalizedHref);
  const cachedTask = routeWarmTasks.get(routeKey);
  if (cachedTask) {
    return cachedTask;
  }

  const warmTask = buildWarmTask(routeKey);
  if (!warmTask) {
    return Promise.resolve();
  }

  const task = warmTask
    .then(() => undefined)
    .catch(() => {
      // Ignore prewarm failures; this is optional optimization.
    });

  routeWarmTasks.set(routeKey, task);
  return task;
}

