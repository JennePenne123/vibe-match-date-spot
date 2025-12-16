import { describe, it, expect } from 'vitest'
import { safeFirst, safeFirstWord, getInitials, isDefined, safeGet } from './utils'

describe('safeFirst', () => {
  it('returns first element from non-empty array', () => {
    expect(safeFirst([1, 2, 3])).toBe(1)
    expect(safeFirst(['a', 'b'])).toBe('a')
    expect(safeFirst([{ id: 1 }])).toEqual({ id: 1 })
  })

  it('returns undefined for empty array', () => {
    expect(safeFirst([])).toBeUndefined()
  })

  it('returns undefined for null input', () => {
    expect(safeFirst(null)).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(safeFirst(undefined)).toBeUndefined()
  })
})

describe('safeFirstWord', () => {
  it('returns first word from multi-word string', () => {
    expect(safeFirstWord('John Doe')).toBe('John')
    expect(safeFirstWord('Hello World Test')).toBe('Hello')
  })

  it('returns the string itself for single-word strings', () => {
    expect(safeFirstWord('John')).toBe('John')
  })

  it('returns fallback for null input', () => {
    expect(safeFirstWord(null)).toBe('')
    expect(safeFirstWord(null, 'Unknown')).toBe('Unknown')
  })

  it('returns fallback for undefined input', () => {
    expect(safeFirstWord(undefined)).toBe('')
    expect(safeFirstWord(undefined, 'Guest')).toBe('Guest')
  })

  it('returns fallback for empty string', () => {
    expect(safeFirstWord('')).toBe('')
    expect(safeFirstWord('', 'Default')).toBe('Default')
  })

  it('uses custom fallback when provided', () => {
    expect(safeFirstWord(null, 'Custom')).toBe('Custom')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('handles multiple names', () => {
    expect(getInitials('John Paul Doe')).toBe('JPD')
  })

  it('returns "?" for null input', () => {
    expect(getInitials(null)).toBe('?')
  })

  it('returns "?" for undefined input', () => {
    expect(getInitials(undefined)).toBe('?')
  })

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?')
  })

  it('converts to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD')
  })

  it('handles names with extra spaces', () => {
    expect(getInitials('John  Doe')).toBe('JD')
  })
})

describe('isDefined', () => {
  it('returns true for defined string values', () => {
    expect(isDefined('hello')).toBe(true)
    expect(isDefined('')).toBe(true)
  })

  it('returns true for defined number values', () => {
    expect(isDefined(42)).toBe(true)
    expect(isDefined(0)).toBe(true)
  })

  it('returns true for defined boolean values', () => {
    expect(isDefined(true)).toBe(true)
    expect(isDefined(false)).toBe(true)
  })

  it('returns true for objects and arrays', () => {
    expect(isDefined({})).toBe(true)
    expect(isDefined([])).toBe(true)
  })

  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false)
  })

  it('works as type guard in filter operations', () => {
    const arr: (string | null | undefined)[] = ['a', null, 'b', undefined, 'c']
    const filtered = arr.filter(isDefined)
    expect(filtered).toEqual(['a', 'b', 'c'])
  })
})

describe('safeGet', () => {
  it('returns property value when object exists', () => {
    const obj = { name: 'John', age: 30 }
    expect(safeGet(obj, 'name', 'Unknown')).toBe('John')
    expect(safeGet(obj, 'age', 0)).toBe(30)
  })

  it('returns fallback for null object', () => {
    expect(safeGet(null, 'name', 'Unknown')).toBe('Unknown')
  })

  it('returns fallback for undefined object', () => {
    expect(safeGet(undefined, 'name', 'Unknown')).toBe('Unknown')
  })

  it('returns fallback when property is undefined', () => {
    const obj = { name: 'John' } as { name: string; age?: number }
    expect(safeGet(obj, 'age', 0)).toBe(0)
  })

  it('handles nested property access with fallback', () => {
    const obj = { user: { name: 'John' } }
    expect(safeGet(obj, 'user', { name: 'Unknown' })).toEqual({ name: 'John' })
  })
})
