import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import cds from '@sap/cds'

const test = cds.test('.')
const { GET, POST } = test

describe('HelloService', () => {
  it('lists the seeded greeting', async () => {
    const { data } = await GET('/hello/Greetings')
    assert.equal(data.value.length, 1)
    assert.equal(data.value[0].text, 'Hello, workshop')
  })

  it('rejects an empty greeting', async () => {
    await assert.rejects(POST('/hello/Greetings', { text: '  ' }), /400/)
  })
})
