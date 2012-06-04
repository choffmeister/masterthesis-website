<?php

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../src/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

$config = json_decode(file_get_contents(__DIR__.'/../config.json'), true);
$app = new Silex\Application();
if ($config['debug'] === true) {
    $app['debug'] = true;
    ini_set('display_errors', 1);
} else {
    $app['debug'] = false;
    ini_set('display_errors', 0);
}

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/../views',
));
$app->register(new Silex\Provider\DoctrineServiceProvider(), array(
    'db.options' => $config['db.options'],
    'db.dbal.class_path' => __DIR__.'/../vendor/doctrine-dbal/lib',
    'db.common.class_path' => __DIR__.'/../vendor/doctrine-common/lib',
));

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

    return new Response($weakOrdering['ordering'], 200, array('Content-type' => 'application/json'));
});

$app->post('/api/v1/import', function(Request $request) use ($app) {
    $data = json_decode($request->getContent());

    if ($request->get('flush') == '1') {
        $app['db']->executeQuery('TRUNCATE weakorderings');
        $app['db']->executeQuery('TRUNCATE automorphisms');
        $app['db']->executeQuery('TRUNCATE groups');
    }

    foreach ($data as $group) {
        $app['db']->insert('groups', array(
           'name' => $group[0],
           'rank' => $group[1],
           'size' => $group[2],
           'matrix' => json_encode($group[3]),
        ));

        $groupId = $app['db']->lastInsertId();

        foreach ($group[4] as $automorphism) {
            $app['db']->insert('automorphisms', array(
                'group_id' => $groupId,
                'transpositions' => json_encode($automorphism[0]),
            ));

            $automorphismId = $app['db']->lastInsertId();

            $app['db']->insert('weakorderings', array(
                'group_id' => $groupId,
                'automorphism_id' => $automorphismId,
                'ordering' => json_encode($automorphism[1]),
            ));
        }
    }

    return new JsonResponse(true);
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
