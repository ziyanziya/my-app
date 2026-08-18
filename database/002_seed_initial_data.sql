USE `elsirat_db`;

-- Seed levels
INSERT INTO `levels` (`id`,`slug`,`name`,`min_points`,`badge_icon`,`description`,`rank`) VALUES
(1,'beginner','مبتدئ',0,NULL,'المرحلة الأولى',1),
(2,'committed','ملتزم',100,NULL,'المستوى الثاني',2),
(3,'devout','تقي',500,NULL,'المستوى الثالث',3),
(4,'steadfast','ثابت',1500,NULL,'المستوى الرابع',4),
(5,'radiant','مضيء',4000,NULL,'المستوى الخامس',5)
ON DUPLICATE KEY UPDATE slug=VALUES(slug), name=VALUES(name), min_points=VALUES(min_points);

-- Seed categories
INSERT INTO `activity_categories` (`id`,`slug`,`name`,`description`,`sort_order`,`is_active`) VALUES
(1,'quran','القرآن','أنشطة قراءة القرآن',1,1),
(2,'adhkar','الأذكار','أذكار صباحية ومسائية',2,1),
(3,'prayer','الصلاة','أذكار بعد الصلاة وأنشطة الصلاة',3,1),
(4,'dua','الدعاء','أدعية وأذكار خاصة',4,1)
ON DUPLICATE KEY UPDATE slug=VALUES(slug), name=VALUES(name);

-- Seed activities
INSERT INTO `activities` (`id`,`slug`,`category_id`,`title`,`icon`,`default_time`,`recurrence`,`points`,`is_active`) VALUES
(1,'quran_reading',1,'قراءة القرآن','📖','08:00:00', JSON_OBJECT('type','daily','interval',1),20,1),
(2,'morning_adhkar',2,'أذكار الصباح','🕋','06:00:00', JSON_OBJECT('type','daily','interval',1),10,1),
(3,'dhuhr_reminder',3,'تذكير الظهر','🕌','12:30:00', JSON_OBJECT('type','daily','interval',1),5,1)
ON DUPLICATE KEY UPDATE title=VALUES(title), default_time=VALUES(default_time), points=VALUES(points);

-- Seed activity contents (Arabic)
INSERT INTO `activity_contents` (`activity_id`,`locale`,`title`,`body`,`is_default`,`version`) VALUES
(1,'ar','قراءة يومية للقرآن','اقرأ من القرآن ولو صفحة واحدة، وتدبر الآيات.',1,1),
(2,'ar','أذكار الصباح','أذكار الصباح: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر...',1,1),
(3,'ar','تذكير صلاة الظهر','تأكد من أداء صلاة الظهر في وقتها بأدب وخشوع.',1,1)
ON DUPLICATE KEY UPDATE body=VALUES(body);

-- Seed achievements
INSERT INTO `achievements` (`id`,`slug`,`title`,`description`,`criteria`,`points_reward`,`is_active`) VALUES
(1,'first_step','الخطوة الأولى','إتمام أول عادة','{"type":"complete_any","count":1}',10,1),
(2,'weekly_streak','سبعة أيام متتالية','إتمام نفس العادة 7 أيام متتابعة','{"type":"streak","days":7}',50,1)
ON DUPLICATE KEY UPDATE title=VALUES(title), criteria=VALUES(criteria);
