-- phpMyAdmin SQL Dump
-- version 3.5.0
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 31, 2012 at 04:22 PM
-- Server version: 5.5.22-0ubuntu1
-- PHP Version: 5.3.10-1ubuntu3.1

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `coxeter`
--

-- --------------------------------------------------------

--
-- Table structure for table `automorphisms`
--

CREATE TABLE IF NOT EXISTS `automorphisms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `transpositions` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=10 ;

--
-- Dumping data for table `automorphisms`
--

INSERT INTO `automorphisms` (`id`, `group_id`, `transpositions`) VALUES
(1, 3, '[]'),
(2, 3, '[[1,3]]'),
(3, 1, '[]'),
(4, 2, '[]'),
(5, 2, '[[1,2]]'),
(6, 4, '[]'),
(7, 4, '[[1,4],[2,3]]'),
(8, 5, '[]'),
(9, 5, '[[1,2]]');

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE IF NOT EXISTS `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `rank` int(11) NOT NULL,
  `size` int(11) NOT NULL,
  `matrix` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `name`, `rank`, `size`, `matrix`) VALUES
(1, 'A_1', 1, 2, '[]'),
(2, 'A_2', 2, 6, '[3]'),
(3, 'A_3', 3, 24, '[3,2,3]'),
(4, 'A_4', 4, 120, '[3,2,2,3,2,3]'),
(5, '\\tilde A_1', 2, 0, '[0]');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `automorphisms`
--
ALTER TABLE `automorphisms`
  ADD CONSTRAINT `automorphisms_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
