import { useState, type InputHTMLAttributes } from 'react'
import { parseNum } from '../lib/num'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> & {
  value: number | null | undefined
  /** Gets null when the box is cleared. Half-typed text that isn't a number yet is not sent. */
  onChange: (n: number | null) => void
  integer?: boolean
}

/**
 * Number box that takes a comma or a dot as the decimal mark. A type="number" input drops "7,5"
 * on iPhones set to comma locales, so this is a text input with the decimal keypad, keeping what
 * was typed while it still matches the saved value.
 */
export default function NumberInput({ value, onChange, integer = false, ...rest }: Props) {
  const [text, setText] = useState<string | null>(null)
  const saved = value ?? null
  const draftMatches = text != null && (parseNum(text, integer) === saved || (saved == null && !/\d/.test(text)))
  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      {...rest}
      value={draftMatches ? text : saved != null ? String(saved) : ''}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        if (raw.trim() === '') onChange(null)
        else {
          const n = parseNum(raw, integer)
          if (n != null) onChange(n)
        }
      }}
    />
  )
}
