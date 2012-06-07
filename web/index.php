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
    $groups = $app['db']->fetchAll('SELECT * FROM groups ORDER BY name ASC');

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
        $automorphisms[$i]['display_name'] = Coxeter\Converter::getAutomorphismLatexDisplayName($automorphisms[$i]);
    }

    return $app['twig']->render('group.twig', array(
        'group' => $group,
        'automorphisms' => $automorphisms,
    ));
});

$app->get('/weakordering/{automorphismId}', function($automorphismId) use($app) {
    $automorphism = $app['db']->fetchAssoc('SELECT * FROM automorphisms WHERE id = ?', array($automorphismId));
    if (!$automorphism) {
        return $automorphism->abort(404, sprintf('Unknown automorphism id %d', $automorphismId));
    }

    $group = $app['db']->fetchAssoc('SELECT * FROM groups WHERE id = ?', array($automorphism['group_id']));
    if (!$group) {
        return $app->abort(404, sprintf('Unknown group id %d', $groupId));
    }

    $automorphism['display_name'] = Coxeter\Converter::getAutomorphismLatexDisplayName($automorphism);

    return $app['twig']->render('weakordering.twig', array(
        'automorphism' => $automorphism,
        'group' => $group,
    ));
});

$app->get('/api/v1/weakordering/{automorphismId}/graph', function($automorphismId) use($app) {
    $automorphism = $app['db']->fetchAssoc('SELECT * FROM automorphisms WHERE id = ?', array($automorphismId));

    if (!$automorphism) {
        return new JsonResponse(false);
    }

    $automorphism['display_name'] = Coxeter\Converter::getAutomorphismLatexDisplayName($automorphism);

    return new Response('[' . $automorphism['wk_vertices'] . ',' . $automorphism['wk_edges'] . ']', 200, array('Content-type' => 'application/json'));
});

$app->post('/api/v1/import', function(Request $request) use ($app) {
    if ($request->get('flush') == '1') {
        $app['db']->executeQuery('TRUNCATE automorphisms');
        $app['db']->executeQuery('TRUNCATE groups');
    }

    Coxeter\Importer::importZipFile($app['db'], $request->files->get('data')->__toString());
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
