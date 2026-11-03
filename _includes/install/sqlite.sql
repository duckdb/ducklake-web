INSTALL ducklake;
INSTALL sqlite;

ATTACH 'ducklake:sqlite:metadata.sqlite'
    AS my_ducklake (DATA_PATH 'data/');

USE my_ducklake;
