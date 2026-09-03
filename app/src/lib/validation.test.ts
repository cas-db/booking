import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { garageIdError, tireSpecError } from './validation'

describe('tireSpec validation', () => {
  it('accepts the three seasons in the documented shape', () => {
    assert.equal(tireSpecError('205/55 R16 winter'), null)
    assert.equal(tireSpecError('195/65 R15 summer'), null)
    assert.equal(tireSpecError('225/45 R17 allseason'), null)
  })

  it('trims before validating', () => {
    assert.equal(tireSpecError('  205/55 R16 winter  '), null)
  })

  it('asks for a value when the field is empty', () => {
    assert.equal(tireSpecError('   '), 'a tire spec is required')
  })

  it('rejects an unknown season and a wrong shape', () => {
    assert.ok(tireSpecError('205/55 R16 autumn'))
    assert.ok(tireSpecError('205-55 R16 winter'))
    assert.ok(tireSpecError('20/55 R16 winter'))
  })
})

describe('garageId validation', () => {
  it('accepts GAR- plus two digits', () => {
    assert.equal(garageIdError('GAR-01'), null)
    assert.equal(garageIdError(' GAR-42 '), null)
  })

  it('asks for a value when the field is empty', () => {
    assert.equal(garageIdError(''), 'a garage is required')
  })

  it('rejects anything else', () => {
    assert.ok(garageIdError('GAR-1'))
    assert.ok(garageIdError('gar-01'))
    assert.ok(garageIdError('GARAGE-01'))
  })
})
