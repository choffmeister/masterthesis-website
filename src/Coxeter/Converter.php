<?php

namespace Coxeter;

class Converter
{
    public static function getAutomorphismLatexDisplayName($automorphism)
    {
        if ($automorphism['name'] == 'id') {
            return '\\textrm{id}';
        } else {
            $permutatedIndices = explode(',', substr($automorphism['name'], 1, strlen($automorphism['name']) - 2));
            $unpermutatedIndices = array();
            for ($j = 1; $j <= count($permutatedIndices); $j++) $unpermutatedIndices[] = $j;

            $from = implode(',', array_map(function($s) {
                return 's_{'.$s.'}';
            }, $unpermutatedIndices));
            $to = implode(',', array_map(function($s) {
                return 's_{'.$s.'}';
            }, $permutatedIndices));

            return '(' . $from . ') \mapsto (' . $to . ')';
        }
    }
}