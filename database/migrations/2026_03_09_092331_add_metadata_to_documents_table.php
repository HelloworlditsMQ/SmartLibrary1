<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Add columns one by one with checks
            
            if (!Schema::hasColumn('documents', 'genre')) {
                $table->string('genre')->nullable()->after('file_size');
            }
            
            if (!Schema::hasColumn('documents', 'tags')) {
                $table->json('tags')->nullable()->after('genre');
            }
            
            if (!Schema::hasColumn('documents', 'description')) {
                $table->text('description')->nullable()->after('tags');
            }
            
            if (!Schema::hasColumn('documents', 'author')) {
                $table->string('author')->nullable()->after('description');
            }
            
            if (!Schema::hasColumn('documents', 'publication_year')) {
                $table->integer('publication_year')->nullable()->after('author');
            }
            
            if (!Schema::hasColumn('documents', 'language')) {
                $table->string('language')->default('en')->after('publication_year');
            }
            
            // Add user_id without foreign key constraint first (safer)
            if (!Schema::hasColumn('documents', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('language');
            }
        });

        // Add indexes separately (safer)
        Schema::table('documents', function (Blueprint $table) {
            try {
                $table->index('genre');
            } catch (\Exception $e) {
                // Index might already exist
            }
            
            try {
                $table->index('publication_year');
            } catch (\Exception $e) {
                // Index might already exist
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndexIfExists(['genre']);
            $table->dropIndexIfExists(['publication_year']);
            $table->dropIndexIfExists(['genre', 'created_at']);
            $table->dropIndexIfExists(['publication_year', 'genre']);
            
            // Drop columns
            $table->dropColumnIfExists('genre');
            $table->dropColumnIfExists('tags');
            $table->dropColumnIfExists('description');
            $table->dropColumnIfExists('author');
            $table->dropColumnIfExists('publication_year');
            $table->dropColumnIfExists('language');
            $table->dropColumnIfExists('user_id');
        });
    }
};