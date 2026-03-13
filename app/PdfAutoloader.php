<?php

spl_autoload_register(function ($class) {
    if (strpos($class, 'Smalot\\PdfParser\\') === 0) {
        $relativeClass = substr($class, 16); 
        $filePath = base_path('vendor/smalot/pdfparser/src/Smalot/PdfParser/' . str_replace('\\', '/', $relativeClass) . '.php');
        
        if (file_exists($filePath)) {
            require_once $filePath;
            return;
        }
    }
}, true, true);
