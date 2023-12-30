export class Database<SchemaStoreNames extends string, Schema extends Record<SchemaStoreNames, any>> {
  protected constructor(protected db: IDBDatabase) {}

  public getStore<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return {
      add: (state: Schema[StoreName]) => this.add(storeName, state),
      put: (key: IDBValidKey, state: Schema[StoreName]) => this.put(storeName, key, state),
      count: () => this.count(storeName),
      get: (key: IDBValidKey) => this.get(storeName, key),
      getAll: () => this.getAll(storeName),
      delete: (key: IDBValidKey) => this.delete(storeName, key),
      clear: () => this.clear(storeName),
      getAllKeys: () => this.getAllKeys(storeName),
      getLastKey: () => this.getLastKey(storeName),
      getFirstKey: () => this.getFirstKey(storeName),
    }
  }

  protected getOrCreateStore<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const objectStore = transaction.objectStore(storeName)
    return objectStore
  }

  public add<StoreName extends SchemaStoreNames>(storeName: StoreName, state: Schema[StoreName]) {
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

  public put<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey, state: Schema[StoreName]) {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite")
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.put(state, key)
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

  public clear<StoreName extends SchemaStoreNames>(storeName: StoreName) {
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

  public getAllKeys<StoreName extends SchemaStoreNames>(storeName: StoreName) {
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
    const keys = await this.getAllKeys(storeName)
    return keys[keys.length - 1]
  }

  public async getFirstKey<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const keys = await this.getAllKeys(storeName)
    return keys[0]
  }

  static async create<SchemaStoreNames extends string, Schema extends Record<SchemaStoreNames, any>>(
    dbname: string,
    createSchemaCallback: (db: IDBDatabase) => void,
    version?: number,
  ) {
    const db = await this.createDb(dbname, createSchemaCallback, version)
    return new Database<SchemaStoreNames, Schema>(db)
  }

  protected static createDb(
    dbname: string,
    createSchemaCallback: (db: IDBDatabase, resolve: () => void, reject: (error: Error) => void) => void,
    version?: number,
  ) {
    console.log("Creating db", dbname, version)
    return new Promise<IDBDatabase>((resolve, reject) => {
      const idbRequest = indexedDB.open(dbname, version)

      idbRequest.onupgradeneeded = () => {
        const db = idbRequest.result
        createSchemaCallback(db, () => resolve(db), reject)
      }

      idbRequest.onblocked = () => {
        reject(new Error("Database is blocked"))
      }

      idbRequest.addEventListener("success", () => {
        const db = idbRequest.result
        if (!version || db.version === version) {
          resolve(db)
        }

        db.onversionchange = () => {
          console.log("Database version changed")
        }

        db.onclose = () => {
          console.log("Database closed")
        }

        db.onabort = () => {
          reject(new Error("Database request was aborted"))
        }
      })

      idbRequest.addEventListener("error", () => {
        console.log("error")
        reject(new Error("Could not open database"))
      })
    })
  }
}
