<?php

return [
    /*
    |--------------------------------------------------------------------------
    | GoCardless Bank Account Data
    |--------------------------------------------------------------------------
    |
    | GoCardless (formerly Nordigen) provides PSD2-compliant Open Banking
    | access for EU and UK banks. Free tier: 50 connections.
    |
    | Get credentials at: https://bankaccountdata.gocardless.com/
    |
    */
    'gocardless' => [
        'secret_id' => env('GOCARDLESS_SECRET_ID'),
        'secret_key' => env('GOCARDLESS_SECRET_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Plaid
    |--------------------------------------------------------------------------
    |
    | Plaid provides bank connections primarily for US, Canada, UK, and
    | select EU countries. Free tier: 100 connections in development.
    |
    | Get credentials at: https://dashboard.plaid.com/
    |
    */
    'plaid' => [
        'client_id' => env('PLAID_CLIENT_ID'),
        'secret' => env('PLAID_SECRET'),
        'environment' => env('PLAID_ENVIRONMENT', 'sandbox'), // sandbox, development, production
    ],

    /*
    |--------------------------------------------------------------------------
    | Sync Settings
    |--------------------------------------------------------------------------
    */
    'sync' => [
        'default_interval_hours' => 6,
        'max_historical_days' => 90,
        'include_pending' => false,
    ],
];
