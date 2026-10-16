// fe-zen-arch's Input only types text-like inputs, but the browser date picker works the same way.
export const dateInputType = 'date' as 'text'

// Numbers are entered in text inputs on purpose. A browser number input rejects decimals unless it
// has a `step` attribute, which fe-zen-arch's Input does not expose, and the browser then silently
// blocks the whole submit (the original form could not save a unit price like 3.831). The rules in
// domain/validation.ts check numeric fields instead, with clear messages.
export const numberInputType = 'text'
