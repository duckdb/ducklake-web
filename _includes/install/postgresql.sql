INSTALL ducklake;
INSTALL postgres;

ATTACH 'ducklake:postgres:dbname=ducklake_catalog host=your_postgres_host'
    AS my_ducklake (DATA_PATH 'data/');
USE my_ducklake;
