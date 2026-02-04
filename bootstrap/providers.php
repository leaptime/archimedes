<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
    Modules\Core\CoreServiceProvider::class,
    Modules\Banking\BankingServiceProvider::class,
    Modules\L10nItEdi\L10nItEdiServiceProvider::class,
    Modules\CashBook\CashBookServiceProvider::class,
    Modules\Crm\CrmServiceProvider::class,
];
