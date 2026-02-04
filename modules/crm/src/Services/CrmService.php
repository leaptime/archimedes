<?php

namespace Modules\Crm\Services;

use Illuminate\Support\Facades\DB;
use Modules\Crm\Models\Lead;
use Modules\Crm\Models\Stage;
use Modules\Crm\Models\Activity;

class CrmService
{
    /**
     * Get pipeline data for Kanban view
     */
    public function getPipeline(?int $userId = null, ?int $teamId = null, string $type = 'all'): array
    {
        $stages = Stage::orderBy('sequence')->get();
        
        $query = Lead::with(['user', 'contact', 'tags'])
            ->active();

        if ($type === 'lead') {
            $query->leads();
        } elseif ($type === 'opportunity') {
            $query->opportunities();
        }

        if ($userId) {
            $query->assignedTo($userId);
        }

        if ($teamId) {
            $query->inTeam($teamId);
        }

        $leads = $query->get()->groupBy('stage_id');

        $pipeline = [];
        foreach ($stages as $stage) {
            $stageLeads = $leads->get($stage->id, collect());
            $pipeline[] = [
                'stage' => $stage,
                'leads' => $stageLeads->values(),
                'count' => $stageLeads->count(),
                'total_revenue' => $stageLeads->sum('expected_revenue'),
                'weighted_revenue' => $stageLeads->sum('weighted_revenue'),
            ];
        }

        return $pipeline;
    }

    /**
     * Get pipeline statistics
     */
    public function getStats(?int $userId = null, ?int $teamId = null): array
    {
        $query = Lead::active();

        if ($userId) {
            $query->assignedTo($userId);
        }
        if ($teamId) {
            $query->inTeam($teamId);
        }

        $baseQuery = clone $query;

        // Open opportunities
        $openQuery = (clone $baseQuery)->opportunities()->open();
        $openCount = $openQuery->count();
        $openRevenue = $openQuery->sum('expected_revenue');
        $weightedRevenue = DB::table('crm_leads')
            ->join('crm_stages', 'crm_leads.stage_id', '=', 'crm_stages.id')
            ->where('crm_leads.type', 'opportunity')
            ->where('crm_leads.active', true)
            ->where('crm_stages.is_won', false)
            ->where('crm_stages.is_lost', false)
            ->when($userId, fn($q) => $q->where('crm_leads.user_id', $userId))
            ->when($teamId, fn($q) => $q->where('crm_leads.team_id', $teamId))
            ->selectRaw('SUM(expected_revenue * probability / 100) as weighted')
            ->value('weighted') ?? 0;

        // Won this month
        $wonThisMonth = (clone $baseQuery)->won()
            ->whereMonth('date_closed', now()->month)
            ->whereYear('date_closed', now()->year);
        $wonCount = $wonThisMonth->count();
        $wonRevenue = $wonThisMonth->sum('expected_revenue');

        // Lost this month
        $lostThisMonth = (clone $baseQuery)->lost()
            ->whereMonth('date_closed', now()->month)
            ->whereYear('date_closed', now()->year);
        $lostCount = $lostThisMonth->count();

        // Conversion rate
        $totalClosed = $wonCount + $lostCount;
        $winRate = $totalClosed > 0 ? round(($wonCount / $totalClosed) * 100, 1) : 0;

        // Leads to qualify
        $leadsCount = (clone $baseQuery)->leads()->count();

        // Overdue
        $overdueCount = (clone $baseQuery)->overdue()->count();

        // Closing this month
        $closingThisMonth = (clone $baseQuery)->open()->closingThisMonth()->sum('expected_revenue');

        // Activities due
        $activitiesDue = Activity::pending()
            ->when($userId, fn($q) => $q->where('user_id', $userId))
            ->whereDate('date_due', '<=', now()->toDateString())
            ->count();

        return [
            'open_count' => $openCount,
            'open_revenue' => round($openRevenue, 2),
            'weighted_revenue' => round($weightedRevenue, 2),
            'won_count' => $wonCount,
            'won_revenue' => round($wonRevenue, 2),
            'lost_count' => $lostCount,
            'win_rate' => $winRate,
            'leads_count' => $leadsCount,
            'overdue_count' => $overdueCount,
            'closing_this_month' => round($closingThisMonth, 2),
            'activities_due' => $activitiesDue,
        ];
    }

    /**
     * Move lead to a new stage
     */
    public function moveToStage(Lead $lead, int $stageId): Lead
    {
        $lead->moveTo($stageId);
        return $lead->fresh(['stage', 'user', 'contact', 'tags']);
    }

    /**
     * Assign lead to user
     */
    public function assignLead(Lead $lead, int $userId): Lead
    {
        $lead->assignTo($userId);
        return $lead->fresh(['stage', 'user', 'contact', 'tags']);
    }

    /**
     * Convert lead to opportunity
     */
    public function convertLead(Lead $lead): Lead
    {
        $lead->convertToOpportunity();
        return $lead->fresh(['stage', 'user', 'contact', 'tags']);
    }

    /**
     * Mark as won
     */
    public function markWon(Lead $lead, ?float $actualRevenue = null): Lead
    {
        $lead->markAsWon($actualRevenue);
        return $lead->fresh(['stage', 'user', 'contact', 'tags']);
    }

    /**
     * Mark as lost
     */
    public function markLost(Lead $lead, int $reasonId, ?string $feedback = null): Lead
    {
        $lead->markAsLost($reasonId, $feedback);
        return $lead->fresh(['stage', 'user', 'contact', 'tags', 'lostReason']);
    }

    /**
     * Reopen closed lead
     */
    public function reopen(Lead $lead): Lead
    {
        $lead->reopen();
        return $lead->fresh(['stage', 'user', 'contact', 'tags']);
    }

    /**
     * Schedule activity
     */
    public function scheduleActivity(Lead $lead, array $data): Activity
    {
        return $lead->activities()->create($data);
    }

    /**
     * Get forecast data
     */
    public function getForecast(?int $userId = null, ?int $teamId = null, int $months = 3): array
    {
        $forecast = [];
        
        for ($i = 0; $i < $months; $i++) {
            $month = now()->addMonths($i);
            $startOfMonth = $month->copy()->startOfMonth();
            $endOfMonth = $month->copy()->endOfMonth();
            
            $query = Lead::active()
                ->opportunities()
                ->open()
                ->whereBetween('date_deadline', [$startOfMonth, $endOfMonth]);

            if ($userId) {
                $query->assignedTo($userId);
            }
            if ($teamId) {
                $query->inTeam($teamId);
            }

            $leads = $query->get();
            
            $forecast[] = [
                'month' => $month->format('Y-m'),
                'month_name' => $month->format('F Y'),
                'count' => $leads->count(),
                'expected_revenue' => round($leads->sum('expected_revenue'), 2),
                'weighted_revenue' => round($leads->sum('weighted_revenue'), 2),
            ];
        }

        return $forecast;
    }

    /**
     * Get lost reasons analysis
     */
    public function getLostReasonsAnalysis(?int $userId = null, ?int $teamId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Lead::lost()
            ->whereNotNull('lost_reason_id')
            ->with('lostReason');

        if ($userId) {
            $query->assignedTo($userId);
        }
        if ($teamId) {
            $query->inTeam($teamId);
        }
        if ($startDate) {
            $query->where('date_closed', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date_closed', '<=', $endDate);
        }

        $leads = $query->get();
        $total = $leads->count();
        
        $byReason = $leads->groupBy('lost_reason_id')->map(function ($group) use ($total) {
            return [
                'reason' => $group->first()->lostReason->name,
                'count' => $group->count(),
                'percentage' => $total > 0 ? round(($group->count() / $total) * 100, 1) : 0,
                'lost_revenue' => round($group->sum('expected_revenue'), 2),
            ];
        })->sortByDesc('count')->values();

        return [
            'total_lost' => $total,
            'by_reason' => $byReason,
        ];
    }
}
