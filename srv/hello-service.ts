import cds from '@sap/cds'

/**
 * Placeholder handler class. Keep the shape (default export, extends cds.ApplicationService,
 * handlers registered in init) and replace the content with your spec.
 */
export default class HelloService extends cds.ApplicationService {
  async init() {
    const { Greetings } = this.entities

    // Example of the one thing every service in the chain needs: a messaging connection.
    // Subscribe with messaging.on('<Event>', ...) and publish with messaging.emit('<Event>', {...}).
    await cds.connect.to('messaging')

    this.before('CREATE', Greetings, (req) => {
      if (!req.data.text?.trim()) req.reject(400, 'text must not be empty')
    })

    return super.init()
  }
}
