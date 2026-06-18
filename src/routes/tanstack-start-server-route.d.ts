import type { AnyRequestMiddleware } from '@tanstack/start-client-core';
import type {
  AnyContext,
  AnyRoute,
  Constrain,
  Expand,
  ResolveAllParamsFromParent,
} from '@tanstack/router-core';

type RouteMethod =
  | 'ANY'
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

type RouteMethodNextResult<TContext> = {
  isNext: true;
  context: TContext;
};

type RouteMethodResult<TContext> =
  | Response
  | undefined
  | RouteMethodNextResult<TContext>;

type RouteMethodHandlerCtx<
  TParentRoute extends AnyRoute,
  TFullPath extends string,
  TParams,
> = {
  context: AnyContext;
  request: Request;
  params: Expand<ResolveAllParamsFromParent<TParentRoute, TParams>>;
  pathname: TFullPath;
  next: <TContext = undefined>(options?: {
    context?: TContext;
  }) => RouteMethodNextResult<TContext>;
};

type RouteMethodHandlerFn<
  TParentRoute extends AnyRoute,
  TFullPath extends string,
  TParams,
  TContext,
> = (
  ctx: RouteMethodHandlerCtx<TParentRoute, TFullPath, TParams>
) => RouteMethodResult<TContext> | Promise<RouteMethodResult<TContext>>;

type RouteServerOptions<
  TParentRoute extends AnyRoute,
  TFullPath extends string,
  TParams,
  TServerMiddlewares,
  THandlers,
> = {
  middleware?: Constrain<
    TServerMiddlewares,
    ReadonlyArray<AnyRequestMiddleware>
  >;
  handlers?: Constrain<
    THandlers,
    Partial<
      Record<
        RouteMethod,
        RouteMethodHandlerFn<TParentRoute, TFullPath, TParams, unknown>
      >
    >
  >;
};

declare module '@tanstack/router-core' {
  interface FilebaseRouteOptionsInterface<
    TRegister,
    TParentRoute extends AnyRoute = AnyRoute,
    TId extends string = string,
    TPath extends string = string,
    TSearchValidator = undefined,
    TParams = {},
    TLoaderDeps extends Record<string, any> = {},
    TLoaderFn = undefined,
    TRouterContext = {},
    TRouteContextFn = AnyContext,
    TBeforeLoadFn = AnyContext,
    TRemountDepsFn = AnyContext,
    TSSR = unknown,
    TServerMiddlewares = unknown,
    THandlers = undefined,
  > {
    server?: RouteServerOptions<
      TParentRoute,
      TPath,
      TParams,
      TServerMiddlewares,
      THandlers
    >;
  }
}
