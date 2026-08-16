type EventProperties = Record<string, string | number | boolean | undefined>;

type PlausibleWindow = typeof window & {
  plausible?: ((
    name: string,
    options?: { props?: EventProperties },
  ) => void) & {
    q?: unknown[][];
  };
};

export function initAnalytics() {
  const source = import.meta.env.VITE_ANALYTICS_SCRIPT;
  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN;
  if (
    !source ||
    !domain ||
    document.querySelector("script[data-versetip-analytics]")
  )
    return;

  const analyticsWindow = window as PlausibleWindow;
  analyticsWindow.plausible =
    analyticsWindow.plausible ||
    Object.assign(
      (...args: unknown[]) => {
        analyticsWindow.plausible!.q = analyticsWindow.plausible!.q || [];
        analyticsWindow.plausible!.q!.push(args);
      },
      { q: [] as unknown[][] },
    );

  const script = document.createElement("script");
  script.defer = true;
  script.src = source;
  script.dataset.domain = domain;
  script.dataset.versetipAnalytics = "true";
  document.head.append(script);
}

export function track(event: string, props: EventProperties = {}) {
  const plausible = (window as PlausibleWindow).plausible;
  plausible?.(event, { props });
  if (import.meta.env.DEV) console.info("[analytics]", event, props);
}
