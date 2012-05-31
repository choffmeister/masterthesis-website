<?php

require_once __DIR__.'/../vendor/autoload.php';

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

$app->error(function(Exception $exception, $code) use($app) {
    $title = isset(Response::$statusTexts[$code]) ? Response::$statusTexts[$code] : Response::$statusTexts[500];

    return new Response($app['twig']->render('error.twig', array(
        'title' => $title,
        'code' => $code,
        'exception' => $exception,
    )), $code);
});

$app->run();
