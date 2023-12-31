interface IDBObjectStoreSchema extends IDBObjectStoreParameters {
  fields?: Record<string, IDBIndexParameters>
}

export class Database<SchemaStoreNames extends string, Schema extends Record<SchemaStoreNames, any>> {
  protected constructor(protected db: IDBDatabase) {}

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
    return new Promise<IDBDatabase>((resolve, reject) => {
      const idbRequest = indexedDB.open(dbname, version)

      idbRequest.onupgradeneeded = () => {
        const db = idbRequest.result
        createSchemaCallback(db, () => resolve(db), reject)
      }

      idbRequest.onblocked = () => {
        reject(new Error("Database is blocked"))
      }

      idbRequest.onsuccess = () => {
        const db = idbRequest.result
        if (!version || db.version === version) {
          resolve(db)
        }

        db.onversionchange = () => {
          console.debug("Database version changed")
        }

        db.onclose = () => {
          console.debug("Database closed")
        }

        db.onabort = () => {
          reject(new Error("Database request was aborted"))
        }
      }

      idbRequest.onerror = () => {
        reject(new Error("Could not open database"))
      }
    })
  }

  protected static createObjectStoreAsync(db: IDBDatabase, storeName: string, schema: IDBObjectStoreSchema = {}) {
    const { fields = {}, ...options } = schema
    return new Promise<IDBObjectStore>((resolve, reject) => {
      const store = db.createObjectStore(storeName, options)

      for (const [fieldName, fieldOptions] of Object.entries(fields)) {
        store.createIndex(fieldName, fieldName, fieldOptions)
      }

      store.transaction.oncomplete = () => {
        resolve(store)
      }
      store.transaction.onerror = () => {
        reject(new Error("Could not create object store"))
      }
    })
  }

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

  public get<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readonly").get(key))
  }

  public getAll<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readonly").getAll())
  }

  public getAllKeys<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readonly").getAllKeys())
  }

  public count<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readonly").count())
  }

  public add<StoreName extends SchemaStoreNames>(storeName: StoreName, state: Schema[StoreName]) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readwrite").add(state))
  }

  public put<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey, state: Schema[StoreName]) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readwrite").put(state, key))
  }

  public delete<StoreName extends SchemaStoreNames>(storeName: StoreName, key: IDBValidKey) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readwrite").delete(key))
  }

  public clear<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    return this.promisifyRequest(this.getObjectStore(storeName, "readwrite").clear())
  }

  public async getLastKey<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const keys = await this.getAllKeys(storeName)
    return keys[keys.length - 1]
  }

  public async getFirstKey<StoreName extends SchemaStoreNames>(storeName: StoreName) {
    const keys = await this.getAllKeys(storeName)
    return keys[0]
  }

  private getObjectStore<StoreName extends SchemaStoreNames>(storeName: StoreName, access: IDBTransactionMode) {
    const transaction = this.db.transaction(storeName, access)
    const objectStore = transaction.objectStore(storeName)
    return objectStore
  }

  private promisifyRequest<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
      request.addEventListener("success", () => {
        resolve(request.result)
      })
      request.addEventListener("error", () => {
        reject(request.error)
      })
    })
  }
}
