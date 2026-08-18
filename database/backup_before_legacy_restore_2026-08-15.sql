-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: elsirat_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `elsirat_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `elsirat_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `elsirat_db`;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achievements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(150) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `criteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`criteria`)),
  `points_reward` int(10) unsigned DEFAULT 0,
  `badge_icon` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_achievements_slug` (`slug`),
  KEY `idx_achievements_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievements`
--

LOCK TABLES `achievements` WRITE;
/*!40000 ALTER TABLE `achievements` DISABLE KEYS */;
INSERT INTO `achievements` VALUES (1,'first_step','الخطوة الأولى','إتمام أول عادة','{\"type\":\"complete_any\",\"count\":1}',10,NULL,1,'2026-08-15 17:58:40.602','2026-08-15 17:58:40.602'),(2,'weekly_streak','سبعة أيام متتالية','إتمام نفس العادة 7 أيام متتابعة','{\"type\":\"streak\",\"days\":7}',50,NULL,1,'2026-08-15 17:58:40.602','2026-08-15 17:58:40.602'),(101,'light_100','شعاع النور الأول','الوصول إلى رصيد 100 نور مبارك','{\"type\":\"cumulative_light\",\"target\":100}',20,NULL,1,'2026-08-15 17:58:41.032','2026-08-15 17:58:41.032'),(102,'light_500','قبس الهدى','الوصول إلى رصيد 500 نور مبارك','{\"type\":\"cumulative_light\",\"target\":500}',50,NULL,1,'2026-08-15 17:58:41.032','2026-08-15 17:58:41.032'),(103,'light_1000','منارة الإيمان','الوصول إلى رصيد 1,000 نور مبارك','{\"type\":\"cumulative_light\",\"target\":1000}',100,NULL,1,'2026-08-15 17:58:41.032','2026-08-15 17:58:41.032'),(104,'light_5000','نور على نور','الوصول إلى رصيد 5,000 نور مبارك','{\"type\":\"cumulative_light\",\"target\":5000}',250,NULL,1,'2026-08-15 17:58:41.032','2026-08-15 17:58:41.032'),(105,'light_10000','تاج الاستقامة','الوصول إلى رصيد 10,000 نور مبارك','{\"type\":\"cumulative_light\",\"target\":10000}',500,NULL,1,'2026-08-15 17:58:41.032','2026-08-15 17:58:41.032');
/*!40000 ALTER TABLE `achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(150) NOT NULL,
  `category_id` int(10) unsigned DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `icon` varchar(200) DEFAULT NULL,
  `default_time` time DEFAULT NULL,
  `start_window` time DEFAULT NULL,
  `end_window` time DEFAULT NULL,
  `recurrence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recurrence`)),
  `points` int(10) unsigned NOT NULL DEFAULT 10,
  `points_cap` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `position` int(11) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activities_slug` (`slug`),
  KEY `idx_activities_category` (`category_id`),
  KEY `idx_activities_active` (`is_active`),
  CONSTRAINT `fk_activities_category` FOREIGN KEY (`category_id`) REFERENCES `activity_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'quran_reading',1,'قراءة القرآن','📖','08:00:00',NULL,NULL,'{\"type\": \"daily\", \"interval\": 1}',20,NULL,1,1,NULL,'2026-08-15 17:58:40.598','2026-08-15 17:58:40.779',NULL),(2,'morning_adhkar',2,'أذكار الصباح','🕋','06:00:00',NULL,NULL,'{\"type\": \"daily\", \"interval\": 1}',10,NULL,1,2,NULL,'2026-08-15 17:58:40.598','2026-08-15 17:58:40.779',NULL),(3,'dhuhr_reminder',3,'تذكير الظهر','🕌','12:30:00',NULL,NULL,'{\"type\": \"daily\", \"interval\": 1}',5,NULL,1,3,NULL,'2026-08-15 17:58:40.598','2026-08-15 17:58:40.779',NULL);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_categories`
--

DROP TABLE IF EXISTS `activity_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` smallint(5) unsigned DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activity_categories_slug` (`slug`),
  KEY `idx_activity_categories_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_categories`
--

LOCK TABLES `activity_categories` WRITE;
/*!40000 ALTER TABLE `activity_categories` DISABLE KEYS */;
INSERT INTO `activity_categories` VALUES (1,'quran','القرآن','أنشطة قراءة القرآن',1,1,'2026-08-15 17:58:40.594','2026-08-15 17:58:40.594'),(2,'adhkar','الأذكار','أذكار صباحية ومسائية',2,1,'2026-08-15 17:58:40.594','2026-08-15 17:58:40.594'),(3,'prayer','الصلاة','أذكار بعد الصلاة وأنشطة الصلاة',3,1,'2026-08-15 17:58:40.594','2026-08-15 17:58:40.594'),(4,'dua','الدعاء','أدعية وأذكار خاصة',4,1,'2026-08-15 17:58:40.594','2026-08-15 17:58:40.594');
/*!40000 ALTER TABLE `activity_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_contents`
--

DROP TABLE IF EXISTS `activity_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_contents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `activity_id` bigint(20) unsigned NOT NULL,
  `locale` varchar(10) NOT NULL DEFAULT 'ar',
  `title` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activity_contents_activity_locale_version` (`activity_id`,`locale`,`version`),
  KEY `idx_activity_contents_activity` (`activity_id`),
  CONSTRAINT `fk_activity_contents_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_contents`
--

LOCK TABLES `activity_contents` WRITE;
/*!40000 ALTER TABLE `activity_contents` DISABLE KEYS */;
INSERT INTO `activity_contents` VALUES (1,1,'ar','قراءة يومية للقرآن','اقرأ من القرآن ولو صفحة واحدة، وتدبر الآيات.',1,1,'2026-08-15 17:58:40.600','2026-08-15 17:58:40.600'),(2,2,'ar','أذكار الصباح','أذكار الصباح: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر...',1,1,'2026-08-15 17:58:40.600','2026-08-15 17:58:40.600'),(3,3,'ar','تذكير صلاة الظهر','تأكد من أداء صلاة الظهر في وقتها بأدب وخشوع.',1,1,'2026-08-15 17:58:40.600','2026-08-15 17:58:40.600');
/*!40000 ALTER TABLE `activity_contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_audit_logs`
--

DROP TABLE IF EXISTS `admin_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) unsigned NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` bigint(20) unsigned DEFAULT NULL,
  `before_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`before_data`)),
  `after_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`after_data`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_admin_audit_admin_created` (`admin_id`,`created_at`),
  KEY `idx_admin_audit_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_admin_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_audit_logs`
--

LOCK TABLES `admin_audit_logs` WRITE;
/*!40000 ALTER TABLE `admin_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `levels`
--

DROP TABLE IF EXISTS `levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `levels` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(64) NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` bigint(20) unsigned NOT NULL DEFAULT 0,
  `min_light` bigint(20) unsigned NOT NULL DEFAULT 0,
  `badge_icon` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `rank` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_levels_slug` (`slug`),
  UNIQUE KEY `ux_levels_min_points` (`min_points`),
  KEY `idx_levels_rank` (`rank`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `levels`
--

LOCK TABLES `levels` WRITE;
/*!40000 ALTER TABLE `levels` DISABLE KEYS */;
INSERT INTO `levels` VALUES (1,'beginner','مبتدئ',0,0,NULL,NULL,NULL,'المرحلة الأولى',1,1,'2026-08-15 17:58:40.591','2026-08-15 17:58:40.591'),(2,'committed','ملتزم',100,0,NULL,NULL,NULL,'المستوى الثاني',2,1,'2026-08-15 17:58:40.591','2026-08-15 17:58:40.591'),(3,'devout','تقي',500,0,NULL,NULL,NULL,'المستوى الثالث',3,1,'2026-08-15 17:58:40.591','2026-08-15 17:58:40.591');
/*!40000 ALTER TABLE `levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_achievement_conditions`
--

DROP TABLE IF EXISTS `light_achievement_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `light_achievement_conditions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `achievement_id` bigint(20) unsigned NOT NULL,
  `condition_type` enum('first_occurrence','cumulative_light','consecutive_days','event_count','completion_count','manual') NOT NULL,
  `source_scope` enum('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','light','system') DEFAULT NULL,
  `source_key` varchar(100) DEFAULT NULL,
  `target_value` decimal(12,2) DEFAULT NULL,
  `threshold` int(10) unsigned DEFAULT NULL,
  `window_days` int(10) unsigned DEFAULT NULL,
  `repeatable` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_achievement_conditions_uniq` (`achievement_id`,`condition_type`,`source_scope`,`source_key`),
  KEY `idx_light_achievement_conditions_achievement` (`achievement_id`),
  KEY `idx_light_achievement_conditions_type` (`condition_type`),
  KEY `idx_light_achievement_conditions_active` (`is_active`),
  CONSTRAINT `fk_light_achievement_conditions_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_achievement_conditions`
--

LOCK TABLES `light_achievement_conditions` WRITE;
/*!40000 ALTER TABLE `light_achievement_conditions` DISABLE KEYS */;
INSERT INTO `light_achievement_conditions` VALUES (1,101,'cumulative_light','light','total_awarded',100.00,100,NULL,0,1,NULL,'2026-08-15 17:58:41.033','2026-08-15 17:58:41.033'),(2,102,'cumulative_light','light','total_awarded',500.00,500,NULL,0,1,NULL,'2026-08-15 17:58:41.033','2026-08-15 17:58:41.033'),(3,103,'cumulative_light','light','total_awarded',1000.00,1000,NULL,0,1,NULL,'2026-08-15 17:58:41.033','2026-08-15 17:58:41.033'),(4,104,'cumulative_light','light','total_awarded',5000.00,5000,NULL,0,1,NULL,'2026-08-15 17:58:41.033','2026-08-15 17:58:41.033'),(5,105,'cumulative_light','light','total_awarded',10000.00,10000,NULL,0,1,NULL,'2026-08-15 17:58:41.033','2026-08-15 17:58:41.033');
/*!40000 ALTER TABLE `light_achievement_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_audit_logs`
--

DROP TABLE IF EXISTS `light_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `light_audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `worship_type` enum('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL,
  `worship_key` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `action` enum('award','spend','revoke','adjustment','audit') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `performed_by` bigint(20) unsigned DEFAULT NULL,
  `performed_by_type` enum('user','admin','system') NOT NULL DEFAULT 'system',
  `performed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_light_audit_logs_user` (`user_id`),
  KEY `idx_light_audit_logs_transaction` (`transaction_id`),
  KEY `idx_light_audit_logs_worship` (`worship_type`,`worship_key`),
  KEY `idx_light_audit_logs_performed_at` (`performed_at`),
  KEY `fk_light_audit_logs_performed_by` (`performed_by`),
  CONSTRAINT `fk_light_audit_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_light_audit_logs_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `light_transactions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_light_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_audit_logs`
--

LOCK TABLES `light_audit_logs` WRITE;
/*!40000 ALTER TABLE `light_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `light_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_rules`
--

DROP TABLE IF EXISTS `light_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `light_rules` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `source_scope` enum('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL DEFAULT 'system',
  `source_key` varchar(100) DEFAULT NULL,
  `base_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `multiplier` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `max_amount` decimal(10,2) DEFAULT NULL,
  `daily_limit` int(10) unsigned DEFAULT NULL,
  `cooldown_minutes` int(10) unsigned DEFAULT NULL,
  `repeatable` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_rules_slug` (`slug`),
  KEY `idx_light_rules_source` (`source_scope`,`source_key`),
  KEY `idx_light_rules_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_rules`
--

LOCK TABLES `light_rules` WRITE;
/*!40000 ALTER TABLE `light_rules` DISABLE KEYS */;
INSERT INTO `light_rules` VALUES (1,'daily_checkin','النشاط اليومي','نور يُمنح عند فتح التطبيق والتفاعل اليومي','daily_checkin','daily_checkin',10.00,1.0000,10.00,10,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(2,'all_worships_daily','إتمام جميع عبادات اليوم','مكافأة كبرى تُمنح عند إتمام كافة عبادات اليوم المحددة','all_worships','all_worships_daily',50.00,1.0000,50.00,50,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(3,'theory_section_completion','قراءة قسم نظري','نور يُمنح عند إتمام قراءة قسم تعليمي نظري','theory','generic_theory',15.00,1.0000,15.00,NULL,NULL,1,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(4,'practical_step_completion','إتمام خطوة تطبيقية','نور يُمنح عند تنفيذ خطوة عملية تطبيقية','practical','generic_practical',25.00,1.0000,25.00,NULL,NULL,1,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(5,'worship_fajr','صلاة الفجر','مكافأة أداء صلاة الفجر','prayer','fajr',20.00,1.0000,20.00,20,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(6,'worship_dhuhr','صلاة الظهر','مكافأة أداء صلاة الظهر','prayer','dhuhr',15.00,1.0000,15.00,15,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(7,'worship_asr','صلاة العصر','مكافأة أداء صلاة العصر','prayer','asr',15.00,1.0000,15.00,15,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(8,'worship_maghrib','صلاة المغرب','مكافأة أداء صلاة المغرب','prayer','maghrib',15.00,1.0000,15.00,15,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(9,'worship_isha','صلاة العشاء','مكافأة أداء صلاة العشاء','prayer','isha',15.00,1.0000,15.00,15,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(10,'worship_tahajjud','قيام الليل (التهجد)','مكافأة قيام الليل والتهجد','prayer','tahajjud',30.00,1.0000,30.00,30,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(11,'worship_duha','صلاة الضحى','مكافأة صلاة الأوابين (الضحى)','prayer','duha',15.00,1.0000,15.00,15,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(12,'worship_morning_adhkar','أذكار الصباح','مكافأة قراءة أذكار الصباح','prayer','morning_adhkar',10.00,1.0000,10.00,10,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031'),(13,'worship_evening_adhkar','أذكار المساء','مكافأة قراءة أذكار المساء','prayer','evening_adhkar',10.00,1.0000,10.00,10,NULL,0,1,NULL,'2026-08-15 17:58:41.031','2026-08-15 17:58:41.031');
/*!40000 ALTER TABLE `light_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `light_transactions`
--

DROP TABLE IF EXISTS `light_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `light_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `rule_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_type` enum('award','spend','revoke','adjustment') NOT NULL,
  `source_scope` enum('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL DEFAULT 'manual',
  `source_key` varchar(100) DEFAULT NULL,
  `external_reference` varchar(191) DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_transactions_user_idempotency` (`user_id`,`idempotency_key`),
  UNIQUE KEY `ux_light_transactions_user_reference` (`user_id`,`external_reference`),
  KEY `idx_light_transactions_user` (`user_id`),
  KEY `idx_light_transactions_rule` (`rule_id`),
  KEY `idx_light_transactions_type` (`transaction_type`),
  KEY `idx_light_transactions_created` (`created_at`),
  CONSTRAINT `fk_light_transactions_rule` FOREIGN KEY (`rule_id`) REFERENCES `light_rules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_light_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `light_transactions`
--

LOCK TABLES `light_transactions` WRITE;
/*!40000 ALTER TABLE `light_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `light_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `activity_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `channel` enum('push','email','sms') NOT NULL DEFAULT 'push',
  `scheduled_at` datetime(3) NOT NULL,
  `sent_at` datetime(3) DEFAULT NULL,
  `status` enum('scheduled','sent','failed','cancelled') NOT NULL DEFAULT 'scheduled',
  `delivery_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delivery_metadata`)),
  `retry_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_status` (`user_id`,`status`),
  KEY `idx_notifications_scheduled` (`scheduled_at`),
  KEY `fk_notifications_activity` (`activity_id`),
  CONSTRAINT `fk_notifications_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practical_step_media`
--

DROP TABLE IF EXISTS `practical_step_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `practical_step_media` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `practical_step_id` bigint(20) unsigned NOT NULL,
  `media_type` enum('upload','external_link') NOT NULL,
  `url` varchar(2048) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `order_index` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_practical_step_media_step_id` (`practical_step_id`),
  CONSTRAINT `fk_practical_step_media_step` FOREIGN KEY (`practical_step_id`) REFERENCES `practical_steps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practical_step_media`
--

LOCK TABLES `practical_step_media` WRITE;
/*!40000 ALTER TABLE `practical_step_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `practical_step_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practical_steps`
--

DROP TABLE IF EXISTS `practical_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `practical_steps` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `worship_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `required_days` int(10) unsigned NOT NULL DEFAULT 0,
  `reward_points` int(10) unsigned NOT NULL DEFAULT 0,
  `order_index` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_practical_steps_worship_id` (`worship_id`),
  CONSTRAINT `fk_practical_steps_worships` FOREIGN KEY (`worship_id`) REFERENCES `worships` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practical_steps`
--

LOCK TABLES `practical_steps` WRITE;
/*!40000 ALTER TABLE `practical_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `practical_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prayer_wheel_events`
--

DROP TABLE IF EXISTS `prayer_wheel_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prayer_wheel_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `label` varchar(191) NOT NULL,
  `anchor_type` enum('prayer','event') NOT NULL,
  `anchor_key` varchar(100) NOT NULL,
  `offset_minutes` smallint(6) NOT NULL DEFAULT 0,
  `duration_minutes` smallint(5) unsigned NOT NULL DEFAULT 15,
  `sort_order` smallint(5) unsigned NOT NULL,
  `reverse_text_direction` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_prayer_wheel_events_slug` (`slug`),
  KEY `idx_prayer_wheel_events_active_order` (`is_active`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_wheel_events`
--

LOCK TABLES `prayer_wheel_events` WRITE;
/*!40000 ALTER TABLE `prayer_wheel_events` DISABLE KEYS */;
INSERT INTO `prayer_wheel_events` VALUES (1,'maghrib_adhkar','أذكار المساء','prayer','maghrib',-30,20,10,1,1,'تبدأ قبل المغرب بنصف ساعة.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(2,'maghrib_sunnah','سنة المغرب','prayer','maghrib',15,10,30,1,1,'بعد صلاة المغرب.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(3,'surah_malik','سورة الملك','prayer','isha',15,15,45,1,1,'تأتي بعد صلاة العشاء.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(4,'isha_sunnah','سنة العشاء','prayer','isha',30,10,50,1,1,'بعد صلاة العشاء وقراءة سورة الملك.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(5,'qiyam_layl','قيام الليل','prayer','isha_fajr_midpoint',0,45,60,0,1,'يبدأ من منتصف الفترة بين العشاء والفجر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(6,'shaf_witr','الشفع والوتر','prayer','fajr',-180,15,70,0,1,'قبل الفجر بثلاث ساعات.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(7,'sleep_remembrance','أذكار النوم','event','shaf_witr',15,10,80,0,1,'تأتي بعد الشفع والوتر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(8,'tahajjud_prayer','صلاة التهجد','event','sleep_remembrance',10,45,90,0,1,'تبدأ مباشرة بعد أذكار النوم وتبقى في الثلث الأخير من الليل.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.687'),(9,'morning_supplication','الدعاء','event','tahajjud_prayer',45,15,100,0,1,'دعاء ما قبل الفجر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(10,'morning_quran','قراءة القرآن','prayer','fajr',15,20,120,1,1,'بعد الفجر بربع ساعة.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(11,'sunnah_umrah','سنة العمرة','event','morning_quran',20,15,130,1,1,'تبدأ بعد قراءة القرآن.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(12,'morning_adhkar','أذكار الصباح','event','sunnah_umrah',15,15,140,1,1,'تأتي بعد سنة العمرة.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(13,'duha_prayer','صلاة الضحى','prayer','sunrise',20,10,150,1,1,'بعد الشروق بعشرين دقيقة.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(14,'morning_dhikr_after_duha','الذكر','event','duha_prayer',10,15,160,1,1,'بعد صلاة الضحى.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(15,'sunnah_zawal','صلاة الزوال','prayer','dhuhr',-20,15,170,1,1,'قبل الظهر بعشرين دقيقة.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(16,'dhuhr_sunnah','سنة صلاة الظهر','prayer','dhuhr',10,15,190,0,1,'بعد صلاة الظهر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(17,'after_dhuhr_dhikr','الذكر','prayer','dhuhr',30,15,200,1,1,'بعد سنة صلاة الظهر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(18,'quran_daily','الورد اليومي','prayer','dhuhr',45,20,210,0,1,'بعد الظهر.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678'),(19,'daily_supplication','الدعاء','event','quran_daily',15,15,220,0,1,'بعد الورد اليومي.','2026-08-15 17:58:40.678','2026-08-15 17:58:40.678');
/*!40000 ALTER TABLE `prayer_wheel_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_refresh_tokens_token` (`token`),
  KEY `idx_refresh_tokens_user` (`user_id`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schema_migrations` (
  `filename` varchar(255) NOT NULL,
  `applied_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('001_create_schema.sql','2026-08-15 17:58:40.587'),('002_seed_initial_data.sql','2026-08-15 17:58:40.605'),('003_auth_tables.sql','2026-08-15 17:58:40.623'),('004_user_avatar.sql','2026-08-15 17:58:40.632'),('005_worships.sql','2026-08-15 17:58:40.642'),('006_user_worship_progress.sql','2026-08-15 17:58:40.658'),('007_seed_worships.sql','2026-08-15 17:58:40.664'),('008_prayer_wheel_events.sql','2026-08-15 17:58:40.683'),('009_adjust_sleep_and_tahajjud_timing.sql','2026-08-15 17:58:40.689'),('010_light_system.sql','2026-08-15 17:58:40.732'),('011_light_achievement_conditions.sql','2026-08-15 17:58:40.749'),('012_levels_light_fields.sql','2026-08-15 17:58:40.757'),('013_admin_portal.sql','2026-08-15 17:58:40.770'),('014_add_activity_position.sql','2026-08-15 17:58:40.781'),('015_worships_title_status.sql','2026-08-15 17:58:40.792'),('016_theory_sections.sql','2026-08-15 17:58:40.806'),('017_practical_steps.sql','2026-08-15 17:58:40.828'),('018_user_theory_progress.sql','2026-08-15 17:58:40.840'),('019_add_more_worships.sql','2026-08-15 17:58:40.845'),('020_worships_wheel_order.sql','2026-08-15 17:58:40.880'),('021_sync_worships_with_prayer_wheel.sql','2026-08-15 17:58:40.901'),('022_archive_duplicate_wheel_content.sql','2026-08-15 17:58:40.905'),('023_remove_theory_section_reading_time.sql','2026-08-15 17:58:40.908'),('024_practical_step_media.sql','2026-08-15 17:58:40.919'),('025_complete_light_system_features.sql','2026-08-15 17:58:41.035');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `scope` enum('user','global','admin') NOT NULL DEFAULT 'user',
  `setting_key` varchar(191) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value`)),
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_settings_user_key` (`user_id`,`setting_key`),
  KEY `idx_settings_scope` (`scope`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theory_sections`
--

DROP TABLE IF EXISTS `theory_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `theory_sections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `worship_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `order_index` int(10) unsigned NOT NULL DEFAULT 0,
  `reward_points` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_theory_sections_worship_id` (`worship_id`),
  CONSTRAINT `fk_theory_sections_worships` FOREIGN KEY (`worship_id`) REFERENCES `worships` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theory_sections`
--

LOCK TABLES `theory_sections` WRITE;
/*!40000 ALTER TABLE `theory_sections` DISABLE KEYS */;
/*!40000 ALTER TABLE `theory_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_achievements`
--

DROP TABLE IF EXISTS `user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_achievements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `achievement_id` bigint(20) unsigned NOT NULL,
  `unlocked_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_achievements_user_achievement` (`user_id`,`achievement_id`),
  KEY `idx_user_achievements_unlocked` (`unlocked_at`),
  KEY `idx_user_achievements_user` (`user_id`),
  KEY `fk_user_achievements_achievement` (`achievement_id`),
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_achievements`
--

LOCK TABLES `user_achievements` WRITE;
/*!40000 ALTER TABLE `user_achievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_light_stats`
--

DROP TABLE IF EXISTS `user_light_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_light_stats` (
  `user_id` bigint(20) unsigned NOT NULL,
  `current_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_awarded` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_spent` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_revoked` decimal(12,2) NOT NULL DEFAULT 0.00,
  `award_count` int(10) unsigned NOT NULL DEFAULT 0,
  `spend_count` int(10) unsigned NOT NULL DEFAULT 0,
  `current_streak_days` int(10) unsigned NOT NULL DEFAULT 0,
  `longest_streak_days` int(10) unsigned NOT NULL DEFAULT 0,
  `last_awarded_at` datetime(3) DEFAULT NULL,
  `last_spent_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_light_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_light_stats`
--

LOCK TABLES `user_light_stats` WRITE;
/*!40000 ALTER TABLE `user_light_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_light_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_practical_progress`
--

DROP TABLE IF EXISTS `user_practical_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_practical_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `worship_id` bigint(20) unsigned NOT NULL,
  `step_id` bigint(20) unsigned NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 1,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_practical_progress` (`user_id`,`step_id`),
  KEY `idx_user_practical_worship` (`user_id`,`worship_id`),
  KEY `fk_user_practical_worship` (`worship_id`),
  KEY `fk_user_practical_step` (`step_id`),
  CONSTRAINT `fk_user_practical_step` FOREIGN KEY (`step_id`) REFERENCES `practical_steps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_practical_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_practical_worship` FOREIGN KEY (`worship_id`) REFERENCES `worships` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_practical_progress`
--

LOCK TABLES `user_practical_progress` WRITE;
/*!40000 ALTER TABLE `user_practical_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_practical_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_progress`
--

DROP TABLE IF EXISTS `user_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `activity_id` bigint(20) unsigned NOT NULL,
  `date` date NOT NULL,
  `scheduled_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `status` enum('pending','completed','skipped','missed') NOT NULL DEFAULT 'pending',
  `points_awarded` int(10) unsigned DEFAULT 0,
  `streak_delta` int(11) DEFAULT 0,
  `source` enum('user','system','sync') NOT NULL DEFAULT 'user',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_progress_user_activity_date` (`user_id`,`activity_id`,`date`),
  KEY `idx_user_progress_user_date` (`user_id`,`date`),
  KEY `idx_user_progress_activity_date` (`activity_id`,`date`),
  KEY `idx_user_progress_status` (`status`),
  CONSTRAINT `fk_user_progress_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_user_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_progress`
--

LOCK TABLES `user_progress` WRITE;
/*!40000 ALTER TABLE `user_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_theory_progress`
--

DROP TABLE IF EXISTS `user_theory_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_theory_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `worship_id` bigint(20) unsigned NOT NULL,
  `section_id` bigint(20) unsigned NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_theory_progress` (`user_id`,`worship_id`),
  KEY `idx_user_theory_progress_section_id` (`section_id`),
  KEY `fk_utp_worship` (`worship_id`),
  CONSTRAINT `fk_utp_section` FOREIGN KEY (`section_id`) REFERENCES `theory_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_utp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_utp_worship` FOREIGN KEY (`worship_id`) REFERENCES `worships` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_theory_progress`
--

LOCK TABLES `user_theory_progress` WRITE;
/*!40000 ALTER TABLE `user_theory_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_theory_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_worship_progress`
--

DROP TABLE IF EXISTS `user_worship_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_worship_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `worship_id` bigint(20) unsigned NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_worship` (`user_id`,`worship_id`),
  KEY `fk_uwp_worship` (`worship_id`),
  CONSTRAINT `fk_uwp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_uwp_worship` FOREIGN KEY (`worship_id`) REFERENCES `worships` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_worship_progress`
--

LOCK TABLES `user_worship_progress` WRITE;
/*!40000 ALTER TABLE `user_worship_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_worship_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'UTC',
  `locale` varchar(10) NOT NULL DEFAULT 'ar',
  `level_id` smallint(5) unsigned DEFAULT NULL,
  `total_points` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `last_active_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(128) DEFAULT NULL,
  `verification_expires_at` datetime(3) DEFAULT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_expires_at` datetime(3) DEFAULT NULL,
  `avatar_url` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_uuid` (`uuid`),
  UNIQUE KEY `ux_users_email` (`email`),
  UNIQUE KEY `ux_users_phone` (`phone`),
  KEY `idx_users_level` (`level_id`),
  KEY `idx_users_last_active` (`last_active_at`),
  CONSTRAINT `fk_users_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worships`
--

DROP TABLE IF EXISTS `worships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `worships` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL DEFAULT '',
  `wheel_key` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `time` time DEFAULT NULL,
  `points` int(10) unsigned NOT NULL DEFAULT 0,
  `order` int(10) unsigned DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_worships_wheel_key` (`wheel_key`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worships`
--

LOCK TABLES `worships` WRITE;
/*!40000 ALTER TABLE `worships` DISABLE KEYS */;
INSERT INTO `worships` VALUES (1,'أذكار المساء','أذكار المساء','maghrib_adhkar','أذكار المساء اليومية بعد صلاة المغرب.','moon','published','18:00:00',5,1,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(2,'صلاة المغرب','صلاة المغرب','maghribPrayer','أداء صلاة المغرب في وقتها مع خشوع.','sun','published','18:00:00',5,2,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(3,'سنة المغرب','سنة المغرب','maghrib_sunnah','سنة صلاة المغرب بعد الفرائض.','star','published',NULL,3,3,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(4,'صلاة العشاء','صلاة العشاء','ishaPrayer','صلاة العشاء في وقتها مع حضور القلب.','moon','published','19:30:00',5,4,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(5,'سورة الملك','سورة الملك','surah_malik','قراءة سورة الملك بعد صلاة العشاء.','book','published',NULL,4,5,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(6,'سنة العشاء','سنة العشاء','isha_sunnah','أداء سنة صلاة العشاء بعد الفريضة.','star','published',NULL,3,6,1,'2026-08-15 17:58:40.661','2026-08-15 17:58:40.899'),(7,'قيام الليل','قيام الليل','qiyam_layl','صلاة قيام الليل والتسبيح والدعاء في الثلث الأخير.','moon','published','03:00:00',8,7,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(8,'الشفع والوتر','الشفع والوتر','shaf_witr','أداء صلاة الشفع والوتر بعد العشاء أو قبل النوم.','star','published',NULL,6,8,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(9,'أذكار النوم','أذكار النوم','sleep_remembrance','قراءة أذكار النوم قبل النوم لطلب الحفظ والرحمة.','moon','published','22:30:00',5,9,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(10,'صلاة التهجد','صلاة التهجد','tahajjud_prayer','صلاة التهجد بعد صلاة العشاء وقبل الفجر.','moon','published','03:30:00',8,10,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(11,'الدعاء','الدعاء','morning_supplication','دعاء وتضرع بعد الصلاة.','heart','published',NULL,5,11,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(12,'صلاة الفجر','صلاة الفجر','fajrPrayer','صلاة الفجر في وقتها مع بداية يوم جديد.','sun','published','05:00:00',5,12,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(13,'قراءة القرآن','قراءة القرآن','morning_quran','قراءة جزء من القرآن الكريم يومياً.','book','published',NULL,5,13,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(14,'سنة العمرة','سنة العمرة','sunnah_umrah','أداء سنة العمرة وأذكارها التقوية.','star','published',NULL,4,14,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(15,'أذكار الصباح','أذكار الصباح','morning_adhkar','قراءة أذكار الصباح لبدء اليوم بذكر الله.','sun','published','06:00:00',5,15,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(16,'صلاة الضحى','صلاة الضحى','duha_prayer','صلاة الضحى بعد شروق الشمس للدعاء والبركة.','sun','published','08:00:00',5,16,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(17,'الذكر','الذكر','morning_dhikr_after_duha','ذكر الله بعد الصلوات والأذكار اليومية.','heart','published',NULL,4,17,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(18,'صلاة الزوال','صلاة الزوال','sunnah_zawal','صلاة الزوال قبيل صلاة الظهر.','sun','published','12:00:00',5,18,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(19,'صلاة الظهر','صلاة الظهر','dhuhrPrayer','صلاة الظهر وسط اليوم في وقتها.','sun','published','13:00:00',5,19,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(20,'سنة صلاة الظهر','سنة صلاة الظهر','dhuhr_sunnah','سنة صلاة الظهر بعد الفريضة.','star','published',NULL,4,20,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(21,'الذكر','الذكر','after_dhuhr_dhikr','استمرار ذكر الله بعد الظهر والمساء.','heart','archived',NULL,4,21,0,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.904'),(22,'الورد اليومي','الورد اليومي','quran_daily','الورد اليومي من القرآن والأذكار.','book','published',NULL,5,22,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899'),(23,'الدعاء','الدعاء','daily_supplication','الدعاء في نهاية اليوم وبعد العبادة.','heart','archived',NULL,5,23,0,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.904'),(24,'صلاة العصر','صلاة العصر','asrPrayer','صلاة العصر في وقتها وقبل نهاية النهار.','sun','published','15:30:00',5,24,1,'2026-08-15 17:58:40.843','2026-08-15 17:58:40.899');
/*!40000 ALTER TABLE `worships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'elsirat_db'
--

--
-- Dumping routines for database 'elsirat_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-15 18:10:04
