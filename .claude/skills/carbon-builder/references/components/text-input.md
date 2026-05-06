# TextInput (and friends)

Carbon's text input family includes `TextInput`, `PasswordInput` (or `TextInput.PasswordInput`), `NumberInput`, `TextArea`, and `Search`. They share a labeling/validation API.

## React

```jsx
import { TextInput, PasswordInput, NumberInput, TextArea, Search } from '@carbon/react';

<TextInput
  id="email"
  labelText="Email address"
  placeholder="you@ibm.com"
  helperText="We'll never share your email"
  invalid={hasError}
  invalidText="Please enter a valid email"
  warn={hasWarning}
  warnText="This domain is known to bounce"
  size="md"
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

<PasswordInput
  id="password"
  labelText="Password"
  hidePasswordLabel="Hide"
  showPasswordLabel="Show"
/>

<NumberInput
  id="quantity"
  label="Quantity"
  min={0}
  max={100}
  step={1}
  value={5}
  invalidText="Out of range"
/>

<TextArea
  id="comment"
  labelText="Comments"
  placeholder="Type here..."
  rows={4}
  maxCount={500}
  enableCounter
/>

<Search
  id="search"
  labelText="Search"
  placeholder="Find a product"
  size="lg"
  onChange={handleChange}
  onClear={handleClear}
/>
```

### Key props

- `id` — required for label association
- `labelText` — required (for screen readers); use `hideLabel` to visually hide while preserving SR
- `placeholder` — short hint, NOT a label substitute
- `helperText` — guidance always visible below input
- `invalid` (bool) + `invalidText` (string) — error state and message
- `warn` (bool) + `warnText` — non-blocking warning
- `disabled`, `readOnly`
- `size` — `sm` | `md` | `lg` (default `md`)
- `type` — `text` | `email` | `tel` | `url` | `password` | `number` | `search` (HTML5 input types)
- `inline` (bool) — label sits beside input instead of above
- `light` (deprecated) — wrap in `<Layer>` instead
- `hideLabel` — visually hide label

### Validation timing pattern

```jsx
const [email, setEmail] = useState('');
const [touched, setTouched] = useState(false);
const isInvalid = touched && !isValidEmail(email);

<TextInput
  id="email"
  labelText="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={() => setTouched(true)}
  invalid={isInvalid}
  invalidText="Enter a valid email"
/>
```

## Web Components

```html
<cds-text-input
  id="email"
  label-text="Email address"
  placeholder="you@ibm.com"
  helper-text="We'll never share your email"
  type="email">
</cds-text-input>

<cds-text-input invalid invalid-text="Please enter a valid email" ...></cds-text-input>

<cds-textarea label-text="Comments" rows="4" enable-counter max-count="500"></cds-textarea>

<cds-search label-text="Search" placeholder="Find" size="lg"></cds-search>

<cds-number-input label="Quantity" min="0" max="100" step="1" value="5"></cds-number-input>

<cds-password-input label-text="Password"></cds-password-input>
```

Listen for changes:

```js
document.querySelector('cds-text-input').addEventListener('input', (e) => {
  console.log(e.target.value);
});
```

## Vanilla

```html
<div class="cds--form-item cds--text-input-wrapper">
  <label for="email" class="cds--label">Email address</label>
  <div class="cds--text-input__field-outer-wrapper">
    <div class="cds--text-input__field-wrapper">
      <input
        id="email"
        type="email"
        class="cds--text-input"
        placeholder="you@ibm.com" />
    </div>
    <div class="cds--form__helper-text">We'll never share your email</div>
  </div>
</div>

<!-- Invalid state -->
<div class="cds--form-item cds--text-input-wrapper cds--text-input-wrapper--inline">
  <label class="cds--label" for="email">Email</label>
  <div class="cds--text-input__field-outer-wrapper">
    <div class="cds--text-input__field-wrapper cds--text-input__field-wrapper--invalid">
      <input id="email" type="email" class="cds--text-input cds--text-input--invalid"
             aria-invalid="true" aria-describedby="email-error" />
      <svg class="cds--text-input__invalid-icon">...</svg>
    </div>
    <div id="email-error" class="cds--form-requirement">Please enter a valid email</div>
  </div>
</div>
```

## Fluid variant

When density is critical (sidebars, side panels, dense forms), use the fluid variants — the label collapses inside the field:

```jsx
<FluidTextInput
  id="email"
  labelText="Email"
  placeholder="you@ibm.com" />
```

```html
<cds-fluid-text-input id="email" label-text="Email"></cds-fluid-text-input>
```

Don't mix fluid and non-fluid inputs within a single form.

## Common patterns

### With character counter

```jsx
<TextArea
  id="bio"
  labelText="Bio"
  enableCounter
  maxCount={280}
  helperText="Tell us about yourself"
/>
```

### Read-only

```jsx
<TextInput id="x" labelText="Account ID" value="acct_12345" readOnly />
```

Visually different from disabled — borderless, but still focusable and copyable.

### As part of a Form

```jsx
import { Form, FormGroup, Stack, TextInput, Button } from '@carbon/react';

<Form onSubmit={handleSubmit}>
  <Stack gap={6}>
    <FormGroup legendText="Account">
      <Stack gap={5}>
        <TextInput id="email" labelText="Email" />
        <PasswordInput id="password" labelText="Password" />
      </Stack>
    </FormGroup>
    <Button type="submit">Sign in</Button>
  </Stack>
</Form>
```

`<Stack>` provides vertical rhythm without you computing margins. `<FormGroup>` groups related fields with a legend.

## Anti-patterns

- ❌ Using `placeholder` as the label (placeholders disappear when typing — accessibility fail).
- ❌ Inputs without `id` and `labelText`.
- ❌ Native `<input>` styled to look like Carbon — use `<TextInput>`.
- ❌ Custom validation icons — use `invalid` / `warn` props.
- ❌ Hardcoding height (`height: 40px`) — use `size` prop.
