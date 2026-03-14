<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('original_name');     // "Real-Time-Color-Based-Object-Tracking.pdf"
            $table->string('file_path');         // "documents/1771567367_Real-Time-Color-Based-Object-Tracking.pdf"
            $table->string('file_size')->nullable(); // file size in bytes
            $table->text('raw_text')->nullable();    // extracted text from OCR 
            $table->timestamps();                // created_at, updated_at
            $table->fullText('raw_text');        // for search (MySQL FULLTEXT index)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
