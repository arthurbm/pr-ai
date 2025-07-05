declare module "bun:test" {
  /**
   * Defines a test case.
   * @param name Description of the test.
   * @param fn Test function. Can be sync or async.
   * @param timeout Optional timeout in milliseconds.
   */
  export function test(
    name: string,
    fn: () => unknown | Promise<unknown>,
    timeout?: number,
  ): void;

  /**
   * Jest-style expect matcher entry point. The real implementation lives in Bun.
   * These typings are intentionally loose – for stricter types rely on the Bun
   * built-in types when they become available.
   */
  export function expect(actual: unknown): any;

  /** Group related tests. */
  export function describe(name: string, fn: () => void): void;
}