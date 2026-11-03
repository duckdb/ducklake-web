-- Server: open the catalog database file
-- (e.g., duckdb metadata.ducklake) and run:
INSTALL quack;
CALL quack_serve('quack:localhost');

-- Client: use the token returned by quack_serve
INSTALL ducklake;
INSTALL quack;
CREATE SECRET (TYPE quack, TOKEN 'your_token',
    SCOPE 'quack:localhost');

ATTACH 'ducklake:quack:localhost'
    AS my_ducklake (DATA_PATH '/path/to/shared/data/');

USE my_ducklake;
