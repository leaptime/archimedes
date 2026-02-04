<?php

namespace Modules\Banking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReconcileModel extends Model
{
    protected $fillable = [
        'name',
        'rule_type',
        'auto_reconcile',
        'to_check',
        'matching_order',
        'sequence',
        'active',
        'match_text_location_label',
        'match_text_location_note',
        'match_text_location_reference',
        'match_nature',
        'match_amount',
        'match_amount_min',
        'match_amount_max',
        'match_label',
        'match_label_param',
        'match_note',
        'match_note_param',
        'match_same_currency',
        'allow_payment_tolerance',
        'payment_tolerance_param',
        'payment_tolerance_type',
        'match_partner',
        'past_months_limit',
        'decimal_separator',
    ];

    protected $casts = [
        'auto_reconcile' => 'boolean',
        'to_check' => 'boolean',
        'active' => 'boolean',
        'match_text_location_label' => 'boolean',
        'match_text_location_note' => 'boolean',
        'match_text_location_reference' => 'boolean',
        'match_same_currency' => 'boolean',
        'allow_payment_tolerance' => 'boolean',
        'match_partner' => 'boolean',
        'match_amount_min' => 'decimal:2',
        'match_amount_max' => 'decimal:2',
        'payment_tolerance_param' => 'decimal:2',
    ];

    protected $attributes = [
        'rule_type' => 'writeoff_button',
        'auto_reconcile' => false,
        'to_check' => false,
        'matching_order' => 'old_first',
        'sequence' => 10,
        'active' => true,
        'match_text_location_label' => true,
        'match_text_location_note' => false,
        'match_text_location_reference' => false,
        'match_nature' => 'both',
        'match_same_currency' => true,
        'allow_payment_tolerance' => true,
        'payment_tolerance_param' => 0,
        'payment_tolerance_type' => 'percentage',
        'match_partner' => false,
        'past_months_limit' => 18,
        'decimal_separator' => '.',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(ReconcileModelLine::class)->orderBy('sequence');
    }

    public function partnerMappings(): HasMany
    {
        return $this->hasMany(ReconcileModelPartnerMapping::class);
    }

    public function matchesLine(BankStatementLine $line): bool
    {
        // Check amount nature
        if ($this->match_nature === 'amount_received' && $line->amount < 0) {
            return false;
        }
        if ($this->match_nature === 'amount_paid' && $line->amount > 0) {
            return false;
        }

        // Check amount conditions
        $absAmount = abs($line->amount);
        if ($this->match_amount) {
            switch ($this->match_amount) {
                case 'lower':
                    if ($absAmount >= $this->match_amount_min) return false;
                    break;
                case 'greater':
                    if ($absAmount <= $this->match_amount_min) return false;
                    break;
                case 'between':
                    if ($absAmount < $this->match_amount_min || $absAmount > $this->match_amount_max) return false;
                    break;
            }
        }

        // Check label matching
        if ($this->match_label && $this->match_label_param) {
            $text = $this->match_text_location_label ? ($line->payment_ref ?? '') : '';
            if (!$this->matchesText($text, $this->match_label, $this->match_label_param)) {
                return false;
            }
        }

        // Check partner requirement
        if ($this->match_partner && !$line->partner_id) {
            return false;
        }

        return true;
    }

    protected function matchesText(string $text, string $matchType, string $param): bool
    {
        $text = strtolower($text);
        $param = strtolower($param);

        switch ($matchType) {
            case 'contains':
                return str_contains($text, $param);
            case 'not_contains':
                return !str_contains($text, $param);
            case 'match_regex':
                return preg_match("/{$param}/i", $text) === 1;
            default:
                return true;
        }
    }

    public function findPartner(BankStatementLine $line): ?int
    {
        foreach ($this->partnerMappings as $mapping) {
            $matched = false;

            if ($mapping->payment_ref_regex && $line->payment_ref) {
                if (preg_match("/{$mapping->payment_ref_regex}/i", $line->payment_ref)) {
                    $matched = true;
                }
            }

            if ($mapping->narration_regex && $line->partner_name) {
                if (preg_match("/{$mapping->narration_regex}/i", $line->partner_name)) {
                    $matched = true;
                }
            }

            if ($matched) {
                return $mapping->partner_id;
            }
        }

        return null;
    }
}
