INSTALL ducklake;
INSTALL postgres;

ATTACH 'ducklake:postgres:dbname=your_db host=your_host'
    AS my_ducklake (DATA_PATH 'data/');

USE my_ducklake;
