<?php

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../src/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

$app = new Silex\Application();
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/../views',
));
$app->register(new Silex\Provider\DoctrineServiceProvider(), array(
    'db.options' => array(
        'driver' => 'pdo_mysql',
        'host' => 'localhost',
        'user' => 'root',
        'password' => '',
        'dbname' => 'coxeter',
    ),
    'db.dbal.class_path' => __DIR__.'/../vendor/doctrine-dbal/lib',
    'db.common.class_path' => __DIR__.'/../vendor/doctrine-common/lib',
));
$app['debug'] = true;
ini_set('display_errors', 1);

$app->get('/', function() use($app) {
    return $app->redirect('/groups');
});

$app->get('/groups', function() use($app) {
    $groups = $app['db']->fetchAll('SELECT * FROM groups');

    return $app['twig']->render('groups.twig', array(
        'groups' => $groups,
    ));
});

$app->get('/group/{id}', function($id) use($app) {
    $group = $app['db']->fetchAssoc('SELECT * FROM groups WHERE id = ?', array($id));
    if (!$group) {
        return $app->abort(404, sprintf('Unknown group id %d', $id));
    }

    $k = 0;
    $upperTriangle = json_decode($group['matrix']);
    $matrix = array();

    for ($i = 0; $i < $group['rank']; $i++) $matrix[] = array();

    for ($i = 0; $i < $group['rank']; $i++) {
        $matrix[$i][$i] = 1;

        for ($j = $i + 1; $j < $group['rank']; $j++) {
            $matrix[$i][$j] = $upperTriangle[$k];
            $matrix[$j][$i] = $upperTriangle[$k];
            $k++;
        }
    }

    $group['matrix'] = $matrix;

    $automorphisms = $app['db']->fetchAll('SELECT * FROM automorphisms WHERE group_id = ?', array($id));

    for ($i = 0; $i < count($automorphisms); $i++) {
        $automorphisms[$i]['transpositions'] = json_decode($automorphisms[$i]['transpositions']);
    }

    return $app['twig']->render('group.twig', array(
        'group' => $group,
        'automorphisms' => $automorphisms,
    ));
});

$app->get('/weakordering/{groupId}/{automorphismId}', function($groupId, $automorphismId) use($app) {
    $group = $app['db']->fetchAssoc('SELECT * FROM groups WHERE id = ?', array($groupId));
    if (!$group) {
        return $app->abort(404, sprintf('Unknown group id %d', $groupId));
    }

    $automorphism = $app['db']->fetchAssoc('SELECT * FROM automorphisms WHERE id = ?', array($automorphismId));
    if (!$automorphism) {
        return $automorphism->abort(404, sprintf('Unknown automorphism id %d', $automorphismId));
    }
    $automorphism['transpositions'] = json_decode($automorphism['transpositions']);

    return $app['twig']->render('weakordering.twig', array(
        'group' => $group,
        'automorphism' => $automorphism,
    ));
});

$app->get('/weakordering/{groupId}/{automorphismId}/graph.json', function($groupId, $automorphismId) use($app) {
    $weakOrdering = $app['db']->fetchAssoc('SELECT * FROM weakorderings WHERE group_id = ? AND automorphism_id = ?', array($groupId, $automorphismId));

    if (!$weakOrdering) {
        return new JsonResponse(false);
    }

    return new JsonResponse(json_decode($weakOrdering['ordering']));
});

$app->get('/weakordering/{groupId}/{automorphismId}/graph.svg', function($groupId, $automorphismId) use($app) {
    $weakOrdering = $app['db']->fetchAssoc('SELECT * FROM weakorderings WHERE group_id = ? AND automorphism_id = ?', array($groupId, $automorphismId));

    if (!$weakOrdering) {
        return new Response('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="100">' .
            '<rect x="0" y="0" width="300" height="100" stroke="black" stroke-width="1" fill="white" />' .
            '<text x="150" y="50" style="text-anchor: middle; dominant-baseline: central;">Graph has not been calculated yet.</text>' .
            '</svg>',
            200, array('Content-type' => 'image/svg+xml'));
    }

    $weakOrderingGraph = new \Coxeter\WeakOrderingGraph(json_decode($weakOrdering['ordering']));

    return new Response($weakOrderingGraph->toSvg(), 200, array('Content-type' => 'image/svg+xml'));
});

$app->error(function(Exception $exception, $code) use($app) {
    $title = isset(Response::$statusTexts[$code]) ? Response::$statusTexts[$code] : Response::$statusTexts[500];

    return new Response($app['twig']->render('error.twig', array(
        'title' => $title,
        'code' => $code,
        'exception' => $exception,
    )), $code);
});

$app->run();
