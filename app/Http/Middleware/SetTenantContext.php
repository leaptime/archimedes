<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    /**
     * Handle an incoming request.
     * Sets the PostgreSQL session variables for Row-Level Security (RLS)
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            
            // Set the RLS context based on user type
            $this->setRlsContext($user);
        } else {
            // No authenticated user - set restrictive defaults
            $this->setDefaultContext();
        }

        return $next($request);
    }

    /**
     * Set RLS context for authenticated user
     */
    protected function setRlsContext($user): void
    {
        $organizationId = $user->organization_id ?? 0;
        $partnerId = $user->partner_id ?? 0;
        $isPlatformAdmin = $user->is_platform_admin ? 'true' : 'false';

        // For PostgreSQL, set session variables that RLS policies will check
        // Note: SET commands don't support prepared statements, so we use raw SQL
        // The values are sanitized integers/booleans so this is safe
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::unprepared("SET app.organization_id = '" . intval($organizationId) . "'");
            DB::unprepared("SET app.partner_id = '" . intval($partnerId) . "'");
            DB::unprepared("SET app.is_platform_admin = '" . $isPlatformAdmin . "'");
        }

        // Also store in request for use by application code
        $request = request();
        $request->attributes->set('tenant_organization_id', $organizationId);
        $request->attributes->set('tenant_partner_id', $partnerId);
        $request->attributes->set('tenant_is_platform_admin', $user->is_platform_admin);
    }

    /**
     * Set default restrictive context for unauthenticated requests
     */
    protected function setDefaultContext(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::unprepared("SET app.organization_id = '0'");
            DB::unprepared("SET app.partner_id = '0'");
            DB::unprepared("SET app.is_platform_admin = 'false'");
        }
    }

    /**
     * Terminate the middleware - clean up context
     */
    public function terminate(Request $request, Response $response): void
    {
        // Reset context after request completes
        if (DB::connection()->getDriverName() === 'pgsql') {
            try {
                DB::statement("RESET app.organization_id");
                DB::statement("RESET app.partner_id");
                DB::statement("RESET app.is_platform_admin");
            } catch (\Exception $e) {
                // Ignore errors during cleanup
            }
        }
    }
}
