<?php

function autoload($className) {
    if (stripos($className, 'Coxeter\\') === 0) {
        $path = __DIR__.'/'.str_replace('\\', '/', $className) . '.php';

        require_once $path;
    }
}

spl_autoload_register('autoload');
