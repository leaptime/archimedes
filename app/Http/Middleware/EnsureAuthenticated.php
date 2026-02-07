<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        // Simple check using session-based auth
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated (custom)'], 401);
        }

        // Set RLS context for PostgreSQL now that user is authenticated
        $this->setRlsContext(auth()->user());

        return $next($request);
    }

    /**
     * Set RLS context for authenticated user
     */
    protected function setRlsContext($user): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $organizationId = $user->organization_id ?? 0;
        $partnerId = $user->partner_id ?? 0;
        $isPlatformAdmin = $user->is_platform_admin ? 'true' : 'false';

        DB::unprepared("SET app.organization_id = '" . intval($organizationId) . "'");
        DB::unprepared("SET app.partner_id = '" . intval($partnerId) . "'");
        DB::unprepared("SET app.is_platform_admin = '" . $isPlatformAdmin . "'");
    }
}
