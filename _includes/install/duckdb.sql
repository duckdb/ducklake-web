INSTALL ducklake;

ATTACH 'ducklake:metadata.ducklake'
    AS my_ducklake
    (DATA_PATH 'data/');

USE my_ducklake;
