<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TestUploadController;
use App\Http\Controllers\AuthController;

// Public routes (no login needed)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (login required)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Document viewing/downloading (now protected)
    Route::get('/documents/{id}/download', [TestUploadController::class, 'download']);
    Route::get('/documents/{id}/view', [TestUploadController::class, 'view']);
    
    // Public library (only approved)
    Route::get('/documents/metadata', [TestUploadController::class, 'metadata']);
    Route::get('/documents/search', [TestUploadController::class, 'search']);
    Route::get('/documents', [TestUploadController::class, 'index']);
    
    // User uploads
    Route::post('/test-upload', [TestUploadController::class, 'store']);
    Route::get('/my-documents', [TestUploadController::class, 'myDocuments']);
    Route::put('/documents/{id}', [TestUploadController::class, 'update']);
    Route::delete('/documents/{id}', [TestUploadController::class, 'destroy']);
    
    // Admin routes
    Route::get('/admin/stats', [TestUploadController::class, 'adminStats']);
    Route::get('/admin/pending', [TestUploadController::class, 'pendingDocuments']);
    Route::post('/admin/approve/{id}', [TestUploadController::class, 'approve']);
    Route::post('/admin/reject/{id}', [TestUploadController::class, 'reject']);
    Route::post('/admin/bulk-action', [TestUploadController::class, 'bulkAction']);
});

Route::get('/test-ping', [TestUploadController::class, 'ping']);