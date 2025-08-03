export class CallbackQueue {
  private queue: Array<() => void | Promise<void>> = []
  private promise: Promise<void> | null = null

  public push(action: () => void | Promise<void>) {
    this.queue.push(action)
    this.processQueue()
  }

  private async processQueue() {
    await this.promise
    this.promise = new Promise(async (resolve) => {
      while (this.queue.length > 0) {
        const action = this.queue.shift()
        if (!action) {
          return
        }
        try {
          await Promise.resolve(action())
        } catch (e) {
          console.error(e)
        }
      }
      resolve()
    })
    return this.promise
  }

  public async wait() {
    return this.processQueue()
  }

  public clear() {
    this.queue = []
  }
}
