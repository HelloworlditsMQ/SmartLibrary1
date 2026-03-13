<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Process;
use Elastic\Elasticsearch\ClientBuilder;
use App\Models\Document;

class TestUploadController extends Controller
{
    protected $elasticsearch;
    protected const ES_INDEX = 'documents';
    
    protected const GENRES = [
        'art', 'science', 'technology', 'literature', 'history', 
        'mathematics', 'physics', 'chemistry', 'biology', 'computer_science',
        'philosophy', 'economics', 'law', 'medicine', 'engineering',
        'other'
    ];

    public function __construct()
    {
        $this->elasticsearch = ClientBuilder::create()
            ->setHosts([env('ELASTICSEARCH_HOST', 'http://localhost:9200')])
            ->build();
        
    }

    private function ensureIndexExists()
    {
        try {
            if (!$this->elasticsearch->indices()->exists(['index' => self::ES_INDEX])) {
                $this->elasticsearch->indices()->create([
                    'index' => self::ES_INDEX,
                    'body' => [
                        'settings' => [
                            'number_of_shards' => 1,
                            'number_of_replicas' => 0,
                            'analysis' => [
                                'analyzer' => [
                                    'custom_analyzer' => [
                                        'type' => 'custom',
                                        'tokenizer' => 'standard',
                                        'filter' => ['lowercase', 'asciifolding']
                                    ]
                                ]
                            ]
                        ],
                        'mappings' => [
                            'properties' => [
                                'document_id' => ['type' => 'integer'],
                                'original_name' => [
                                    'type' => 'text',
                                    'analyzer' => 'custom_analyzer',
                                    'fields' => ['keyword' => ['type' => 'keyword']]
                                ],
                                'content' => ['type' => 'text', 'analyzer' => 'custom_analyzer'],
                                'genre' => ['type' => 'keyword'],
                                'tags' => ['type' => 'keyword'],
                                'author' => ['type' => 'text', 'analyzer' => 'custom_analyzer'],
                                'description' => ['type' => 'text', 'analyzer' => 'custom_analyzer'],
                                'publication_year' => ['type' => 'integer'],
                                'file_size' => ['type' => 'integer'],
                                'created_at' => ['type' => 'date'],
                                'status' => ['type' => 'keyword'] // ADDED for ES
                            ]
                        ]
                    ]
                ]);
            }
        } catch (\Exception $e) {
            error_log("ES Index creation failed: " . $e->getMessage());
        }
    }

    // ==================== EXISTING METHODS (MODIFIED) ====================

    /**
     * Get metadata for filters - MODIFIED to only show approved docs stats
     */
    public function metadata()
    {
        // Only count approved documents for public stats
        $genres = Document::approved()->whereNotNull('genre')
            ->distinct()
            ->pluck('genre')
            ->sort()
            ->values();
            
        $yearRange = [
            'min' => Document::approved()->min('publication_year'),
            'max' => Document::approved()->max('publication_year'),
        ];
        
        $allTags = Document::approved()->whereNotNull('tags')
            ->pluck('tags')
            ->flatten()
            ->countBy()
            ->sortDesc()
            ->take(20)
            ->keys();

        return response()->json([
            'genres' => $genres,
            'predefined_genres' => self::GENRES,
            'year_range' => $yearRange,
            'popular_tags' => $allTags,
            'sort_options' => [
                ['value' => 'newest', 'label' => 'Newest First'],
                ['value' => 'oldest', 'label' => 'Oldest First'],
                ['value' => 'name_asc', 'label' => 'Name (A-Z)'],
                ['value' => 'name_desc', 'label' => 'Name (Z-A)'],
                ['value' => 'size_desc', 'label' => 'Size (Large-Small)'],
                ['value' => 'size_asc', 'label' => 'Size (Small-Large)'],
                ['value' => 'year_desc', 'label' => 'Year (Newest)'],
                ['value' => 'year_asc', 'label' => 'Year (Oldest)'],
            ]
        ]);
    }

    /**
     * Public index - MODIFIED to only show APPROVED documents
     */
    public function index(Request $request)
    {
        $query = Document::approved() // ONLY APPROVED
            ->ofGenre($request->genre)
            ->withTags($request->tags)
            ->ofYear($request->year)
            ->search($request->search)
            ->sortedBy($request->sort);

        $documents = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'original_name' => $doc->original_name,
                    'file_path' => $doc->file_path,
                    'file_size' => $doc->file_size,
                    'file_size_formatted' => $doc->file_size_formatted,
                    'genre' => $doc->genre,
                    'tags' => $doc->tags,
                    'description' => $doc->description,
                    'author' => $doc->author,
                    'publication_year' => $doc->publication_year,
                    'language' => $doc->language,
                    'created_at' => $doc->created_at,
                    'extraction_method' => $doc->extraction_method,
                    'thumbnail_url' => $doc->thumbnail_path ? Storage::url($doc->thumbnail_path) : null,
                    'uploader' => $doc->user?->name ?? 'Unknown',
                    'status' => $doc->status, // Include for transparency
                ];
            }),
            'meta' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
            ]
        ]);
    }

    public function ping()
    {
        try {
            $health = $this->elasticsearch->cluster()->health();
            return response()->json([
                'message' => 'TestUploadController is alive',
                'elasticsearch' => 'connected',
                'cluster_status' => $health['status']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'TestUploadController is alive',
                'elasticsearch' => 'disconnected: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Public search - MODIFIED to only search APPROVED documents
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $genre = $request->get('genre');
        $tags = $request->get('tags');
        $year = $request->get('year');
        $sort = $request->get('sort', 'relevance');

        if (empty($query)) {
            return $this->index($request);
        }

        try {
            $esQuery = [
                'bool' => [
                    'must' => [
                        'multi_match' => [
                            'query' => $query,
                            'fields' => ['original_name^3', 'author^2', 'description^2', 'content', 'tags^2'],
                            'type' => 'best_fields',
                            'fuzziness' => 'AUTO'
                        ]
                    ],
                    'filter' => [
                        ['term' => ['status' => 'approved']] // ONLY APPROVED
                    ]
                ]
            ];

            if ($genre) {
                $esQuery['bool']['filter'][] = ['term' => ['genre' => $genre]];
            }
            if ($year) {
                $esQuery['bool']['filter'][] = ['term' => ['publication_year' => (int)$year]];
            }
            if ($tags) {
                $tagArray = is_array($tags) ? $tags : explode(',', $tags);
                foreach ($tagArray as $tag) {
                    $esQuery['bool']['filter'][] = ['term' => ['tags' => trim($tag)]];
                }
            }

            $sortOptions = match($sort) {
                'newest' => [['created_at' => ['order' => 'desc']]],
                'oldest' => [['created_at' => ['order' => 'asc']]],
                'name_asc' => [['original_name.keyword' => ['order' => 'asc']]],
                'name_desc' => [['original_name.keyword' => ['order' => 'desc']]],
                default => [['_score' => ['order' => 'desc']], ['created_at' => ['order' => 'desc']]]
            };

            $results = $this->elasticsearch->search([
                'index' => self::ES_INDEX,
                'body' => [
                    'query' => $esQuery,
                    'sort' => $sortOptions,
                    'highlight' => [
                        'fields' => [
                            'content' => ['fragment_size' => 150, 'number_of_fragments' => 3],
                            'description' => ['fragment_size' => 100, 'number_of_fragments' => 1]
                        ]
                    ]
                ]
            ]);

            $documentIds = collect($results['hits']['hits'])->pluck('_source.document_id')->toArray();
            
            $documents = Document::whereIn('id', $documentIds)
                ->where('status', 'approved') // Double check
                ->get()
                ->sortBy(function($doc) use ($documentIds) {
                    return array_search($doc->id, $documentIds);
                })
                ->values()
                ->map(function ($doc) use ($results) {
                    $hit = collect($results['hits']['hits'])->firstWhere('_source.document_id', $doc->id);
                    return [
                        'id' => $doc->id,
                        'original_name' => $doc->original_name,
                        'file_path' => $doc->file_path,
                        'file_size' => $doc->file_size,
                        'file_size_formatted' => $doc->file_size_formatted,
                        'genre' => $doc->genre,
                        'tags' => $doc->tags,
                        'description' => $doc->description,
                        'author' => $doc->author,
                        'publication_year' => $doc->publication_year,
                        'created_at' => $doc->created_at,
                        'extraction_method' => $doc->extraction_method,
                        'thumbnail_url' => $doc->thumbnail_path ? Storage::url($doc->thumbnail_path) : null,
                        'highlight' => $hit['highlight'] ?? null,
                        'score' => $hit['_score'] ?? null,
                    ];
                });

            return response()->json(['data' => $documents]);

        } catch (\Exception $e) {
            error_log("Elasticsearch search failed: " . $e->getMessage());
            
            // Fallback to database - ONLY APPROVED
            $documents = Document::approved()
                ->search($query)
                ->ofGenre($genre)
                ->withTags($tags)
                ->ofYear($year)
                ->sortedBy($sort === 'relevance' ? 'newest' : $sort)
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'original_name' => $doc->original_name,
                        'file_path' => $doc->file_path,
                        'file_size' => $doc->file_size,
                        'file_size_formatted' => $doc->file_size_formatted,
                        'genre' => $doc->genre,
                        'tags' => $doc->tags,
                        'description' => $doc->description,
                        'author' => $doc->author,
                        'publication_year' => $doc->publication_year,
                        'created_at' => $doc->created_at,
                        'extraction_method' => $doc->extraction_method,
                        'thumbnail_url' => $doc->thumbnail_path ? Storage::url($doc->thumbnail_path) : null,
                    ];
                });

            return response()->json(['data' => $documents, 'fallback' => true]);
        }
    }

        public function download(Request $request, $id)
    {
        $document = Document::findOrFail($id);
        $user = $request->user(); // Get user from request (Sanctum)
        
        $isOwner = $document->user_id === $user->id;
        $isAdmin = $user->isAdmin();
        
        // Owner can download their own (any status)
        // Anyone can download approved
        // Admin can download any
        if ($document->status !== 'approved' && !$isOwner && !$isAdmin) {
            abort(403, 'Document not available');
        }
        
        $fullPath = storage_path('app/public/' . $document->file_path);
        
        if (!file_exists($fullPath)) {
            abort(404, 'File not found');
        }
        
        return response()->download($fullPath, $document->original_name);
    }

    public function view(Request $request, $id)
{
    $document = Document::findOrFail($id);
    $user = $request->user();
    
    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }
    
    $isOwner = $document->user_id === $user->id;
    $isAdmin = $user->isAdmin();
    
    if ($document->status !== 'approved' && !$isOwner && !$isAdmin) {
        return response()->json(['message' => 'Document not available'], 403);
    }
    
    $fullPath = storage_path('app/public/' . $document->file_path);
    
    if (!file_exists($fullPath)) {
        return response()->json(['message' => 'File not found', 'path' => $fullPath], 404);
    }
    
    return response()->file($fullPath, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . $document->original_name . '"'
    ]);
}

    /**
     * Store - MODIFIED to set status='pending' by default
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf|max:51200',
            'genre' => 'nullable|string|in:' . implode(',', self::GENRES),
            'tags' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'author' => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1800|max:' . (date('Y') + 1),
            'language' => 'nullable|string|size:2',
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
        
        Storage::disk('public')->putFileAs('documents', $file, $filename);
        $path = 'documents/' . $filename;
        $fullPath = storage_path('app/public/' . $path);
        
        error_log("📁 PROCESSING: $fullPath");

        // Extract text
        $rawText = $this->extractTextFromPdf($fullPath);
        $extractionMethod = 'parser';
        
        if (empty($rawText) || strlen($rawText) < 100) {
            error_log("⚠️ Parser returned little/no text, trying OCR...");
            $ocrText = $this->extractTextWithOcr($fullPath);
            if ($ocrText) {
                $rawText = $ocrText;
                $extractionMethod = 'ocr';
            }
        }

        // Process tags
        $tags = null;
        if (!empty($validated['tags'])) {
            $tags = array_map('trim', explode(',', $validated['tags']));
            $tags = array_unique(array_filter($tags));
        }

        // Create document with PENDING status
        $document = Document::create([
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'raw_text' => $rawText,
            'extraction_method' => $extractionMethod,
            'thumbnail_path' => null,
            'genre' => $validated['genre'] ?? null,
            'tags' => $tags,
            'description' => $validated['description'] ?? null,
            'author' => $validated['author'] ?? null,
            'publication_year' => $validated['publication_year'] ?? null,
            'language' => $validated['language'] ?? 'en',
            'user_id' => $request->user()->id,
            'status' => 'pending', // DEFAULT TO PENDING
        ]);

        // Generate thumbnail
        $thumbnailPath = $this->generateThumbnail($fullPath, $document->id);
        if ($thumbnailPath) {
            $document->update(['thumbnail_path' => $thumbnailPath]);
        }

        // Index to Elasticsearch (with pending status)
        //$this->indexToElasticsearch($document, $rawText);

        return response()->json([
            'message' => 'File uploaded and pending approval',
            'document_id' => $document->id,
            'status' => 'pending',
            'file_name' => $filename,
            'extraction_method' => $extractionMethod,
            'has_thumbnail' => !!$thumbnailPath,
            'thumbnail_url' => $thumbnailPath ? Storage::url($thumbnailPath) : null,
            'text_preview' => substr($rawText ?: 'No text', 0, 200) . '...',
            'text_length' => strlen($rawText ?: 0),
            'metadata' => [
                'genre' => $document->genre,
                'tags' => $document->tags,
                'author' => $document->author,
            ]
        ]);
    }

    // ==================== NEW USER METHODS ====================

    /**
     * Get current user's documents (all statuses)
     */
    public function myDocuments(Request $request)
    {
        $user = $request->user();
        
        $documents = $user->documents()
            ->sortedBy($request->sort ?? 'newest')
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'original_name' => $doc->original_name,
                    'file_path' => $doc->file_path,
                    'file_size' => $doc->file_size,
                    'file_size_formatted' => $doc->file_size_formatted,
                    'genre' => $doc->genre,
                    'tags' => $doc->tags,
                    'description' => $doc->description,
                    'author' => $doc->author,
                    'publication_year' => $doc->publication_year,
                    'language' => $doc->language,
                    'status' => $doc->status,
                    'rejection_reason' => $doc->rejection_reason,
                    'created_at' => $doc->created_at,
                    'updated_at' => $doc->updated_at,
                    'extraction_method' => $doc->extraction_method,
                    'thumbnail_url' => $doc->thumbnail_path ? Storage::url($doc->thumbnail_path) : null,
                    'can_edit' => $doc->canBeEdited(),
                ];
            });

        return response()->json(['data' => $documents]);
    }

    /**
     * Update user's own document (only if pending or rejected)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);

        // Check ownership
        if (!$document->isOwner($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if can be edited
        if (!$document->canBeEdited()) {
            return response()->json(['message' => 'Cannot edit approved documents'], 403);
        }

        $validated = $request->validate([
            'genre' => 'nullable|string|in:' . implode(',', self::GENRES),
            'tags' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'author' => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1800|max:' . (date('Y') + 1),
            'language' => 'nullable|string|size:2',
        ]);

        // Process tags
        $tags = null;
        if (!empty($validated['tags'])) {
            $tags = array_map('trim', explode(',', $validated['tags']));
            $tags = array_unique(array_filter($tags));
        }

        // If was rejected, reset to pending for re-review
        $newStatus = $document->status === 'rejected' ? 'pending' : $document->status;

        $document->update([
            'genre' => $validated['genre'] ?? $document->genre,
            'tags' => $tags ?? $document->tags,
            'description' => $validated['description'] ?? $document->description,
            'author' => $validated['author'] ?? $document->author,
            'publication_year' => $validated['publication_year'] ?? $document->publication_year,
            'language' => $validated['language'] ?? $document->language,
            'status' => $newStatus,
            'rejection_reason' => null, // Clear rejection reason on resubmit
            'moderated_by' => null,
            'moderated_at' => null,
        ]);

        // Update Elasticsearch
        $this->indexToElasticsearch($document, $document->raw_text);

        return response()->json([
            'message' => 'Document updated successfully',
            'document' => $document->fresh(),
        ]);
    }

    /**
     * Delete user's own document
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);

        // Admin can delete any, user can only delete own
        if (!$user->isAdmin() && !$document->isOwner($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete files
        if ($document->thumbnail_path) {
            $thumbPath = storage_path('app/public/' . $document->thumbnail_path);
            if (file_exists($thumbPath)) {
                unlink($thumbPath);
            }
        }
        
        $fullPath = storage_path('app/public/' . $document->file_path);
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
        
        // Delete from Elasticsearch
        try {
            $this->elasticsearch->delete([
                'index' => self::ES_INDEX,
                'id' => $id
            ]);
        } catch (\Exception $e) {
            error_log("ES delete failed: " . $e->getMessage());
        }
        
        $document->delete();
        
        return response()->json(['message' => 'Document deleted']);
    }

    // ==================== NEW ADMIN METHODS ====================

    /**
     * Get all pending documents (admin only)
     */
    public function pendingDocuments(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->isAdmin()) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $documents = Document::pending()
        ->with('user')
        ->sortedBy($request->sort ?? 'oldest') // Oldest first (waiting longest)
        ->get()
        ->map(function ($doc) {
            $uploader = $doc->user; // may be null

            return [
                'id' => $doc->id,
                'original_name' => $doc->original_name,
                'file_path' => $doc->file_path,
                'file_size' => $doc->file_size,
                'file_size_formatted' => $doc->file_size_formatted,
                'genre' => $doc->genre,
                'tags' => $doc->tags,
                'description' => $doc->description,
                'author' => $doc->author,
                'publication_year' => $doc->publication_year,
                'language' => $doc->language,
                'created_at' => $doc->created_at,
                'extraction_method' => $doc->extraction_method,
                'thumbnail_url' => $doc->thumbnail_path ? Storage::url($doc->thumbnail_path) : null,
                'uploader' => $uploader ? [
                    'id' => $uploader->id,
                    'name' => $uploader->name,
                    'email' => $uploader->email,
                ] : [
                    'id' => null,
                    'name' => 'Unknown',
                    'email' => null,
                ],
                'raw_text_preview' => substr($doc->raw_text ?: '', 0, 500),
            ];
        });

    return response()->json(['data' => $documents]);
}


    /**
     * Get admin statistics
     */
    public function adminStats(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
    

        $stats = [
            'total' => Document::count(),
            'pending' => Document::pending()->count(),
            'approved' => Document::approved()->count(),
            'rejected' => Document::rejected()->count(),
            'today_uploads' => Document::whereDate('created_at', today())->count(),
            'pending_oldest_days' => Document::pending()->oldest()->first()?->created_at->diffInDays(now()) ?? 0,
        ];

        return response()->json($stats);
    }

    /**
     * Approve document (admin only)
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $document = Document::findOrFail($id);

        if ($document->status !== 'pending') {
            return response()->json(['message' => 'Document is not pending'], 400);
        }

        $document->update([
            'status' => 'approved',
            'moderated_by' => $user->id,
            'moderated_at' => now(),
            'rejection_reason' => null,
        ]);

        // Update Elasticsearch with new status
        $this->indexToElasticsearch($document, $document->raw_text);

        return response()->json([
            'message' => 'Document approved successfully',
            'document' => $document->fresh(),
        ]);
    }

    /**
     * Reject document (admin only)
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $document = Document::findOrFail($id);

        if ($document->status !== 'pending') {
            return response()->json(['message' => 'Document is not pending'], 400);
        }

        $document->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'moderated_by' => $user->id,
            'moderated_at' => now(),
        ]);

        // Update Elasticsearch (still indexed but status=rejected)
        $this->indexToElasticsearch($document, $document->raw_text);

        return response()->json([
            'message' => 'Document rejected',
            'document' => $document->fresh(),
        ]);
    }

    /**
     * Bulk approve/reject (admin only)
     */
    public function bulkAction(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:documents,id',
            'action' => 'required|in:approve,reject',
            'reason' => 'required_if:action,reject|string|max:500',
        ]);

        $documents = Document::whereIn('id', $validated['ids'])
            ->where('status', 'pending')
            ->get();

        $updated = 0;
        foreach ($documents as $doc) {
            if ($validated['action'] === 'approve') {
                $doc->update([
                    'status' => 'approved',
                    'moderated_by' => $user->id,
                    'moderated_at' => now(),
                ]);
            } else {
                $doc->update([
                    'status' => 'rejected',
                    'rejection_reason' => $validated['reason'],
                    'moderated_by' => $user->id,
                    'moderated_at' => now(),
                ]);
            }
            
            $this->indexToElasticsearch($doc, $doc->raw_text);
            $updated++;
        }

        return response()->json([
            'message' => "$updated documents " . ($validated['action'] === 'approve' ? 'approved' : 'rejected'),
            'updated_count' => $updated,
        ]);
    }

    // ==================== PRIVATE HELPER METHODS (UNCHANGED) ====================

    private function generateThumbnail($pdfPath, $documentId)
    {
        try {
            $check = Process::run(['pdftoppm', '-v']);
            if (!$check->successful() && !str_contains($check->errorOutput(), 'pdftoppm')) {
                error_log("⚠️ pdftoppm not available for thumbnails");
                return null;
            }

            $tempDir = sys_get_temp_dir();
            $outputBase = $tempDir . DIRECTORY_SEPARATOR . 'thumb_' . $documentId;
            
            $result = Process::run([
                'pdftoppm',
                '-jpeg',
                '-f', '1',
                '-l', '1',
                '-scale-to', '300',
                $pdfPath,
                $outputBase
            ]);

            if (!$result->successful()) {
                error_log("❌ Thumbnail generation failed: " . $result->errorOutput());
                return null;
            }

            $tempImage = $outputBase . '-1.jpg';
            
            if (!file_exists($tempImage)) {
                $files = glob($outputBase . '*.jpg');
                if (empty($files)) {
                    error_log("❌ No thumbnail image generated");
                    return null;
                }
                $tempImage = $files[0];
            }

            $thumbnailName = 'thumbnails/' . $documentId . '_' . time() . '.jpg';
            $thumbnailPath = storage_path('app/public/' . $thumbnailName);
            
            if (!is_dir(storage_path('app/public/thumbnails'))) {
                mkdir(storage_path('app/public/thumbnails'), 0755, true);
            }
            
            rename($tempImage, $thumbnailPath);
            
            foreach (glob($outputBase . '*') as $file) {
                @unlink($file);
            }
            
            error_log("✅ Thumbnail created: " . $thumbnailName);
            return $thumbnailName;

        } catch (\Exception $e) {
            error_log("💥 Thumbnail error: " . $e->getMessage());
            return null;
        }
    }

    private function indexToElasticsearch(Document $document, $text)
    {
        try {
            $this->elasticsearch->index([
                'index' => self::ES_INDEX,
                'id' => $document->id,
                'body' => [
                    'document_id' => $document->id,
                    'original_name' => $document->original_name,
                    'content' => $text ?? '',
                    'genre' => $document->genre,
                    'tags' => $document->tags ?? [],
                    'author' => $document->author,
                    'description' => $document->description,
                    'publication_year' => $document->publication_year,
                    'file_size' => $document->file_size,
                    'status' => $document->status, // INDEX STATUS
                    'created_at' => $document->created_at->toIso8601String()
                ]
            ]);
            error_log("✅ Indexed to Elasticsearch: doc {$document->id}");
        } catch (\Exception $e) {
            error_log("❌ Elasticsearch indexing failed: " . $e->getMessage());
        }
    }

    private function extractTextFromPdf($pdfPath)
    {
        if (!file_exists($pdfPath)) {
            error_log("❌ PDF MISSING: $pdfPath");
            return null;
        }

        if (!class_exists('Smalot\PdfParser\Parser')) {
            require_once base_path('app/PdfAutoloader.php');
            if (!class_exists('Smalot\PdfParser\Parser')) {
                error_log("❌ AUTOLOADER FAILED");
                return null;
            }
        }

        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($pdfPath);
            $text = $pdf->getText();
            $cleanText = trim(preg_replace('/\s+/', ' ', $text));
            
            error_log("📄 PARSER RESULT: " . strlen($cleanText) . " chars");
            return $cleanText;
            
        } catch (\Throwable $e) {
            error_log("💥 PARSER ERROR: " . $e->getMessage());
            return null;
        }
    }

    private function extractTextWithOcr($pdfPath)
    {
        try {
            if (!$this->isOcrAvailable()) {
                error_log("⚠️ OCR tools not available");
                return null;
            }

            $tempDir = sys_get_temp_dir();
            $baseName = 'ocr_' . uniqid();
            $outputBase = $tempDir . DIRECTORY_SEPARATOR . $baseName;

            $pdftoppmResult = Process::run([
                'pdftoppm',
                '-png',
                '-f', '1',
                '-l', '1',
                '-r', '300',
                $pdfPath,
                $outputBase
            ]);

            if (!$pdftoppmResult->successful()) {
                error_log("❌ pdftoppm failed: " . $pdftoppmResult->errorOutput());
                return null;
            }

            $imageFile = $outputBase . '-1.png';
            
            if (!file_exists($imageFile)) {
                $possibleFiles = glob($outputBase . '*.png');
                if (empty($possibleFiles)) {
                    error_log("❌ No image generated by pdftoppm");
                    return null;
                }
                $imageFile = $possibleFiles[0];
            }

            $tesseractResult = Process::run([
                'tesseract',
                $imageFile,
                'stdout',
                '-l', 'eng'
            ]);

            @unlink($imageFile);
            foreach (glob($outputBase . '*') as $file) {
                @unlink($file);
            }

            if ($tesseractResult->successful()) {
                $text = trim($tesseractResult->output());
                error_log("🔍 OCR RESULT: " . strlen($text) . " chars");
                return $text;
            } else {
                error_log("❌ Tesseract failed: " . $tesseractResult->errorOutput());
                return null;
            }

        } catch (\Exception $e) {
            error_log("💥 OCR ERROR: " . $e->getMessage());
            return null;
        }
    }

    private function isOcrAvailable()
    {
        $pdftoppmCheck = Process::run(['pdftoppm', '-v']);
        $hasPdftoppm = $pdftoppmCheck->successful() || str_contains($pdftoppmCheck->errorOutput(), 'pdftoppm');
        
        $tesseractCheck = Process::run(['tesseract', '--version']);
        $hasTesseract = $tesseractCheck->successful();
        
        return $hasPdftoppm && $hasTesseract;
    }
}