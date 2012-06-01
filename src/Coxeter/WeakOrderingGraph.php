<?php

namespace Coxeter;

class WeakOrderingGraph
{
    private $raw;
    private $generators;
    private $vertices;
    private $edges;
    private $levels;
    private $maxPerLevel;

    private $margin;
    private $spaceX;
    private $spaceY;

    public function __construct(array $raw, $margin = 75, $spaceX = 150, $spaceY = 75)
    {
        $this->margin = $margin;
        $this->spaceX = $spaceX;
        $this->spaceY = $spaceY;

        $this->raw = $raw;
        $this->generators = $this->raw[0];
        $this->vertices = $this->raw[1];
        $this->edges = $this->raw[2];

        $this->levels = array();
        for ($i = 0; $i < count($this->vertices); $i++) {
            $node = $this->vertices[$i][0];
            $length = $this->vertices[$i][1];

            if (!isset($this->levels[$length])) {
                $this->levels[$length] = array($length, array());
            }

            array_push($this->levels[$length][1], $i);
        }

        $this->maxPerLevel = 0;
        for ($i = 0; $i < count($this->levels); $i++) {
            if (count($this->levels[$i][1]) > $this->maxPerLevel) {
                $this->maxPerLevel = count($this->levels[$i][1]);
            }
        }
    }

    public function getSize()
    {
        $width = ($this->maxPerLevel - 1) * $this->spaceX + 2 * $this->margin;
        $height = (count($this->levels) - 1) * $this->spaceY + 2 * $this->margin;

        return array('width' => $width, 'height' => $height);
    }

    public function getVertexPosition($index)
    {
        $level = $this->vertices[$index][1];

        $levelIndex = -1;

        for ($i = 0; $i < count($this->levels[$level][1]); $i++) {
            if ($this->levels[$level][1][$i] == $index) {
                $levelIndex = $i;
                break;
            }
        }

        $x = ($levelIndex) * $this->spaceX + $this->margin + ($this->maxPerLevel - count($this->levels[$level][1])) * $this->spaceX / 2.0;
        $y = ($level) * $this->spaceY + $this->margin;

        return array('x' => $x, 'y' => $y);
    }

    public function toSvg()
    {
        $size = $this->getSize();

        $svg  = '<?xml version="1.0" encoding="UTF-8"?>';
        $svg .= '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' . $size['width'] . '" height="' . $size['height'] . '">';
        $svg .= '<rect x="0" y="0" width="' . $size['width'] . '" height="' . $size['height'] . '" stroke="black" stroke-width="1" fill="white" />';

        for ($i = 0; $i < count($this->edges); $i++) {
            $position1 = $this->getVertexPosition($this->edges[$i][0]);
            $position2 = $this->getVertexPosition($this->edges[$i][1]);
            $svg .= sprintf('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="black" stroke-width="1" />', $position1['x'], $position1['y'], $position2['x'], $position2['y']);
            $position3 = array(
                'x' => ($position1['x'] + $position2['x']) / 2.0,
                'y' => ($position1['y'] + $position2['y']) / 2.0,
            );

            $svg .= sprintf('<text x="%s" y="%s" style="text-anchor: middle; dominant-baseline: central;"><tspan text-decoration = "underline">%s</tspan></text>', $position3['x'], $position3['y'], $this->generators[$this->edges[$i][2]]);
        }

        for ($i = 0; $i < count($this->vertices); $i++) {
            $position = $this->getVertexPosition($i);
            $svg .= '<circle cx="' . $position['x'] . '" cy="' . $position['y'] . '" r="10" stroke="black" stroke-width="1" fill="white" />';
            $svg .= sprintf('<text x="%s" y="%s" style="text-anchor: middle; dominant-baseline: central;">%s</text>', $position['x'], $position['y'], $this->vertices[$i][0]);
        }

        $svg .= '</svg>';

        return $svg;
    }
}