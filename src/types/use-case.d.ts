interface IUseCase<TInput, TDeps, TOptions, TOutput> {
  handle(input: TInput, deps: TDeps, options?: TOptions): Promise<TOutput>
}
