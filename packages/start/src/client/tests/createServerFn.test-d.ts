import { expectTypeOf, test } from 'vitest'
import { createServerFn } from '../createServerFn'
import { createMiddleware } from '../createMiddleware'

test('createServerFn without middleware', () => {
  createServerFn({ method: 'GET' }).handler((options) => {
    expectTypeOf(options).toEqualTypeOf<{
      method: 'GET'
      context: never
      input: never
    }>()
  })
})

test('createServerFn with input', () => {
  createServerFn({ method: 'GET' })
    .input(() => ({
      a: 'a',
    }))
    .handler((options) => {
      expectTypeOf(options).toEqualTypeOf<{
        method: 'GET'
        context: never
        input: {
          a: string
        }
      }>()
    })
})

test('createServerFn with middleware and context', () => {
  const middleware1 = createMiddleware({ id: 'middleware1' }).use(
    ({ next }) => {
      return next({ context: { a: 'a' } as const })
    },
  )

  const middleware2 = createMiddleware({ id: 'middleware2' }).use(
    ({ next }) => {
      return next({ context: { b: 'b' } as const })
    },
  )

  const middleware3 = createMiddleware({ id: 'middleware3' }).middleware([
    middleware1,
    middleware2,
  ])

  createServerFn({ method: 'GET' })
    .middleware([middleware3])
    .handler((options) => {
      expectTypeOf(options).toEqualTypeOf<{
        method: 'GET'
        context: {
          readonly a: 'a'
          readonly b: 'b'
        }
        input: never
      }>()
    })
})

test('createServerFn with middleware and input', async () => {
  const middleware1 = createMiddleware({ id: 'middleware1' }).input(
    () =>
      ({
        a: 'a',
      }) as const,
  )

  const middleware2 = createMiddleware({ id: 'middleware2' }).input(
    () =>
      ({
        b: 'b',
      }) as const,
  )

  const middleware3 = createMiddleware({ id: 'middleware3' }).middleware([
    middleware1,
    middleware2,
  ])

  const fn = createServerFn({ method: 'GET' })
    .middleware([middleware3])
    .input(
      () =>
        ({
          c: 'c',
        }) as const,
    )
    .handler((options) => {
      expectTypeOf(options).toEqualTypeOf<{
        method: 'GET'
        context: never
        input: {
          readonly a: 'a'
          readonly b: 'b'
          readonly c: 'c'
        }
      }>()

      return 'data' as const
    })

  expectTypeOf(fn).parameter(0).toEqualTypeOf<{
    data: {
      readonly a: 'a'
      readonly b: 'b'
      readonly c: 'c'
    }
    requestInit?: RequestInit
  }>()

  expectTypeOf(fn).returns.resolves.toEqualTypeOf<'data'>()
})

test('createServerFn where input is a primitive', () => {
  createServerFn({ method: 'GET' })
    .input(() => 'c' as const)
    .handler((options) => {
      expectTypeOf(options).toEqualTypeOf<{
        method: 'GET'
        context: never
        input: 'c'
      }>()
    })
})

test('createServerFn where input is optional', () => {
  const fn = createServerFn({ method: 'GET' })
    .input(() => 'c' as 'c' | undefined)
    .handler((options) => {
      expectTypeOf(options).toEqualTypeOf<{
        method: 'GET'
        context: never
        input: 'c' | undefined
      }>()
    })

  expectTypeOf(fn).parameter(0).toEqualTypeOf<
    | {
        data?: 'c'
        requestInit?: RequestInit
      }
    | undefined
  >()
})
