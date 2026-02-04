<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Routes
|--------------------------------------------------------------------------
|
| All routes are handled by the React SPA. The SPA will handle routing
| client-side using React Router.
|
*/

// Catch all routes and serve the SPA
Route::get('/{any?}', function () {
    return view('spa');
})->where('any', '.*')->name('spa');
