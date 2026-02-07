<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class DebugController extends Controller
{
    public function rlsContext()
    {
        $context = [];
        
        if (DB::connection()->getDriverName() === 'pgsql') {
            $context['organization_id'] = DB::selectOne("SELECT current_setting('app.organization_id', true) as val")->val ?? 'not set';
            $context['partner_id'] = DB::selectOne("SELECT current_setting('app.partner_id', true) as val")->val ?? 'not set';
            $context['is_platform_admin'] = DB::selectOne("SELECT current_setting('app.is_platform_admin', true) as val")->val ?? 'not set';
        }
        
        $context['user'] = auth()->user() ? [
            'id' => auth()->id(),
            'email' => auth()->user()->email,
            'organization_id' => auth()->user()->organization_id,
            'is_platform_admin' => auth()->user()->is_platform_admin,
        ] : null;
        
        // Test actual query
        $context['crm_stages_count'] = DB::table('crm_stages')->count();
        $context['contacts_count'] = DB::table('contacts')->count();
        
        return response()->json($context);
    }
}
