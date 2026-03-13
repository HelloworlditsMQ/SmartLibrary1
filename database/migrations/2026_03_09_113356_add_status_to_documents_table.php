<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('language');
            $table->text('rejection_reason')->nullable()->after('status');
            $table->foreignId('moderated_by')->nullable()->after('rejection_reason')->constrained('users')->onDelete('set null');
            $table->timestamp('moderated_at')->nullable()->after('moderated_by');
            
            // Index for faster queries
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropForeign(['moderated_by']);
            $table->dropColumn(['status', 'rejection_reason', 'moderated_by', 'moderated_at']);
        });
    }
};