# Star Battles - An AQA Computer Science A Level Project
A repository containing my final solution to my AQA A Level Computer Science Project.

Included in these files is all the code required to run the project.
To set up: you will need to use https://www.wampserver.com/en/ and place the files inside the Apache Server.

The system will use MariaDB to store the data, but a database and tables will need to be set up as such:
Database name: star_wars_project_db
Create table commands:

DROP TABLE IF EXISTS `static_objects`;
CREATE TABLE IF NOT EXISTS `static_objects` (
  `data` varchar(16000) NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

DROP TABLE IF EXISTS `user_actions`;
CREATE TABLE IF NOT EXISTS `user_actions` (
  `data` varchar(16000) NOT NULL,
  `time` double NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

DROP TABLE IF EXISTS `world_state`;
CREATE TABLE IF NOT EXISTS `world_state` (
  `data` varchar(16300) NOT NULL,
  `time` double NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

After this the project should be ready to use.

Credits:
  - Thanks to Daniel Anderson, for his amazing 3D TIE Fighter Model available on SketchFab
  https://sketchfab.com/DanielAndersson?utm_medium=embed&utm_campaign=share-popup&utm_content=79d9403f15334c129ea5454daffe6b5c
  Licensed under Attribution 4.0 International (CC BY 4.0)
  
  - Thanks to Andrey, for their really useful asteroid model avaibale on CGTrader
  https://www.cgtrader.com/andreylp88
  Licensed under Royalty Free Content
