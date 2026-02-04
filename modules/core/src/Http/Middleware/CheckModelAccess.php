<?php

namespace Modules\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Core\Services\PermissionService;
use Symfony\Component\HttpFoundation\Response;

class CheckModelAccess
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $model, ?string $operation = null): Response
    {
        // Determine operation from HTTP method if not specified
        $operation = $operation ?? $this->getOperationFromMethod($request->method());

        // Check permission
        if (!$this->permissionService->checkModelAccess($model, $operation)) {
            return response()->json([
                'message' => 'Access denied',
                'error' => "You don't have {$operation} permission on {$model}",
            ], 403);
        }

        return $next($request);
    }

    /**
     * Map HTTP method to operation
     */
    protected function getOperationFromMethod(string $method): string
    {
        return match (strtoupper($method)) {
            'GET', 'HEAD' => 'read',
            'POST' => 'create',
            'PUT', 'PATCH' => 'write',
            'DELETE' => 'unlink',
            default => 'read',
        };
    }
}
