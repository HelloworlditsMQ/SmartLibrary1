<?php

return [
    'hosts' => [env('ELASTICSEARCH_HOST', 'http://localhost:9200')],
    'retries' => 1,
];