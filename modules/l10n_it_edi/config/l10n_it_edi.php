<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Italian E-Invoicing (FatturaPA) Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Italian electronic invoicing system (SDI)
    | Supports Aruba as the primary provider for sending/receiving
    |
    */

    // Default provider: 'aruba' or 'test'
    'provider' => env('L10N_IT_EDI_PROVIDER', 'test'),

    // Aruba configuration (https://fatturapa.aruba.it)
    'aruba' => [
        'environment' => env('ARUBA_ENVIRONMENT', 'test'), // 'test' or 'production'
        'username' => env('ARUBA_USERNAME'),
        'password' => env('ARUBA_PASSWORD'),
        
        // API endpoints
        'endpoints' => [
            'test' => [
                'upload' => 'https://testservizi.fatturapa.aruba.it/services/invoice/upload',
                'status' => 'https://testservizi.fatturapa.aruba.it/services/invoice/getByFilename',
                'notifications' => 'https://testservizi.fatturapa.aruba.it/services/invoice/listNotifications',
                'download' => 'https://testservizi.fatturapa.aruba.it/services/invoice/getByFilename',
            ],
            'production' => [
                'upload' => 'https://ws.fatturapa.aruba.it/services/invoice/upload',
                'status' => 'https://ws.fatturapa.aruba.it/services/invoice/getByFilename',
                'notifications' => 'https://ws.fatturapa.aruba.it/services/invoice/listNotifications',
                'download' => 'https://ws.fatturapa.aruba.it/services/invoice/getByFilename',
            ],
        ],
    ],

    // Company fiscal information (required for FatturaPA)
    'company' => [
        'regime_fiscale' => env('L10N_IT_REGIME_FISCALE', 'RF01'), // Ordinario
        'codice_fiscale' => env('L10N_IT_CODICE_FISCALE'),
        'partita_iva' => env('L10N_IT_PARTITA_IVA'),
        
        // REA (Registro delle Imprese) information
        'rea_office' => env('L10N_IT_REA_OFFICE'), // Province code (e.g., 'RM')
        'rea_number' => env('L10N_IT_REA_NUMBER'),
        'share_capital' => env('L10N_IT_SHARE_CAPITAL'),
        'sole_shareholder' => env('L10N_IT_SOLE_SHAREHOLDER', 'NO'), // SM (socio unico), NO
        'liquidation_state' => env('L10N_IT_LIQUIDATION_STATE', 'LN'), // LN (non in liquidazione), LS
    ],

    // Conservazione Sostitutiva (Digital Preservation)
    'conservazione' => [
        'enabled' => env('L10N_IT_CONSERVAZIONE_ENABLED', false),
        'provider' => env('L10N_IT_CONSERVAZIONE_PROVIDER', 'aruba'),
    ],

    // FatturaPA XML settings
    'fatturapa' => [
        'version' => '1.2.2',
        'format_trasmissione' => [
            'pa' => 'FPA12', // Public Administration
            'b2b' => 'FPR12', // Business to Business
        ],
        'document_types' => [
            'out_invoice' => 'TD01', // Fattura
            'out_refund' => 'TD04',  // Nota di credito
            'in_invoice' => 'TD01',
            'in_refund' => 'TD04',
            'self_invoice' => 'TD17', // Autofattura
        ],
        'payment_methods' => [
            'bank_transfer' => 'MP05', // Bonifico
            'credit_card' => 'MP08',   // Carta di pagamento
            'cash' => 'MP01',          // Contanti
            'check' => 'MP02',         // Assegno
            'direct_debit' => 'MP19',  // SEPA Direct Debit
            'other' => 'MP05',
        ],
    ],

    // Tax exemption codes (Natura)
    'natura_codes' => [
        'N1' => 'Escluse ex art. 15',
        'N2.1' => 'Non soggette - artt. da 7 a 7-septies DPR 633/72',
        'N2.2' => 'Non soggette - altri casi',
        'N3.1' => 'Non imponibili - esportazioni',
        'N3.2' => 'Non imponibili - cessioni intracomunitarie',
        'N3.3' => 'Non imponibili - cessioni verso San Marino',
        'N3.4' => 'Non imponibili - operazioni assimilate alle cessioni all\'esportazione',
        'N3.5' => 'Non imponibili - a seguito di dichiarazioni d\'intento',
        'N3.6' => 'Non imponibili - altre operazioni',
        'N4' => 'Esenti',
        'N5' => 'Regime del margine / IVA non esposta in fattura',
        'N6.1' => 'Inversione contabile - cessione di rottami e altri materiali di recupero',
        'N6.2' => 'Inversione contabile - cessione di oro e argento puro',
        'N6.3' => 'Inversione contabile - subappalto nel settore edile',
        'N6.4' => 'Inversione contabile - cessione di fabbricati',
        'N6.5' => 'Inversione contabile - cessione di telefoni cellulari',
        'N6.6' => 'Inversione contabile - cessione di prodotti elettronici',
        'N6.7' => 'Inversione contabile - prestazioni comparto edile e settori connessi',
        'N6.8' => 'Inversione contabile - operazioni settore energetico',
        'N6.9' => 'Inversione contabile - altri casi',
        'N7' => 'IVA assolta in altro stato UE',
    ],

    // Regime fiscale codes
    'regime_fiscale_codes' => [
        'RF01' => 'Ordinario',
        'RF02' => 'Contribuenti minimi (art.1, c.96-117, L. 244/07)',
        'RF04' => 'Agricoltura e attività connesse e pesca',
        'RF05' => 'Vendita sali e tabacchi',
        'RF06' => 'Commercio fiammiferi',
        'RF07' => 'Editoria',
        'RF08' => 'Gestione servizi telefonia pubblica',
        'RF09' => 'Rivendita documenti di trasporto pubblico e di sosta',
        'RF10' => 'Intrattenimenti, giochi e altre attività',
        'RF11' => 'Agenzie viaggi e turismo',
        'RF12' => 'Agriturismo',
        'RF13' => 'Vendite a domicilio',
        'RF14' => 'Rivendita beni usati, oggetti d\'arte, d\'antiquariato o da collezione',
        'RF15' => 'Agenzie di vendite all\'asta di oggetti d\'arte, antiquariato o da collezione',
        'RF16' => 'IVA per cassa P.A.',
        'RF17' => 'IVA per cassa',
        'RF18' => 'Altro',
        'RF19' => 'Regime forfettario',
    ],
];
