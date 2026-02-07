<?php

namespace Modules\Crm\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Crm\Models\Lead;
use Modules\Crm\Models\Stage;
use Modules\Crm\Models\Team;
use Modules\Crm\Models\Activity;
use Modules\Crm\Models\Tag;
use Modules\Crm\Models\LostReason;
use Modules\Crm\Services\CrmService;
use Modules\Core\Traits\HasModelPermissions;

class CrmController extends Controller
{
    use HasModelPermissions;

    protected ?string $modelIdentifier = 'crm.lead';

    public function __construct(
        private CrmService $crmService
    ) {}

    // =========================================================================
    // PIPELINE
    // =========================================================================

    public function pipeline(Request $request): JsonResponse
    {
        $pipeline = $this->crmService->getPipeline(
            $request->input('user_id'),
            $request->input('team_id'),
            $request->input('type', 'opportunity')
        );

        return response()->json(['data' => $pipeline]);
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->crmService->getStats(
            $request->input('user_id'),
            $request->input('team_id')
        );

        return response()->json(['data' => $stats]);
    }

    public function forecast(Request $request): JsonResponse
    {
        $forecast = $this->crmService->getForecast(
            $request->input('user_id'),
            $request->input('team_id'),
            $request->input('months', 3)
        );

        return response()->json(['data' => $forecast]);
    }

    // =========================================================================
    // LEADS
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAccess('read')) {
            return $denied;
        }

        $query = Lead::with(['stage', 'user', 'team', 'contact', 'tags'])
            ->withRecordRules('read')
            ->active();

        // Type filter
        if ($request->filled('type')) {
            if ($request->type === 'lead') {
                $query->leads();
            } elseif ($request->type === 'opportunity') {
                $query->opportunities();
            }
        }

        // Status filter
        if ($request->filled('status')) {
            match ($request->status) {
                'open' => $query->open(),
                'won' => $query->won(),
                'lost' => $query->lost(),
                default => null,
            };
        }

        // Stage filter
        if ($request->filled('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        // User filter
        if ($request->filled('user_id')) {
            if ($request->user_id === 'unassigned') {
                $query->unassigned();
            } else {
                $query->assignedTo($request->user_id);
            }
        }

        // Team filter
        if ($request->filled('team_id')) {
            $query->inTeam($request->team_id);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('partner_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDir);

        // Pagination
        $perPage = min($request->input('per_page', 25), 100);
        $leads = $query->paginate($perPage);

        return response()->json($leads);
    }

    public function show(int $id): JsonResponse
    {
        $lead = Lead::with([
            'stage',
            'user',
            'team',
            'contact',
            'tags',
            'lostReason',
            'activities' => fn($q) => $q->orderBy('date_due'),
            'activities.user',
            'createdBy',
        ])->findOrFail($id);

        return response()->json(['data' => $lead]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'sometimes|in:lead,opportunity',
            'priority' => 'sometimes|integer|min:0|max:3',
            'stage_id' => 'sometimes|exists:crm_stages,id',
            'user_id' => 'nullable|exists:users,id',
            'team_id' => 'nullable|exists:crm_teams,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'contact_name' => 'nullable|string|max:255',
            'partner_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'function' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country_code' => 'nullable|string|size:2',
            'expected_revenue' => 'nullable|numeric|min:0',
            'currency_code' => 'nullable|string|size:3',
            'recurring_revenue' => 'nullable|numeric|min:0',
            'recurring_plan' => 'nullable|in:monthly,quarterly,yearly',
            'date_deadline' => 'nullable|date',
            'source' => 'nullable|string|max:100',
            'medium' => 'nullable|string|max:100',
            'campaign' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:crm_tags,id',
        ]);

        $validated['created_by'] = auth()->id();
        
        if ($validated['user_id'] ?? null) {
            $validated['date_open'] = now();
        }

        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $lead = Lead::create($validated);

        if (!empty($tagIds)) {
            $lead->tags()->sync($tagIds);
        }

        return response()->json([
            'data' => $lead->fresh(['stage', 'user', 'team', 'contact', 'tags'])
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:lead,opportunity',
            'priority' => 'sometimes|integer|min:0|max:3',
            'stage_id' => 'sometimes|exists:crm_stages,id',
            'probability' => 'sometimes|integer|min:0|max:100',
            'user_id' => 'nullable|exists:users,id',
            'team_id' => 'nullable|exists:crm_teams,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'contact_name' => 'nullable|string|max:255',
            'partner_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'function' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country_code' => 'nullable|string|size:2',
            'expected_revenue' => 'nullable|numeric|min:0',
            'currency_code' => 'nullable|string|size:3',
            'recurring_revenue' => 'nullable|numeric|min:0',
            'recurring_plan' => 'nullable|in:monthly,quarterly,yearly',
            'date_deadline' => 'nullable|date',
            'source' => 'nullable|string|max:100',
            'medium' => 'nullable|string|max:100',
            'campaign' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:crm_tags,id',
        ]);

        // Handle assignment
        if (isset($validated['user_id']) && $validated['user_id'] !== $lead->user_id) {
            if ($validated['user_id'] && !$lead->date_open) {
                $validated['date_open'] = now();
            }
        }

        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        $lead->update($validated);

        if ($tagIds !== null) {
            $lead->tags()->sync($tagIds);
        }

        return response()->json([
            'data' => $lead->fresh(['stage', 'user', 'team', 'contact', 'tags'])
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);
        $lead->delete();

        return response()->json(null, 204);
    }

    // =========================================================================
    // LEAD ACTIONS
    // =========================================================================

    public function moveStage(Request $request, int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'stage_id' => 'required|exists:crm_stages,id',
        ]);

        $lead = $this->crmService->moveToStage($lead, $validated['stage_id']);

        return response()->json(['data' => $lead]);
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $lead = $this->crmService->assignLead($lead, $validated['user_id']);

        return response()->json(['data' => $lead]);
    }

    public function convert(int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        if ($lead->type !== Lead::TYPE_LEAD) {
            return response()->json(['message' => 'Already an opportunity'], 422);
        }

        $lead = $this->crmService->convertLead($lead);

        return response()->json(['data' => $lead]);
    }

    public function markWon(Request $request, int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'actual_revenue' => 'nullable|numeric|min:0',
        ]);

        $lead = $this->crmService->markWon($lead, $validated['actual_revenue'] ?? null);

        return response()->json(['data' => $lead]);
    }

    public function markLost(Request $request, int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'lost_reason_id' => 'required|exists:crm_lost_reasons,id',
            'feedback' => 'nullable|string',
        ]);

        $lead = $this->crmService->markLost($lead, $validated['lost_reason_id'], $validated['feedback'] ?? null);

        return response()->json(['data' => $lead]);
    }

    public function reopen(int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        if (!$lead->is_won && !$lead->is_lost) {
            return response()->json(['message' => 'Lead is not closed'], 422);
        }

        $lead = $this->crmService->reopen($lead);

        return response()->json(['data' => $lead]);
    }

    public function createContact(int $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        if ($lead->contact_id) {
            return response()->json(['message' => 'Contact already linked'], 422);
        }

        $contact = $lead->createContactFromLead();

        return response()->json([
            'data' => $lead->fresh(['stage', 'user', 'contact', 'tags']),
            'contact' => $contact,
        ]);
    }

    // =========================================================================
    // ACTIVITIES
    // =========================================================================

    public function storeActivity(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        $validated = $request->validate([
            'type' => 'required|in:call,email,meeting,task,deadline,note',
            'summary' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_due' => 'required|date',
            'time_due' => 'nullable|date_format:H:i',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $validated['user_id'] = $validated['user_id'] ?? auth()->id();

        $activity = $lead->activities()->create($validated);

        return response()->json(['data' => $activity->load('user')], 201);
    }

    public function updateActivity(Request $request, int $leadId, int $activityId): JsonResponse
    {
        $activity = Activity::where('lead_id', $leadId)->findOrFail($activityId);

        $validated = $request->validate([
            'type' => 'sometimes|in:call,email,meeting,task,deadline,note',
            'summary' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date_due' => 'sometimes|date',
            'time_due' => 'nullable|date_format:H:i',
            'done' => 'sometimes|boolean',
        ]);

        if (isset($validated['done']) && $validated['done'] && !$activity->done) {
            $validated['done_at'] = now();
        }

        $activity->update($validated);

        return response()->json(['data' => $activity->load('user')]);
    }

    public function destroyActivity(int $leadId, int $activityId): JsonResponse
    {
        $activity = Activity::where('lead_id', $leadId)->findOrFail($activityId);
        $activity->delete();

        return response()->json(null, 204);
    }

    public function markActivityDone(int $leadId, int $activityId): JsonResponse
    {
        $activity = Activity::where('lead_id', $leadId)->findOrFail($activityId);
        $activity->markDone();

        return response()->json(['data' => $activity->load('user')]);
    }

    // =========================================================================
    // REFERENCE DATA
    // =========================================================================

    public function stages(): JsonResponse
    {
        $stages = Stage::orderBy('sequence')->get();
        return response()->json(['data' => $stages]);
    }

    public function teams(): JsonResponse
    {
        $teams = Team::with('leader')->active()->get();
        return response()->json(['data' => $teams]);
    }

    public function tags(): JsonResponse
    {
        $tags = Tag::orderBy('name')->get();
        return response()->json(['data' => $tags]);
    }

    public function lostReasons(): JsonResponse
    {
        $reasons = LostReason::active()->orderBy('name')->get();
        return response()->json(['data' => $reasons]);
    }

    public function storeTag(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        $tag = Tag::create($validated);

        return response()->json(['data' => $tag], 201);
    }

    // =========================================================================
    // ANALYTICS
    // =========================================================================

    public function lostReasonsAnalysis(Request $request): JsonResponse
    {
        $analysis = $this->crmService->getLostReasonsAnalysis(
            $request->input('user_id'),
            $request->input('team_id'),
            $request->input('start_date'),
            $request->input('end_date')
        );

        return response()->json(['data' => $analysis]);
    }
}
