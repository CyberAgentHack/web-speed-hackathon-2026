# Bundle Optimization Patterns for Next.js

## Table of Contents
1. [Proven High-Impact Patterns](#proven-high-impact-patterns)
2. [Dynamic Import (Code Splitting)](#dynamic-import)
3. [Heavy Library Dynamic Import](#heavy-library-dynamic-import)
4. [Conditional Provider Loading](#conditional-provider-loading)
5. [Heavy Library Replacement](#heavy-library-replacement)
6. [Image Optimization](#image-optimization)

---

## Proven High-Impact Patterns

These patterns have been verified to produce measurable bundle size reductions in this project (Next.js 16 + Turbopack + Pages Router + static export).

### 1. Conditional Auth Provider loading (verified: -1,791KB total)

When `_app.tsx` wraps with providers that vary by config (e.g., Auth0 vs Keycloak), **both** get bundled even if only one is used. Use `dynamic()` with a build-time condition:

```tsx
import dynamic from "next/dynamic";
import { env } from "@/env";

const AuthProviders =
  env.NEXT_PUBLIC_IDP_TYPE === "auth0"
    ? dynamic(async () => {
        const [{ MyAuth0Provider }, { MyAuth0ContextProvider }] =
          await Promise.all([
            import("@/providers/auth/MyAuth0Provider"),
            import("@/providers/auth/MyAuth0ContextProvider"),
          ]);
        return {
          default: ({ children }) => (
            <MyAuth0Provider>
              <MyAuth0ContextProvider>{children}</MyAuth0ContextProvider>
            </MyAuth0Provider>
          ),
        };
      })
    : dynamic(() =>
        import("@/providers/auth/MyKeycloakROPCGContextProvider").then(
          (m) => m.MyKeycloakROPCGContextProvider,
        ),
      );
```

**Why this works:** `output: "export"` means no SSR. The `dynamic()` default `ssr: false` is safe. The ternary uses `NEXT_PUBLIC_*` env which is inlined at build time, so tree-shaking eliminates the unused branch.

### 2. Route-specific heavy component dynamic import (verified: -504KB on /dashboard)

Components that pull heavy libraries (charts, rich editors, maps) and are only used on one route:

```tsx
import dynamic from "next/dynamic";

const NeedsChart = dynamic(() =>
  import("@/modules/dashboard/Charts/NeedsChart").then((m) => m.NeedsChart),
);
const ProjectChart = dynamic(() =>
  import("@/modules/dashboard/Charts/ProjectChart").then((m) => m.ProjectChart),
);
```

**When to apply:** The component imports a heavy library (`@mui/x-charts`, `react-map-gl`, etc.) and is only used on one page.

### 3. Utility library async dynamic import (verified: -102KB)

For libraries used in a single function (not at module scope), convert to async dynamic import:

```tsx
// Before
import { stringify } from "yaml";
export function convertToYaml(data: Data): string {
  return stringify(data);
}

// After
export async function convertToYaml(data: Data): Promise<string> {
  const { stringify } = await import("yaml");
  return stringify(data);
}
```

**When to apply:** A library is imported at module top-level but only used inside a function that can be made async. Update all call sites to `await`.

---

## NOT Effective (Next.js 15+)

These are handled automatically by Next.js 15+ and produce **zero measurable improvement**:

| Pattern | Why it doesn't help |
|---------|-------------------|
| `optimizePackageImports` for MUI | Already auto-applied for `@mui/*` |
| MUI icon barrel → deep import | Turbopack auto-resolves these |
| General barrel re-export elimination | `optimizePackageImports` covers popular packages |

**Always verify with a build.** If the diff is ±0, revert.

---

## Dynamic Import

### When to apply
- A component pulls a heavy library only used on that route
- A component is only visible after user interaction (modal, drawer, dialog)
- A feature is conditionally rendered (admin panel, feature-flagged)

### Pattern
```tsx
import dynamic from "next/dynamic";
const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
});
```

### MUI Dialog/Drawer pattern
```tsx
const ProjectDetailDrawer = dynamic(
  () => import("@/modules/projects/components/projectDetail/ProjectDetailDrawer")
    .then(mod => ({ default: mod.ProjectDetailDrawer })),
  { loading: () => null }
);
```

### Composing multiple dynamic imports
```tsx
// When a component needs multiple lazy-loaded modules
const ComposedProvider = dynamic(async () => {
  const [{ ProviderA }, { ProviderB }] = await Promise.all([
    import("@/providers/ProviderA"),
    import("@/providers/ProviderB"),
  ]);
  return {
    default: ({ children }) => (
      <ProviderA><ProviderB>{children}</ProviderB></ProviderA>
    ),
  };
});
```

---

## Heavy Library Dynamic Import

### When to apply
- A library is imported at module scope but only used inside a function
- The function can be made async without breaking the API

### Pattern
```tsx
// Convert sync function to async, move import inside
export async function formatData(data: unknown): Promise<string> {
  const { stringify } = await import("yaml");
  return stringify(data);
}
```

### Candidates to check
- `yaml`, `csv-parse`, `xlsx` — serialization libraries used in one place
- `date-fns/locale/*` — locale data imported statically
- `zod` schemas that import large validation libraries

---

## Heavy Library Replacement

### Common replacements

| Heavy Library | Lighter Alternative | Savings |
|---|---|---|
| `moment` | `dayjs` (already used) | ~60kB |
| `lodash` | `lodash-es` or native | ~70kB |
| `date-fns` (full) | `date-fns/format` (tree-shake) | ~50kB |
| `uuid` | `crypto.randomUUID()` | ~3kB |
| `axios` | `fetch` (native) | ~13kB |

---

## Image Optimization

### When to apply
- Large image assets in the bundle
- Unoptimized images loaded client-side

### Pattern
```tsx
import Image from "next/image";
<Image src="/photo.webp" width={800} height={600} alt="..." />
```

Note: This project uses `output: "export"` with `images.unoptimized: true`. Consider external image optimization service or pre-optimized assets.

---

## Pages Router Notes

This project uses Pages Router (`pages/` directory):
- Server Components are not applicable
- `dynamic()` defaults to `ssr: true` in Pages Router, but with `output: "export"` there is no SSR at runtime — all pages are pre-rendered
- The `_app.tsx` imports affect every route's shared base size — optimizing it has the highest leverage