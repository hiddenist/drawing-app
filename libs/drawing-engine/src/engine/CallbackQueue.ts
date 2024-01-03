export class CallbackQueue {
  private queue: Array<() => void | Promise<void>> = []
  private isProcessing = false
  private promise: Promise<void> | null = null

  public push(action: () => void | Promise<void>) {
    this.queue.push(action)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing) {
      return this.promise
    }
    this.promise = new Promise(async (resolve) => {
      this.isProcessing = true
      while (this.queue.length > 0) {
        const action = this.queue.shift()
        if (!action) {
          return
        }
        await Promise.resolve(action())
      }
      this.isProcessing = false
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
