import {
  IAggregateOutput,
  ICreateManyOutput,
  ICreateOutput,
  IDatabase,
  IDeleteManyOutput,
  IDeleteOutput,
  IDocument,
  IPipeline,
  IQuery,
  IRetrieveAllOutput,
  IUpdateManyOutput,
  IUpdateOutput
} from '../index'

export class DatabaseConnection implements IDatabase {
  session: unknown
  constructor(public adapter: IDatabase) {}
  public async open(): Promise<void> {
    await this.adapter.open()
  }
  public async close(): Promise<void> {
    await this.adapter.close()
  }
  public database(name: string): this {
    this.adapter.database(name)
    return this
  }
  public collection(name: string): this {
    this.adapter.collection(name)
    return this
  }
  public async listCollections(): Promise<{ name: string }[]> {
    return this.adapter.listCollections()
  }
  public startSession() {
    return this.adapter.startSession()
  }
  public async endSession() {
    await this.adapter.endSession()
  }
  public startTransaction() {
    this.adapter.startTransaction()
  }
  public async commitTransaction() {
    await this.adapter.commitTransaction()
  }
  public async abortTransaction() {
    await this.adapter.abortTransaction()
  }
  public async createIndex(name: string, spec: unknown, options?: unknown) {
    await this.adapter.createIndex(name, spec, options)
  }
  public async createCollection(name: string, options?: unknown) {
    await this.adapter.createCollection(name, options)
  }
  public async dropCollection(name: string, options?: unknown) {
    await this.adapter.dropCollection(name, options)
  }
  public async dropDatabase(options?: unknown) {
    await this.adapter.dropDatabase(options)
  }
  public async updateSchema(name: string, schema: unknown) {
    await this.adapter.updateSchema(name, schema)
  }
  public async command(document: IDocument, options?: unknown): Promise<IDocument> {
    return await this.adapter.command(document, options)
  }
  public async create(document: IDocument, options?: unknown): Promise<ICreateOutput> {
    return await this.adapter.create(document, options)
  }
  public async createMany(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput> {
    return await this.adapter.createMany(documents, options)
  }
  public async retrieveAll<TData>(query: IQuery, options?: unknown): Promise<IRetrieveAllOutput<TData>> {
    return await this.adapter.retrieveAll(query, options)
  }
  public async retrieve<TOutput extends object>(_id: string, options?: unknown): Promise<TOutput | null> {
    return await this.adapter.retrieve(_id, options)
  }
  public async update(filter: string | IDocument, document: IDocument, options?: unknown): Promise<IUpdateOutput> {
    return await this.adapter.update(filter, document, options)
  }
  public async updateMany(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateManyOutput> {
    return await this.adapter.updateMany(filter, document, options)
  }
  public async delete(_id: string, options?: unknown): Promise<IDeleteOutput> {
    return await this.adapter.delete(_id, options)
  }
  public async deleteMany(input: string[] | Record<string, unknown>, options?: unknown): Promise<IDeleteManyOutput> {
    return await this.adapter.deleteMany(input, options)
  }
  public async deleteAll(options?: unknown): Promise<IDeleteManyOutput> {
    return await this.adapter.deleteAll(options)
  }
  public async aggregate<TData>(pipeline: IPipeline[], query?: IQuery, options?: unknown): Promise<IAggregateOutput<TData>> {
    return await this.adapter.aggregate(pipeline, query, options)
  }
}
