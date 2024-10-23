import * as React from 'react'
import invariant from 'tiny-invariant'
import { useRouterState } from './useRouterState'
import { matchContext } from './matchContext'
import type { StructuralSharingOption } from './structuralSharing'
import type { AnyRouter, RegisteredRouter } from './router'
import type { AnyRoute } from './route'
import type { MakeRouteMatch } from './Matches'
import type { RouteIds } from './routeInfo'
import type { Constrain, StrictOrFrom } from './utils'

export type UseMatchOptions<
  TRouter extends AnyRouter,
  TFrom,
  TStrict extends boolean,
  TRouteMatch,
  TSelected,
  TThrow extends boolean,
> = StrictOrFrom<TFrom, TStrict> & {
  select?: (state: TRouteMatch) => TSelected
  shouldThrow?: TThrow
} & StructuralSharingOption<TRouter, TSelected>

export function useMatch<
TRouter extends AnyRouter = RegisteredRouter,
  TRouteTree extends AnyRoute = TRouter['routeTree'],
  TFrom extends string | undefined = undefined,
  TStrict extends boolean = true,
  TRouteMatch = MakeRouteMatch<TRouteTree, TFrom, TStrict>,
  TSelected = TRouteMatch,
  TThrow extends boolean = true,
>(
  opts: UseMatchOptions<
  TRouter,
    Constrain<TFrom, RouteIds<TRouteTree>>,
    TStrict,
    TRouteMatch,
    TSelected,
    TThrow
  >,
): TThrow extends true ? TSelected : TSelected | undefined {
  const nearestMatchId = React.useContext(matchContext)

  const matchSelection = useRouterState<TRouter, TRouteTree>({
    select: (state) => {
      const match = state.matches.find((d) =>
        opts.from ? opts.from === d.routeId : d.id === nearestMatchId,
      )
      invariant(
        !((opts.shouldThrow ?? true) && !match),
        `Could not find ${opts.from ? `an active match from "${opts.from}"` : 'a nearest match!'}`,
      )

      if (match === undefined) {
        return undefined
      }

      return opts.select ? opts.select(match as any) : match
    },
    structuralSharing: opts.structuralSharing as any,
  })

  return matchSelection as TSelected
}
