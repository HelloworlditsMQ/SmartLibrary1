<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_name',
        'file_path',
        'file_size',
        'raw_text',
        'thumbnail_path',
        'extraction_method',
        'genre',
        'tags',
        'description',
        'author',
        'publication_year',
        'language',
        'user_id',
        'status',           // ADDED
        'rejection_reason', // ADDED
        'moderated_by',     // ADDED
        'moderated_at',     // ADDED
    ];

    protected $casts = [
        'tags' => 'array',
        'publication_year' => 'integer',
        'file_size' => 'integer',
        'moderated_at' => 'datetime', // ADDED
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ADDED: Moderator relationship
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    // ADDED: Status scopes
    public function scopePending(Builder $query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved(Builder $query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected(Builder $query)
    {
        return $query->where('status', 'rejected');
    }

    // ADDED: Check if user is owner
    public function isOwner(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    // ADDED: Check if can be edited (only pending or rejected)
    public function canBeEdited(): bool
    {
        return in_array($this->status, ['pending', 'rejected']);
    }

    // Existing scopes (keep these)
    public function scopeOfGenre(Builder $query, $genre)
    {
        return $query->when($genre, fn($q) => $q->where('genre', $genre));
    }

    public function scopeWithTags(Builder $query, $tags)
    {
        return $query->when($tags, function($q) use ($tags) {
            $tagArray = is_array($tags) ? $tags : explode(',', $tags);
            foreach ($tagArray as $tag) {
                $q->whereJsonContains('tags', trim($tag));
            }
        });
    }

    public function scopeOfYear(Builder $query, $year)
    {
        return $query->when($year, fn($q) => $q->where('publication_year', $year));
    }

    public function scopeSearch(Builder $query, $search)
    {
        return $query->when($search, function($q) use ($search) {
            $q->where(function($sub) use ($search) {
                $sub->where('original_name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('author', 'LIKE', "%{$search}%")
                    ->orWhere('raw_text', 'LIKE', "%{$search}%")
                    ->orWhereJsonContains('tags', $search);
            });
        });
    }

    public function scopeSortedBy(Builder $query, $sort = 'newest')
    {
        return match($sort) {
            'oldest' => $query->oldest(),
            'name_asc' => $query->orderBy('original_name', 'asc'),
            'name_desc' => $query->orderBy('original_name', 'desc'),
            'size_asc' => $query->orderBy('file_size', 'asc'),
            'size_desc' => $query->orderBy('file_size', 'desc'),
            'year_desc' => $query->orderBy('publication_year', 'desc'),
            'year_asc' => $query->orderBy('publication_year', 'asc'),
            default => $query->latest(),
        };
    }

    // Accessors
    public function getFileSizeFormattedAttribute()
    {
        $bytes = $this->file_size;
        if ($bytes >= 1073741824) return number_format($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576) return number_format($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024) return number_format($bytes / 1024, 2) . ' KB';
        return $bytes . ' bytes';
    }

    public function getTagsListAttribute()
    {
        return $this->tags ?? [];
    }

    // ADDED: Status badge color helper
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'approved' => 'green',
            'pending' => 'orange',
            'rejected' => 'red',
            default => 'gray',
        };
    }
}