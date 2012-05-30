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

$app->get('/', function() use($app, $jade) {
    return $app['twig']->render('index.twig', array(
        'name' => $name,
    ));
});

$app->get('/groups', function(Request $request) use($app, $jade) {
    $groups = $app['db']->fetchAll('SELECT * FROM groups');

    return new JsonResponse($groups);
});

$app->get('/eq/{equation}', function($equation) use($app, $jade) {
    return $app['twig']->render('equation.twig', array(
        'equation' => $equation,
    ));
});

$app->error(function(Exception $exception, $code) use($app, $jade) {
    $title = isset(Response::$statusTexts[$code]) ? Response::$statusTexts[$code] : Response::$statusTexts[500];

    return new Response($app['twig']->render('error.twig', array(
        'title' => $title,
        'code' => $code,
        'exception' => $exception,
    )), $code);
});

$app->run();
