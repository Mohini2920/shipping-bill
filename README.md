## Export Software Frontend

Shipping Bill creation form, refactored for readability, maintainability and testability. Built on top of [fe-zen-arch](git@github.com:shivamkj/fe-zen-arch.git), the shared architecture for B2B SaaS frontends (included as a git submodule).

### Libraries

- **React** [Docs](https://react.dev/reference/react)
- **Tailwind CSS** [Docs](https://tailwindcss.com/docs/installation)
- **React Query** [Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- **React Hook Form** [Docs](https://www.react-hook-form.com/get-started)
- **Zustand** [Docs](https://zustand.docs.pmnd.rs/)

No dependencies were added during the refactor.

### Setup

```bash
git clone --recurse-submodules <repo-url>   # or: git submodule update --init
pnpm install
pnpm dev          # dev server on port 5173
pnpm lint-check   # prettier + tsc + eslint (fe-zen-arch lint pipeline; note it also rewrites formatting)
pnpm build        # production build
```

The submodule URL uses SSH, so cloning it needs a GitHub SSH key.

### Architecture

```
src/shipping-bills/
  domain/       Types, defaults, calculations and validation rules. No React, no I/O.
  api/          Service interfaces, index.ts (picks the implementation), react-query keys,
                and http/ (real-backend bill service, off by default)
  mock/         Mock backend: persisted in-memory db, seed data, network simulator, mock services
  hooks/        Small hooks: typed form access, form options context, debounced value
  components/   Form sections: AsyncSelect, PartyBranchFields, InvoiceCard, ItemFields, ChargeRow, tabs...
  pages/        Route component (loads data) and BillEditor (form state, tabs, save flow)
src/dashboard/  Shipping bill list
```

Data flows one way. The page loads the bill and the dropdown options through the services. `BillEditor` owns the react-hook-form state. Sections read the form from context and call services only through `api/`. No component imports mock data or the mock store.

### Mock services

- `api/types.ts` defines three Promise-based interfaces: `ShippingBillService` (list, get, save, flat file), `PartyService` and `ReferenceDataService`.
- `api/index.ts` is the only place that chooses an implementation. Swapping a mock for a real API changes that file, not the UI.
- Mocks reject with the same `InternalError` that `core/request` throws, so the UI handles mock and real failures the same way.
- A `bills` HTTP implementation built on `core/request` exists in `api/http/`. It is used only with `PUBLIC_BILL_API=http` and has not been run against a real server (none is available). Open contract questions are listed at the top of `bill-mapper.ts`.

**Testing loading, empty and error states.** Use the **Mock API** picker in the header (or set `shipping-bill-mock-scenario` in localStorage):

| Scenario      | Effect                                                                    |
| ------------- | ------------------------------------------------------------------------- |
| Normal        | 300 ms latency                                                            |
| Slow network  | 2.5 s latency, so loading states and double-submit protection are visible |
| Empty results | Lists and searches return nothing                                         |
| Loading fails | Reads fail with 503 (react-query retries twice before showing the error)  |
| Saving fails  | Saves fail with 503                                                       |

Mock data is stored in localStorage (`shipping-bill-mock-db-v1`). Delete that key to return to the seed data.

### Form handling and validation

- All rules and messages live in `domain/validation.ts`. fe-zen-arch applies schema rules by the last segment of a field path, so rules comparing two fields in the same list row are built per row there too.
- **Save & next** validates the current tab, then saves a draft. **Save shipping bill** validates everything and opens the tab with the first error.
- While a save is pending the form is disabled, which prevents duplicate submission. Save errors are shown on the form and in a toast. Saves are not retried automatically, because retrying a create could store it twice.

**Assumptions.** No customs rule set was provided, so these are deliberately light:

- RITC codes are 8 digits.
- Container numbers are 4 letters and 7 digits (ISO 6346).
- Rates are 0 to 100%. Amounts, weights and quantities cannot be negative, and quantity and unit price must be above zero.
- Net weight cannot exceed gross weight, and a packing range cannot end before it starts.
- An RBI waiver number needs a date, and a document cannot expire before it is issued.
- A branch is required once its party is chosen. Third parties are optional.
- Numbers are entered in text inputs. Browser number inputs reject decimals without a `step` attribute, which fe-zen-arch's `Input` does not expose; in the original form this silently blocked saving a price like 3.831.

### Behaviour changes from the starter

The form keeps its tabs, fields and flows. These differences are intentional:

- Bills created in the form now appear in the list. The starter saved them to one store and listed another.
- The seed data is 4 complete bills instead of 22 list-only rows, which opened as empty forms because they had no party ids.
- The buyer and third-party pickers list buyers and third parties. The starter listed consignees in both.
- **Save & next** validates the current tab before saving a draft. **Previous** only switches tab and no longer saves.
- The dashboard's "Sync from API" button is now "Refresh". It reloads the list through the bill service.
- About 30 fields with no input anywhere in the form were removed from the types.

### Notes

- `core`, `ui`, `auth`, `icons` are fe-zen-arch workspace packages, aliased via tsconfig paths and vite aliases. The submodule is not modified.
- Routing uses fe-zen-arch's zustand router: routes in `src/shared/routes.tsx`, paths in `src/shared/route-paths.ts`.
- Don't use react-query mutations for the react-hook-form submit handler.
- For HMR, a component file must export only React components.

### AI Usage & Approach

- **Tools:** Claude (Anthropic) in an agentic coding session with shell access to a local clone.
- **How it was used:** reading the starter code and the fe-zen-arch internals (form schema lookup, `Form` retry and disable behaviour, `core/request`), proposing a plan, writing the refactor in small commits, and running checks.
- **My judgment:** I reviewed the plan and the domain and service-contract code before they were applied, chose to keep a real HTTP implementation behind a flag, and asked to keep the scope to the assignment's requirements.
- **Validation:** `tsc` (0 errors; the starter had 6), `pnpm lint-check` (0 errors; the starter had 162 eslint errors), `pnpm build`, and 25 headless-browser checks with Playwright run outside the repo (no dependency added). The checks covered required fields, cross-field rules, drafts, submit, quick-add dialogs, double submit and every mock scenario.
- **Findings during validation:** each bug was reproduced before it was fixed.
  - The decimal-input bug was reproduced on the original code.
  - A dialog form rendered in a portal still bubbles its React submit event to the outer form, so the dialog stops propagation.
  - A final review found that saving before the marks-and-numbers options loaded erased the saved mark, because react-hook-form leaves disabled fields out of submitted values. It also found that errors inside a collapsed section stayed hidden. Both are fixed and covered by browser checks.
