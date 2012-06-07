<?php

namespace Coxeter;

class Importer
{
    public static function importZipFile($db, $filename)
    {
        $zip = new \ZipArchive();
        $zip->open($filename);

        $names = array();
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if (!preg_match('/^(?<name>.*)\-data$/i', $stat['name'], $match)) continue;
            $name = $match['name'];

            if (!in_array($name, $names)) {
                $names[] = $name;

                $dataRaw = $zip->getFromName(sprintf('%s-data', $name));
                $verticesRaw = $zip->getFromName(sprintf('%s-vertices', $name));
                $edgesRaw = $zip->getFromName(sprintf('%s-edges', $name));

                if (!$dataRaw) throw new \Exception(sprintf('Could not find file \'%s-data\'', $name));
                if (!$verticesRaw) throw new \Exception(sprintf('Could not find file \'%s-vertices\'', $name));
                if (!$edgesRaw) throw new \Exception(sprintf('Could not find file \'%s-edges\'', $name));

                self::importWeakOrdering($db, $dataRaw, $verticesRaw, $edgesRaw);
            }
        }

        $zip->close();
    }

    private static function importWeakOrdering($db, $dataRaw, $verticesRaw, $edgesRaw)
    {
        $data = json_decode($dataRaw);
        if (json_last_error() != JSON_ERROR_NONE) {
            throw new \Exception('Error while decoding json');
        }

        $groupId = 0;
        $group = $db->fetchAssoc('SELECT * FROM groups WHERE name = ?', array($data->name));
        if ($group) {
            $groupId = $group['id'];
        } else {
            $db->insert('groups', array(
                'name' => $data->name,
                'rank' => $data->rank,
                'generators' => json_encode($data->generators),
                'size' => $data->size == 'infinity' ? 0 : $data->size,
                'matrix' => json_encode($data->matrix),
            ));
            $groupId = $db->lastInsertId();
        }

        $db->insert('automorphisms', array(
            'group_id' => $groupId,
            'name' => $data->automorphism,
            'wk_size' => $data->wk_size == 'infinity' ? 0 : $data->wk_size,
            'wk_max_length' => $data->wk_max_length == 'infinity' ? 0 : $data->wk_max_length,
            'wk_vertices' => $verticesRaw,
            'wk_edges' => $edgesRaw
        ));

        printf("Imported %s.\n", $data->name);
    }
}