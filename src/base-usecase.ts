/**
 * Interface for a standard successful output structure.
 * T is the type of the successful data payload.
 */
export interface IUseCaseOutputSuccess<T> {
  status: 'success'
  data: T
}

// Define the structure of the standard error object for clarity
export interface IUseCaseError {
  code: number
  message: string
  name?: string
  status?: string
  errors?: {
    [key: string]: string[]
  }
}

/**
 * Interface for a standard failed output structure.
 * E is the type of the error details payload.
 */
export interface IUseCaseOutputFailed {
  status: 'failed',
  error: IUseCaseError
}

/**
 * Abstract Base Class for a Use Case.
 *
 * This class uses generics to define its dependencies, input, and output,
 * making it reusable for any business logic operation.
 *
 * @param IInput - The type of the data passed to the handle method.
 * @param IDependencies - The type of the injected dependencies.
 * @param ISuccessData - The type of data returned on success.
 */
export abstract class BaseUseCase<
  IInput,
  IDependencies,
  ISuccessData
> {
  protected readonly deps: IDependencies

  constructor(deps: IDependencies) {
    this.deps = deps
  }

  /**
   * Generates a standardized success output object.
   * @param data - The successful payload data (type ISuccessData).
   * @returns An IUseCaseOutputSuccess object.
   */
  protected success(data: ISuccessData): IUseCaseOutputSuccess<ISuccessData> {
    return { status: 'success', data }
  }

  /**
   * Generates a standardized failure output object.
   * @param error - The error details (type IUseCaseError).
   * @returns An IUseCaseOutputFailed object.
   */
  protected fail(error: IUseCaseError): IUseCaseOutputFailed {
    return { 
      status: 'failed',
      error: {
        name: 'ApiError',
        ...error
      } 
    }
  }

  /**
   * The core method that defines the use case's business logic.
   * Subclasses must implement this method.
   *
   * @param input - The data required to execute the use case (type IInput).
   * @returns A promise resolving to the use case's result.
   */
  public abstract handle(input: IInput): Promise<IUseCaseOutputSuccess<ISuccessData> | IUseCaseOutputFailed>
}