<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Invoice Number Prefix
    |--------------------------------------------------------------------------
    */
    'invoice_prefix' => env('INVOICE_PREFIX', 'INV-'),

    /*
    |--------------------------------------------------------------------------
    | Default Due Days
    |--------------------------------------------------------------------------
    */
    'default_due_days' => env('INVOICE_DEFAULT_DUE_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Default Tax Rate
    |--------------------------------------------------------------------------
    */
    'default_tax_rate' => env('INVOICE_DEFAULT_TAX_RATE', 0),

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    */
    'default_currency' => env('INVOICE_DEFAULT_CURRENCY', 'EUR'),

    /*
    |--------------------------------------------------------------------------
    | Company Information (for PDFs and Emails)
    |--------------------------------------------------------------------------
    */
    'company' => [
        'name' => env('COMPANY_NAME', config('app.name', 'My Company')),
        'address' => env('COMPANY_ADDRESS', '123 Business Street'),
        'city' => env('COMPANY_CITY', 'City'),
        'state' => env('COMPANY_STATE', ''),
        'zip' => env('COMPANY_ZIP', '12345'),
        'country' => env('COMPANY_COUNTRY', 'Country'),
        'phone' => env('COMPANY_PHONE', ''),
        'email' => env('COMPANY_EMAIL', ''),
        'website' => env('COMPANY_WEBSITE', ''),
        'vat' => env('COMPANY_VAT', ''),
        'logo' => env('COMPANY_LOGO', null), // Path to logo image
        'bank_name' => env('COMPANY_BANK_NAME', ''),
        'bank_iban' => env('COMPANY_BANK_IBAN', ''),
        'bank_bic' => env('COMPANY_BANK_BIC', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | PDF Settings
    |--------------------------------------------------------------------------
    */
    'pdf' => [
        'paper_size' => env('INVOICE_PDF_PAPER', 'a4'),
        'orientation' => env('INVOICE_PDF_ORIENTATION', 'portrait'),
    ],
];
