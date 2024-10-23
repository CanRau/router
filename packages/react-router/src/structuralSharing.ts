import type { IsAny, IsUnknown } from './utils'
import type { AnyRouter } from './router'

export type DefaultStructuralSharingOptionByRouter<TRouter extends AnyRouter> =
  boolean extends TRouter['options']['defaultStructuralSharing']
  // for now, default to false.
  // TODO in V2: default to true
    ? false
    : NonNullable<TRouter['options']['defaultStructuralSharing']>

// adapted from https://github.com/Microsoft/TypeScript/issues/1897#issuecomment-710744173

type primitive = null
    | boolean
    | number
    | string
    | undefined

type DefinitelyNotJsonable = ((...args: Array<any>) => any)

type Loose<T, TEnabled> =  IsAny<T, true> extends TEnabled ? T : IsUnknown<T> extends TEnabled ? T : never

// TODO make TLooseMode customizable
export type IsJsonable<T, TLooseMode = true> =
// Check if there are any non-jsonable types represented in the union
// Note: use of tuples in this first condition side-steps distributive conditional types
// (see https://github.com/microsoft/TypeScript/issues/29368#issuecomment-453529532)
[Extract<T, DefinitelyNotJsonable>] extends [never]
    // Non-jsonable type union was found empty
     ? T extends primitive
        // Primitive is acceptable
        ? T
        // Otherwise check if array
        : T extends Array<infer U>
            // Arrays are special; just check array element type
            ? Array<IsJsonable<U, TLooseMode>>
            // Otherwise check if object
            : T extends object
                // It's an object
                ? {
                    // Iterate over keys in object case
                    [P in keyof T]:
                        // Recursive call for children
                        IsJsonable<T[P], TLooseMode>
                }
                // Otherwise any other non-object no bueno
                :  Loose<T, TLooseMode>

    // Otherwise non-jsonable type union was found not empty
    : Loose<T, TLooseMode>

export type StructuralSharingOption<TRouter extends AnyRouter, TSelected> = 
// TODO make TLooseMode customizable
TSelected extends IsJsonable<TSelected>
    ? { structuralSharing?: boolean }
    : DefaultStructuralSharingOptionByRouter<TRouter> extends true
      ? { structuralSharing: false }
      : {
          structuralSharing?: false | undefined
        } 