-- Локальная БД WibeStyle для dev (PostgreSQL).
-- Выполните от суперпользователя (postgres) в psql или DBeaver SQL Editor.

CREATE USER wibestyle WITH PASSWORD 'wibestyle';

CREATE DATABASE wibestyle OWNER wibestyle;

GRANT ALL PRIVILEGES ON DATABASE wibestyle TO wibestyle;

-- DBeaver / JDBC:
--   Host: localhost
--   Port: 5432
--   Database: wibestyle
--   User: wibestyle
--   Password: wibestyle
--   URL: jdbc:postgresql://localhost:5432/wibestyle
