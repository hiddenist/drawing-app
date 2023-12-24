export class Database<SchemaStoreNames extends string, Schema extends Record<SchemaStoreNames, any>> {
  protected constructor(protected db: IDBDatabase) {}

  public getStore<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return {
      save: (state: Schema[StoreName]) => this.save(storeName, state),
      count: () => this.count(storeName),
      get: (key: IDBValidKey) => this.get(storeName, key),
      getAll: () => this.getAll(storeName),
      delete: (key: IDBValidKey) => this.delete(storeName, key),
      deleteAll: () => this.deleteAll(storeName),
      getKeys: () => this.getKeys(storeName),
      getLastKey: () => this.getLastKey(storeName),
      getFirstKey: () => this.getFirstKey(storeName),
    }
  }

  protected getOrCreateStore<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const objectStore = transaction.objectStore(storeName)
    return objectStore
  }

  public save<StoreName extends SchemaStoreNames>(storeName: StoreName, state: Schema[StoreName]) {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.add(state)
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public count<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return new Promise<number>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.count()
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public get<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey) {
    return new Promise<Schema[StoreName]>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.get(key)
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public getAll<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return new Promise<Schema[StoreName][]>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.getAll()
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public delete<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.delete(key)
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public deleteAll<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.clear()
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public getKeys<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return new Promise<IDBValidKey[]>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.getAllKeys()
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }

  public async getLastKey<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const keys = await this.getKeys(storeName)
    return keys[keys.length - 1]
  }

  public async getFirstKey<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const keys = await this.getKeys(storeName)
    return keys[0]
  }

  static async create<SchemaStoreNames extends string, Schema extends Record<SchemaStoreNames, any>>(
    createSchemaCallback: (db: IDBDatabase) => void,
  ) {
    const db = await this.createDb(createSchemaCallback)
    return new Database<SchemaStoreNames, Schema>(db)
  }

  protected static createDb(createSchemaCallback: (db: IDBDatabase) => void) {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const idbRequest = indexedDB.open("drawing-engine", 1)
      idbRequest.addEventListener("onupgradeneeded", () => {
        const db = idbRequest.result
        createSchemaCallback(db)
        resolve(db)
      })

      idbRequest.addEventListener("success", () => {
        const db = idbRequest.result
        if (!db.version || db.version === idbRequest.result.version) {
          resolve(db)
        }
      })

      idbRequest.addEventListener("versionchange", () => {
        console.log("Database version changed")
      })

      idbRequest.addEventListener("close", () => {
        console.log("Database closed")
      })

      idbRequest.addEventListener("error", () => {
        reject(new Error("Could not open database"))
      })

      idbRequest.addEventListener("blocked", () => {
        reject(new Error("Database is blocked"))
      })

      idbRequest.addEventListener("abort", () => {
        reject(new Error("Database request was aborted"))
      })
    })
  }
}
